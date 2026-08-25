## Context

The TimeCalendar build workflow publishes server and web images from `main` under both
the raw Git SHA and `main-$GITHUB_SHA`. The platform repository's preproduction image
updater accepts only `^main-[a-f0-9]{40}$` and writes the newest matching tags into its
Helm values. Production is deliberately pinned by a reviewed platform values change. It
currently runs server and web tag
`main-8df8e2018b086bd67507a4509d12f78d64b6ed62`; at triage, TimeCalendar `main` was
`8263d8d1f25142cde340f04a2c3b4e9bd531a059`. A release decision must resolve `main`
again rather than promote either snapshot blindly.

The target server image contains migration
`1787641039755-AddCalendarSyncPlannedAt`. Today it adds a non-null timestamp, rewrites
all calendar rows to `lastUpdatedAt + 30 minutes`, and builds an index. The image also
activates a five-minute BullMQ fan-out for calendars planned in the past and accessed in
the previous 14 days. Production has three server replicas; absent an environment
override each worker registers sync concurrency 10. Several ADE strategies can retry an
HTTP request internally, and the calendar job itself has retry policy, so calendar-job
throughput and HTTP-attempt rate are different quantities.

Lyon 1 requires at most one upstream fetch per calendar per hour. Runtime strategy
resolution returns 60 minutes, but two gaps prevent a proof today: the migration's
30-minute backfill can make a recently fetched Lyon row due early, and selection followed
by fetching is not an atomic claim, so concurrent requests or a BullMQ retry can fetch a
row after another worker has advanced its plan.

This change is prepared in the TimeCalendar repository. It may read the platform desired
state and runtime systems for evidence, but it must not edit the platform repository or
perform the production tag flip. URLs, tokens, resource ids, credentials, and raw event
data must never enter committed evidence.

## Goals / Non-Goals

**Goals:**

- establish an auditable chain from one resolved `main` commit to immutable server/web
  image digests and the exact preproduction workloads that consumed them;
- exercise the migration up and down on representative data and capture runtime and lock
  evidence before any production promotion;
- quantify the initial backlog and steady-state five-minute workload in calendar jobs and
  upstream HTTP attempts, with explicit capacity and abort gates;
- close and test the Lyon 1 first-wave, retry, and concurrent-caller gaps;
- give an operator copy/paste preproduction, promotion, observation, image-rollback, and
  destructive-schema-rollback procedure.

**Non-Goals:**

- changing GitHub Actions, Argo CD, the platform repository, Terraform, Kubernetes
  resources, or production desired state;
- performing a production tag flip, a destructive production migration rollback, or a
  live university load test;
- opportunistic application fixes, public API changes, mobile/Flutter work, or raw
  customer-data export;
- treating a moving tag, branch name, or successful build alone as release provenance.

## Decision 1 — Bind release evidence to one SHA and two registry digests

Immediately before a candidate is evaluated, resolve `refs/heads/main` from the remote
and require a full lowercase 40-character SHA. Find the successful
`ci-build-deploy.yml` run whose `headSha` equals that value. Record the server and web
`main-<sha>` manifest digests from GHCR, not merely the tag strings. The runbook then
checks all of the following in preproduction:

1. platform desired-state values contain the candidate tags for both components;
2. Argo CD reports the corresponding application revision synced and healthy;
3. Kubernetes pod specs name the candidate tags and container `imageID` values contain
   the recorded digests;
4. the server health endpoint answers and the expected migration row exists.

The TimeCalendar workflow owns building, testing, and publishing. The platform image
updater owns automatic preproduction tag consumption. Argo CD owns reconciliation. The
release operator owns evidence capture and the later reviewed production platform PR.

The server and web are proven separately because preproduction can legitimately observe
their tags at different instants. The soak begins only after both match the same candidate
SHA and their immutable digests. Evidence records commands and bounded outputs (SHA,
digest, status, counts, timestamps), never credentials or full environment dumps.

Alternatives rejected:

- Treating `main-latest` or the newest registry timestamp as the candidate is mutable and
  races new merges.
- Trusting platform values alone does not prove what a running container pulled.
- Adding a production deployment step to the TimeCalendar workflow removes the existing
  GitOps review boundary and is outside this issue.

