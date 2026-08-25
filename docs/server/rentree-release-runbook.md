# Rentrée server/web release runbook

This is the operator contract for promoting one TimeCalendar `main` commit through
preproduction and, after human approval, production. It gathers evidence only: this
repository change does **not** change a production image tag.

Never enable shell tracing (`set -x`). Never capture credentials, complete environment
output, calendar URLs/query strings/tokens/resource ids, raw calendar rows, or event data.
Store only the bounded values named below and UTC timestamps.

## Ownership and immutable candidate

| Boundary | Owner | Evidence |
| --- | --- | --- |
| Tests and image publication | TimeCalendar CI | successful `ci-build-deploy.yml` run for one SHA |
| Immutable artifacts | TimeCalendar GHCR | separate server and web manifest digests |
| Preproduction desired tag | `lyrolab/platform` image updater | reviewed values at `main-<sha>` |
| Runtime reconciliation | Argo CD | synced/healthy revision and Kubernetes image IDs |
| Go/no-go and production PR | release operator | this worksheet and reviewed platform PR |

The historical triage baseline was
`main-8df8e2018b086bd67507a4509d12f78d64b6ed62`; `main` was
`8263d8d1f25142cde340f04a2c3b4e9bd531a059`. Neither is a future target. Resolve
the remote ref again for every candidate:

```bash
git fetch origin main
export CANDIDATE_SHA="$(git rev-parse --verify origin/main^{commit})"
if ! [[ "$CANDIDATE_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "candidate is not a lowercase 40-character SHA" >&2
  exit 1
fi

RUN_ID="$(gh run list --workflow ci-build-deploy.yml --branch main \
  --commit "$CANDIDATE_SHA" --status success --limit 1 \
  --json databaseId,headSha,conclusion \
  --jq 'select(length == 1 and .[0].headSha == env.CANDIDATE_SHA and .[0].conclusion == "success") | .[0].databaseId')"
test -n "$RUN_ID"
gh run view "$RUN_ID" --json url,headSha,conclusion,createdAt,updatedAt

SERVER_REF="ghcr.io/timecalendar/timecalendar:main-$CANDIDATE_SHA"
WEB_REF="ghcr.io/timecalendar/timecalendar-web:main-$CANDIDATE_SHA"
SERVER_DIGEST="$(docker buildx imagetools inspect "$SERVER_REF" --format '{{json .Manifest.Digest}}' | tr -d '"')"
WEB_DIGEST="$(docker buildx imagetools inspect "$WEB_REF" --format '{{json .Manifest.Digest}}' | tr -d '"')"
case "$SERVER_DIGEST:$WEB_DIGEST" in sha256:*:sha256:*) ;; *) exit 1 ;; esac
printf 'candidate=%s run=%s server_digest=%s web_digest=%s observed_at=%s\n' \
  "$CANDIDATE_SHA" "$RUN_ID" "$SERVER_DIGEST" "$WEB_DIGEST" "$(date -u +%FT%TZ)"
```

If `origin/main` changes, retain this record as an abandoned candidate and restart from
the new SHA. Do not mix evidence.

## Preproduction convergence

Set environment-specific, reviewed names without printing credentials:

```bash
export PLATFORM_REPO=/path/to/read-only/lyrolab-platform
export PREPROD_NAMESPACE=timecalendar-preprod
export PREPROD_ARGO_APP=timecalendar-preprod
export SERVER_DEPLOYMENT=timecalendar
export WEB_DEPLOYMENT=timecalendar-web
```

Read desired state and runtime state. Adjust only the reviewed values-file paths and
container names to the platform repository; do not edit that repository during evidence
collection.