## Decision 2 — Backfill every existing calendar with a conservative one-hour floor

Change the pending migration's frozen backfill to:

```sql
UPDATE "calendar"
SET "syncPlannedAt" = "lastUpdatedAt" + interval '60 minutes';
```

This one-time conservative floor guarantees that no existing Lyon 1 row becomes eligible
before one hour after its recorded last fetch. Applying it to every row avoids duplicating
the runtime school/URL strategy classifier in frozen SQL, including ambiguous calendars
with no school relation. Non-Lyon calendars can wait at most 30 extra minutes once; after
their next completed sync, the runtime default plans them at 30 minutes again.

The migration keeps the non-null default and index. A real PostgreSQL integration test
starts from a pre-migration calendar table with representative fresh/old, active/inactive,
generic/Lyon rows; it runs `up`, proves values/index/due selection, runs `down`, proves the
column and index are removed while base rows remain, and finishes by restoring the test
schema. The preproduction exercise records wall-clock duration and samples
`pg_stat_activity`/`pg_locks` while `up` and `down` run.

`ALTER TABLE` and ordinary `CREATE INDEX` require table locks, and the `UPDATE` rewrites
every row. Therefore a successful small local test is not a production lock budget. The
runbook captures preproduction row count, table/index size, runtime, blocked sessions, and
WAL change, then scales the decision conservatively. No production destructive `down` is
part of normal rollback.

Alternatives rejected:

- Keeping 30 minutes knowingly violates the first-wave Lyon limit.
- Encoding Lyon host/school matching in the migration duplicates mutable application
  policy in immutable SQL and can under-match private or legacy source shapes.
- Adding jitter in this migration obscures the one-hour invariant and hardcodes an
  unmeasured drain window. The operator instead measures the actual bucketed backlog and
  refuses promotion when capacity gates fail.

## Decision 3 — Atomically reserve an existing calendar before upstream I/O

Add one repository compare-and-set operation for existing calendars: update
`syncPlannedAt` to `claimTime + resolvedInterval` only where the calendar id matches and
the stored plan is earlier than or equal to `claimTime`. `CalendarSyncService.sync`
resolves the strategy interval, attempts this claim before calling the fetcher, and skips
the upstream request when another caller already owns the interval. Creation remains an
immediate fetch because no stored row exists yet.

The reservation is deliberately retained after fetch, transform, or persistence failure.
The existing final save may move the plan slightly later on success, but never earlier.
This makes a BullMQ retry and concurrent user/background calls observe a future plan and
complete without another upstream request. It also covers failures after an upstream
response but before content persistence—precisely where a post-fetch-only timestamp cannot
prove the Lyon promise.

Use the database clock in the conditional update and returned plan where practical so
replica clock skew cannot create a second claim. The comparison and update must be one SQL
statement; a read followed by a write is not a claim. Tests race two callers against one
due Lyon row, exercise a failed first job followed by BullMQ retry, and assert one fetch.
Existing normal-path tests continue to prove the 60-minute Lyon and 30-minute generic
plans.

Alternatives rejected:

- Setting BullMQ `attempts: 1` removes one retry source but does not protect concurrent
  client/background requests or post-fetch persistence failures.
- Rechecking the plan at job start is still a read race.
- A Redis distributed lock adds another state system when PostgreSQL already owns the
  scheduling invariant.

## Decision 4 — Model jobs, HTTP attempts, and queue stability separately

The checked-in runbook contains read-only SQL and metric queries which classify cohorts by
reviewed school code/domain buckets without outputting raw URLs. It records:

- total and 14-day-active calendars;
- initial due calendars after the proposed one-hour backfill, bucketed by five-minute
  eligibility time and bounded provider class;
- post-soak `syncPlannedAt` five-minute buckets for steady state;
- ready server replica count and actual `SYNC_QUEUE_CONCURRENCY`, giving nominal worker
  concurrency `C = replicas × per-pod concurrency` (currently expected to be `3 × 10`,
  but always re-read);
- BullMQ waiting/active/delayed/failed counts, oldest waiting age, completed job rate and
  p95 job duration;