```bash
git -C "$PLATFORM_REPO" fetch origin main
git -C "$PLATFORM_REPO" grep -n "main-$CANDIDATE_SHA" origin/main -- \
  'kubernetes/clusters/**/timecalendar-preprod/*.yaml'

argocd app get "$PREPROD_ARGO_APP" -o json | jq '{revision:.status.sync.revision,sync:.status.sync.status,health:.status.health.status}'
kubectl -n "$PREPROD_NAMESPACE" rollout status deployment/"$SERVER_DEPLOYMENT" --timeout=10m
kubectl -n "$PREPROD_NAMESPACE" rollout status deployment/"$WEB_DEPLOYMENT" --timeout=10m
kubectl -n "$PREPROD_NAMESPACE" get pods -l app.kubernetes.io/name=timecalendar \
  -o json | jq --arg sha "$CANDIDATE_SHA" '[.items[] | {pod:.metadata.name,images:[.spec.containers[].image],imageIDs:[.status.containerStatuses[].imageID],ready:(.status.conditions[] | select(.type=="Ready").status)}]'
kubectl -n "$PREPROD_NAMESPACE" get pods -l app.kubernetes.io/name=timecalendar-web \
  -o json | jq --arg sha "$CANDIDATE_SHA" '[.items[] | {pod:.metadata.name,images:[.spec.containers[].image],imageIDs:[.status.containerStatuses[].imageID],ready:(.status.conditions[] | select(.type=="Ready").status)}]'
```

Every server pod spec must contain `main-$CANDIDATE_SHA` and its `imageID` must contain
`$SERVER_DIGEST`; every web pod must similarly match `$WEB_DIGEST`. Both workloads must
match the same SHA before soak begins.

```bash
curl --fail --silent --show-error "https://PREPROD_HOST/health" >/dev/null
kubectl -n "$PREPROD_NAMESPACE" exec deploy/"$SERVER_DEPLOYMENT" -- \
  npm run typeorm -- migration:show | grep 'AddCalendarSyncPlannedAt1787641039755'
```

## Migration `up -> down -> up` proof

Run on a representative non-production database. The final state is `up`. Capture a
backup/restore point before the exercise. Budgets: no blocked application session for
more than 5 seconds, no migration statement over 60 seconds, total migration under 120
seconds, and WAL growth below 25% of the pre-migration `calendar` relation size. Any
breach is a no-go, not permission to tune production live.

In one psql session:

```sql
\timing on
SELECT pg_current_wal_lsn() AS wal_before \gset
SELECT clock_timestamp() AS started_at,
       count(*) AS calendar_rows,
       pg_total_relation_size('public.calendar') AS calendar_relation_bytes,
       :'wal_before' AS wal_before
FROM calendar;

SELECT pid, state, wait_event_type, wait_event,
       cardinality(pg_blocking_pids(pid)) AS blocker_count
FROM pg_stat_activity
WHERE datname = current_database() AND pid <> pg_backend_pid();

SELECT a.pid, l.locktype, l.mode, l.granted,
       cardinality(pg_blocking_pids(a.pid)) AS blocker_count
FROM pg_stat_activity a
JOIN pg_locks l ON l.pid = a.pid
WHERE a.datname = current_database()
  AND (l.relation = 'public.calendar'::regclass OR cardinality(pg_blocking_pids(a.pid)) > 0)
ORDER BY a.pid, l.granted, l.mode;

-- Use the candidate image/CLI so migration history and code are SHA-bound.
-- npm run typeorm migration:run
SELECT "timestamp", "name" FROM migrations
WHERE "name" = 'AddCalendarSyncPlannedAt1787641039755';
SELECT count(*) FILTER (WHERE "syncPlannedAt" IS NULL) AS null_plans,
       min(EXTRACT(EPOCH FROM ("syncPlannedAt" - "lastUpdatedAt")) / 60) AS minimum_floor_minutes,
       to_regclass('public."IDX_calendar_syncPlannedAt"') IS NOT NULL AS index_exists
FROM calendar;

-- In the isolated proof database only:
-- npm run typeorm migration:revert
SELECT to_regclass('public."IDX_calendar_syncPlannedAt"') AS removed_index;
SELECT count(*) AS preserved_base_rows FROM calendar;

-- Restore final state:
-- npm run typeorm migration:run
SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), :'wal_before') AS wal_bytes,
       clock_timestamp() AS finished_at;
```

Sample `pg_stat_activity` and `pg_locks` from a second session while each command runs.
Record only aggregate counts, sizes, timings, lock modes, blocked-session count, and WAL
delta. CI also runs the real migration class over four representative rows (fresh/old,
active/inactive, generic/Lyon), checks the one-hour floor/index/due selection, drops only
the derived objects, preserves base rows, and restores `up` in `finally`.

Evidence format:

```text
result=GO|NO-GO rows=<count> relation_bytes=<bytes>
up_ms=<ms> down_ms=<ms> restore_up_ms=<ms> wal_bytes=<bytes>
lock_modes=<bounded list> max_blocked_sessions=<count> max_lock_wait_ms=<ms>
observed_at=<UTC> restore_point=<name, never a credential>
```

Local representative baseline on 2026-08-25 (four rows, isolated PostgreSQL worker
database): `relation_bytes=81920`, `up_ms=14.637`, `down_ms=7.935`,
`restore_up_ms=16.708`, `sampled_lock_modes=[]`, `blocked_sessions=0`, and
`wal_bytes=11984`. The committed migration test emits a fresh sanitized line on every
run. Local volume proves correctness only; it does not satisfy preproduction lock/WAL
gates.

## Production-safe fan-out counts

Run exactly as a read-only, time-limited transaction. These queries emit aggregates only.
The reviewed provider buckets intentionally include `custom` and `unknown`; never add a
raw URL to output.

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

WITH classified AS (
  SELECT c.id, c."lastUpdatedAt", c."lastAccessedAt", c."syncPlannedAt",
    CASE
      WHEN s.code = 'univlyon1' OR lower(c.url) LIKE '%://%.univ-lyon1.fr/%' THEN 'lyon1'
      WHEN s.code IN ('amu', 'tours', 'rouen') THEN s.code
      WHEN s.code IS NOT NULL THEN 'other_reviewed_school'
      WHEN c."schoolName" IS NOT NULL THEN 'custom'
      ELSE 'unknown'
    END AS provider
  FROM calendar c LEFT JOIN school s ON s.id = c."schoolId"
)
SELECT provider,
       count(*) AS total,
       count(*) FILTER (WHERE "lastAccessedAt" >= now() - interval '14 days') AS active_14d
FROM classified GROUP BY provider ORDER BY provider;

WITH classified AS (
  SELECT c.id, c."lastUpdatedAt", c."lastAccessedAt",
    CASE
      WHEN s.code = 'univlyon1' OR lower(c.url) LIKE '%://%.univ-lyon1.fr/%' THEN 'lyon1'
      WHEN s.code IN ('amu', 'tours', 'rouen') THEN s.code
      WHEN s.code IS NOT NULL THEN 'other_reviewed_school'
      WHEN c."schoolName" IS NOT NULL THEN 'custom'
      ELSE 'unknown'
    END AS provider
  FROM calendar c LEFT JOIN school s ON s.id = c."schoolId"
), proposed AS (
  SELECT provider, "lastAccessedAt", "lastUpdatedAt" + interval '60 minutes' AS due_at
  FROM classified
)
SELECT provider,
       to_timestamp(floor(extract(epoch FROM due_at) / 300) * 300) AS due_bucket,
       count(*) AS calendars
FROM proposed
WHERE "lastAccessedAt" >= now() - interval '14 days'
GROUP BY provider, due_bucket ORDER BY due_bucket, provider;

SELECT to_timestamp(floor(extract(epoch FROM "syncPlannedAt") / 300) * 300) AS due_bucket,
       count(*) AS calendars
FROM calendar
WHERE "lastAccessedAt" >= now() - interval '14 days'
GROUP BY due_bucket ORDER BY due_bucket;
COMMIT;
```

## Runtime capacity worksheet

Capture ready replicas and the actual per-pod value; absence means the candidate-code
default must be confirmed, not assumed:

```bash
kubectl -n "$PREPROD_NAMESPACE" get deployment "$SERVER_DEPLOYMENT" \
  -o json | jq '{desired:.spec.replicas,ready:.status.readyReplicas,restarts:([.status.conditions[] | select(.type=="Available")][0].status)}'
kubectl -n "$PREPROD_NAMESPACE" get pods -l app.kubernetes.io/name=timecalendar \
  -o json | jq '[.items[] | {pod:.metadata.name,concurrency:([.spec.containers[].env[]? | select(.name=="SYNC_QUEUE_CONCURRENCY").value] | first // "candidate-default-10"),restarts:([.status.containerStatuses[].restartCount] | add)}]'
for pod in $(kubectl -n "$PREPROD_NAMESPACE" get pods -l app.kubernetes.io/name=timecalendar -o name); do
  kubectl -n "$PREPROD_NAMESPACE" exec "$pod" -- node -e \
    'console.log(JSON.stringify({pod:process.env.HOSTNAME,concurrency:Number(process.env.SYNC_QUEUE_CONCURRENCY ?? 10)}))'