- outgoing calendar HTTP attempt rate, latency/error ratio, attempts per calendar job,
  and the retry policy present at the resolved candidate SHA.

For each five-minute bucket, job capacity is
`C × 300 / p95_job_seconds`; the go gate requires the observed arrival rate and the
largest initial bucket to drain inside the documented observation window with headroom,
without increasing queue age. ADE HTTP rate is measured from outbound spans/counters and
cross-checked against `completed calendar jobs × attempts per job`; it is never inferred
from the currently untrustworthy aggregate `calendar_sync_total` alone. The worksheet must
show both expected and worst-case retry amplification from the candidate code.

Counts run inside a read-only, statement-time-limited transaction and return aggregates
only. No live source is fetched to estimate capacity.

## Decision 5 — Separate image rollback from destructive schema rollback

Normal emergency rollback changes only server/web image tags back to the previously
recorded immutable digests. The additive `syncPlannedAt` column and index remain. The old
image ignores them, and retaining the schema avoids another table lock/rewrite during an
incident. Before this is declared safe, preproduction must run the old image against the
migrated schema and pass health plus a representative sync request.

Migration `down` is a destructive recovery procedure: it drops the index and the derived
plan column. It is allowed only after the old image is serving, a database backup/restore
point is named, all writers are quiesced, and a human explicitly authorizes it. It is not
an automatic consequence of image rollback and not a go/no-go escape hatch.

The runbook uses staged observation windows: preproduction migration and soak; production
rollout health/migration watch; first five-minute fan-out windows; the first full Lyon
hour; and a longer steady-state window. Abort criteria include migration lock/runtime
budget breach, unhealthy/restarting pods, event-loop or memory regression, queue age/depth
growth, ADE error/request-rate breach, duplicate Lyon claims/fetches, and image/digest
mismatch.

## Risks / Trade-offs

- **[The global one-hour backfill delays generic updates by up to 30 minutes]** → Accept the
  bounded one-time delay to protect Lyon and reduce first-wave load; runtime plans restore
  the 30-minute generic cadence after one sync.
- **[The compare-and-set reservation can defer a calendar after a persistence failure]** →
  This is intentional upstream protection; last-good content remains available and the
  calendar retries at its normal interval with an observable failure.
- **[Three production pods may contend while running migrations on boot]** → Prove the
  actual preproduction startup/migration behavior, require exactly one successful migration
  record, and abort on duplicate execution or lock waits outside budget. Do not solve it by
  editing platform orchestration in this change.
- **[Preproduction volume differs from production]** → Combine measured preproduction
  service time/attempt ratios with production-safe aggregate counts and apply explicit
  headroom; never extrapolate from row count alone.
- **[A new merge moves `main` during soak]** → Bind every artifact and observation to the
  resolved SHA/digests. A changed target starts a new candidate record and soak.
- **[Operational commands can leak source URLs or secrets]** → Commit only aggregate,
  allowlisted queries; prohibit shell tracing and full pod/env dumps; redact command output
  before attaching evidence.

## Migration Plan

1. Implement and test the conservative migration backfill and atomic due-calendar claim.
2. Add the release runbook, capacity worksheet, and human promotion/evidence inbox note.
3. Run focused server migration, repository, calendar-sync, and fan-out tests; typecheck,
   lint, and prove no OpenAPI/generated-client drift.
4. Resolve one candidate SHA, verify its successful build and immutable image digests, let
   preproduction consume both images, run migration up/down on representative data, then
   restore `up` and soak using the committed gates.
5. Record sanitized preproduction evidence. The later production operator re-resolves the
   SHA and follows the runbook; no production tag change occurs in this PR.
6. On an incident, restore prior immutable image tags while retaining the additive schema.
   Consider destructive `down` only under the separate quiesced, backed-up procedure.

## Open Questions

None for implementation. If preproduction shows the migration exceeds its lock budget,
the initial queue cannot drain with headroom, retry amplification breaches an upstream
budget, or the old image cannot run against the retained schema, the Applier must record a
no-go and escalate to the Founding Engineer. It must not compensate with an unreviewed
workflow, platform, concurrency, or production change.