done
git show "$CANDIDATE_SHA:server/src/config/constants.ts" | grep SYNC_QUEUE_CONCURRENCY
git show "$CANDIDATE_SHA:server/src/modules/calendar-sync/jobs/sync-calendar.job.ts" | sed -n '/syncCalendarJobOptions/,/^}/p'
git grep -n -E 'timeout|retry|attempt' "$CANDIDATE_SHA" -- \
  server/src/modules/fetch server/src/config
```

Use Bull Board or run this inside one server pod to record bounded `sync` queue counts and
oldest waiting age without displaying the Redis URL:

```bash
kubectl -n "$PREPROD_NAMESPACE" exec -i deploy/"$SERVER_DEPLOYMENT" -- node - <<'NODE'
const { Queue } = require("bullmq")
const queue = new Queue("sync", { connection: { url: process.env.REDIS_URL } })
Promise.all([queue.getJobCounts("waiting", "active", "delayed", "failed"), queue.getJobs(["waiting"], 0, 0, true)])
  .then(([counts, jobs]) => console.log(JSON.stringify({counts, oldestWaitingAgeSeconds: jobs[0] ? Math.floor((Date.now() - jobs[0].timestamp) / 1000) : 0})))
  .finally(() => queue.close())
NODE
```

Use these PromQL templates, substituting the platform's actual exported labels/names when
metric discovery proves them:

```promql
sum(rate(queue_jobs_completed_total{deployment_environment_name="preproduction",queue="sync"}[5m]))
histogram_quantile(0.95, sum by (le) (rate(queue_job_duration_ms_bucket{deployment_environment_name="preproduction",queue="sync"}[15m]))) / 1000
sum(rate(traces_spanmetrics_calls_total{deployment_environment_name="preproduction",span_kind="SPAN_KIND_CLIENT"}[5m]))
sum(rate(traces_spanmetrics_calls_total{deployment_environment_name="preproduction",span_kind="SPAN_KIND_CLIENT",status_code="STATUS_CODE_ERROR"}[5m]))
histogram_quantile(0.95, sum by (le) (rate(traces_spanmetrics_duration_milliseconds_bucket{deployment_environment_name="preproduction",span_kind="SPAN_KIND_CLIENT"}[15m])))
sum(rate(traces_spanmetrics_calls_total{deployment_environment_name="preproduction",span_kind="SPAN_KIND_CLIENT"}[5m]))
/
sum(rate(queue_jobs_completed_total{deployment_environment_name="preproduction",queue="sync"}[5m]))
```

Discover and add the platform's reviewed destination/operation labels to every outbound
query before using it as calendar or ADE evidence. If outgoing calendar requests cannot
be separated from unrelated HTTP, or their p95 latency cannot be isolated from the
duration histogram, the ADE attempt rate, error ratio, and outbound latency are
**unknown and no-go**. Do not substitute `calendar_sync_total`: its replica-colliding
series is known to be invalid.

Fill one row per five-minute window:

| Input/result | Formula |
| --- | --- |
| nominal concurrency `C` | ready replicas × actual per-pod concurrency |
| jobs/5m capacity | `C × 300 / p95_job_seconds` |
| initial drain minutes | `largest_initial_bucket / observed_completions_per_minute` |
| steady arrival/minute | steady bucket / 5 |
| observed amplification | outbound calendar HTTP attempts / completed calendar jobs |
| worst amplification | candidate fetch attempts × BullMQ job attempts |
| ADE requests/minute | ADE jobs/minute × observed or worst amplification |
| outbound p95 latency | isolated calendar client-span duration histogram |
| headroom | `(capacity - arrivals) / capacity × 100%` |

Go requires: at least 30% modeled capacity headroom; initial bucket drains within 15
minutes; waiting depth and oldest age do not grow for three consecutive five-minute
windows; p95 service time is no worse than 1.5× the pre-soak baseline; no pod restart;
event-loop p95 no worse than 1.25× baseline and below 500 ms; working set below 70% of
limit; ADE error ratio below 5%, request rate below the lower of the reviewed provider
budget or 1.25× baseline, and outbound p95 latency no worse than 1.5× the pre-soak
baseline. Lyon evidence must show at most one fetch claim per calendar in the first full
hour. Unknown input means no-go.

### Sanitized production baseline, 2026-08-25

| Signal | Baseline | Gate status |
| --- | --- | --- |
| ready server replicas | 3 | known; re-read before release |
| configured sync concurrency | candidate default 10; deployed value not proven | unknown/no-go |
| seven-day active calendars | 19,573 (prior 7-day investigation, not the required 14-day query) | stale/incomplete |
| queue depth/age and sync throughput | new queue telemetry absent from deployed old image | unknown/no-go |
| trustworthy outgoing attempt attribution | unavailable; ~38,600 all outbound GET spans/24h | unknown/no-go |
| `calendar_sync_total` | ~3.18m/24h, known replica collision | prohibited input |
| restarts | 71 cumulative; 11 in prior 24h window | no-go until stable |
| peak working memory | ~410 MiB of 768 MiB | contextual only |
| maximum observed event-loop delay | 157.3 seconds | no-go until candidate soak proves recovery |

## Ordered preproduction soak

1. **Convergence:** prove one SHA, two digests, desired tags, Argo revision, pod specs and
   image IDs. Abort on any mismatch or new `main` SHA.
2. **Migration:** complete representative and preproduction `up/down/up`; final state up.
   Abort on any runtime/lock/WAL budget breach or duplicate migration execution.
3. **Retained-schema rollback compatibility:** run the previously recorded immutable
   server image against the migrated schema; health and one representative stored-calendar
   sync must pass. Restore candidate. Abort if the old image cannot serve safely.
4. **Sync correctness:** prove a generic 30-minute plan and Lyon 60-minute plan with
   synthetic/approved representative sources; concurrent request/job and retry create one
   Lyon upstream fetch. Abort on content loss, duplicate claim, or early plan.
5. **Initial wave:** observe three five-minute windows. Record queue depth/age, throughput,
   p95 duration, attempts/errors, event loop, memory, and restarts. Apply numeric gates.
6. **First Lyon hour:** observe at least 65 minutes. Abort on more than one upstream fetch
   per Lyon calendar, queue growth, or provider gate breach.
7. **Steady state:** observe at least two additional hours with three stable consecutive
   windows and no health/restart regression.

## Production go/no-go and observation

Before a human-approved platform PR: all inputs known, CI green, preproduction soak green,
old-image compatibility green, backup/restore point named, prior immutable tags/digests
recorded, and server/web candidate SHA identical. Re-resolve `main` immediately before
promotion; a change invalidates the soak.

After the reviewed platform tag change (outside this repository), observe continuously at
0–5, 5–15, 15–30, 30–65, and 65–180 minutes:

```bash
kubectl -n timecalendar-production rollout status deployment/timecalendar --timeout=10m
kubectl -n timecalendar-production get pods -l app.kubernetes.io/name=timecalendar \
  -o json | jq '[.items[] | {pod:.metadata.name,ready:(.status.conditions[] | select(.type=="Ready").status),restarts:([.status.containerStatuses[].restartCount] | add),images:[.spec.containers[].image],imageIDs:[.status.containerStatuses[].imageID]}]'
curl --fail --silent --show-error https://PRODUCTION_HOST/health >/dev/null
```

Repeat the queue, throughput, outbound attempt/error, event-loop, memory, migration-lock,
and aggregate duplicate-Lyon checks from above. Abort on health failure, a restart,
event-loop/memory gate, increasing queue depth/age, throughput below arrivals, ADE budget,
migration lock, image mismatch, or duplicate Lyon claim/fetch.

## Rollback

### Normal emergency rollback: retain schema

Restore the previously recorded immutable **server and web** `main-<sha>` tags in a
reviewed platform change. Verify their runtime `imageID` digests, health, and a
representative sync. Leave `syncPlannedAt` and its index in place; the old image ignores
the additive schema and avoiding `down` avoids incident-time table locks.

### Destructive schema rollback: separate authorization

Migration `down` drops the index and column. It is never automatic and never the first
response. It requires all of the following, recorded by name and UTC time:

1. the previous server image is already serving and healthy;
2. every application/background writer is quiesced;
3. a tested database backup or restore point is named;
4. explicit human authorization identifies the approver and scope;
5. a second operator samples locks and blocked sessions throughout.

Only then may the candidate-bound `migration:revert` command be run. Abort on any writer,
lock wait over 5 seconds, or missing restore proof. Production schema rollback is a deploy
act and is not performed by this change.
