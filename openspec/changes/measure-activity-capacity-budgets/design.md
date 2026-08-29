# Design — measure Activity volume and freeze capacity budgets

This change produces evidence, fixtures, and gates. Its design is therefore mostly *method*: how
the numbers are obtained, how they are prevented from carrying private data, and what rule turns
them into a verdict without discretion at measurement time.

Authoritative specification:
`docs/react-native-migration/05-tech-specs/activity-revival.md` at commit `595786a0`, sections
*Architecture decisions 2 and 4*, *Security and privacy*, *Observability and capacity*, and
*Ticket 1*. Research record: [TIM-275](https://paperclip.lyrolab.fr/TIM/issues/TIM-275).

---

## Verified access path (established 2026-08-29 while proposing; do not re-derive)

The probe is runnable from a pipeline execution workspace. These facts were checked, not assumed:

- `kubectl` is on `PATH`; the current context authenticates as
  `system:serviceaccount:kube-system:paperclip-agent`.
- In namespace `timecalendar-production`, `auth can-i create pods` is **no** and
  `auth can-i create pods --subresource=exec` is **yes**. The ephemeral psql pod from
  `docs/server/rentree-release-runbook.md` is therefore unavailable, exactly as in the
  2026-08-25 rentrée investigation. Use `kubectl exec` into a running `timecalendar-*` API pod.
- The API image ships Node 24 with the `pg` module resolvable and `DATABASE_URL` set in the pod
  environment. Piping a script over stdin works:
  `kubectl -n timecalendar-production exec -i <pod> -- node - < probe.js`.
- Pod names are not stable. Resolve one at run time; do not hard-code the name used here.
- Production migrations are current through `Migration1787850619167`, so the schema in production
  matches this branch's entities.

`DATABASE_URL` must never be printed, echoed, or written anywhere. Read it from `process.env`
inside the piped script only.

## Decision: production supplies distributions; the fixture supplies plans and timings

Production is measured for **what the data looks like**. Latency and plan *text* are captured
against a local fixture database seeded from those distributions.

Three reasons, in order of weight:

1. **Privacy.** An `EXPLAIN` plan embeds its `Index Cond` and `Filter` strings, which for this
   query means a literal list of calendar UUIDs. Those are the "opaque IDs" the ticket forbids in
   any artifact. On a synthetic fixture the same plan text is safe to commit verbatim.
2. **Reproducibility.** Tickets 2 and 8 must be able to re-run the gate. They cannot re-run a
   production timing, and a number nobody can reproduce is not a gate.
3. **Load.** Timing a 100-calendar year-long page repeatedly against a production database serving
   rentrée traffic edges toward the load test the epic prohibits.

Production is not skipped for plans, though — a fixture can be plan-unrepresentative if its
statistics differ. So production also yields a **structurally redacted** plan record (below), which
is compared against the fixture's plan shape. If the two disagree on node types or index choice,
the fixture is wrong and must be re-seeded before any budget is frozen.

## Decision: redaction is structural, not editorial

Do not capture `EXPLAIN` text from production and delete the sensitive parts by hand. Capture
`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` and walk the JSON with an explicit **allowlist**, emitting
only these keys per node and recursing into `Plans`:

```
Node Type, Parent Relationship, Relation Name, Index Name, Scan Direction,
Startup Cost, Total Cost, Plan Rows, Plan Width,
Actual Startup Time, Actual Total Time, Actual Rows, Actual Loops,
Rows Removed by Filter, Rows Removed by Index Recheck,
Shared Hit Blocks, Shared Read Blocks, Shared Dirtied Blocks, Temp Read Blocks, Temp Written Blocks,
Sort Method, Sort Space Used, Sort Space Type, Sort Key,
Heap Fetches, Workers Launched
```

Every other key — `Index Cond`, `Filter`, `Recheck Cond`, `Hash Cond`, `Join Filter`, `Output`,
`Group Key`, `Presorted Key`, `Cache Key`, `Subplan Name`, `Function Name`, and anything added by a
future PostgreSQL version — is dropped by *not being on the list*. `Sort Key` is on the list
because it names columns, never values; verify that in the emitted output rather than assuming it.

An allowlist fails closed: a new PostgreSQL key that happens to carry values is dropped by default.
A denylist would leak it. This is the same reason the rentrée pack's privacy boundary is stated per
document rather than checked per line.

## Decision: the held-calendar cohort is approximated from notification subscriptions

Nothing on the server links a calendar to a device or a student — `calendar` is keyed only by
token, which is the point. The one real many-to-one grouping is
`calendar_notification_subscription`, the join table between `notification_subscription` (one row
per FCM channel, i.e. one device) and `calendar`. Calendars-per-subscription is therefore a direct
proxy for calendars-held-per-device.

Its bias must be stated in the artifact, not hidden: it observes only students who enabled
notifications, and it under-counts a student who holds calendars but subscribed to a subset. It is
adequate for the question actually being asked — *does the 100-token request cap have real users
near it, or is the realistic cohort 1–3?* — and inadequate for anything else. Record it as
"approximate cohort", with the bias sentence, exactly as the rentrée pack recorded
`calendar_failure`'s missing school key.

## Query set (production, read-only, aggregate)

Every query runs inside one `BEGIN TRANSACTION READ ONLY` with `SET LOCAL statement_timeout = '60s'`
and ends in `ROLLBACK`. Every result is a count, a percentile, or a bucket label. No query selects
`token`, `url`, `name`, `calendarChange` content, or any `id`.

**A1 — logs per calendar over the retention window.** `count(*)` grouped by `"calendarId"`, then
`percentile_disc(ARRAY[0.5,0.75,0.9,0.95,0.99,1.0])` over that count, plus mean and the number of
distinct calendars carrying logs. Emit percentiles and a bucket histogram, never the group keys.

**A2 — the same restricted to `createdAt >= now() - interval '30 days'` and `'7 days'`.** The first
page a student loads is recent history; the year-long numbers describe deep scrolling.

**A3 — approximate held-calendar cohort.** `count(*)` grouped by `"notificationSubscriptionId"` over
`calendar_notification_subscription`, reported as percentiles plus the count at or above the
100-calendar request cap.

**A4 — events per log.** `json_array_length` over `"calendarChange"->'newItems'`, `'oldItems'`, and
`'changedItems'`, summed per row, reported as percentiles and a histogram. Lengths are aggregate;
the array contents are never selected.

**A5 — wire bytes per log.** `octet_length("calendarChange"::text)` percentiles and histogram.
`octet_length` of the text rendering, not `pg_column_size`: the budget is about bytes crossing the
network to a phone, and `pg_column_size` reports the TOAST-compressed on-disk size instead.

**A6 — page bytes.** For a bounded random sample of calendars (target ~2,000, drawn with
`TABLESAMPLE` or an `ORDER BY random() LIMIT` over `calendar` — bounded so the probe stays cheap),
sum `octet_length("calendarChange"::text)` over that calendar's newest 50 and newest 100 logs, and
report percentiles of those sums. This is the number that decides the default page size; it cannot
be derived from A5 percentiles because per-row sizes within one calendar are correlated.

**A7 — sanity headline.** Row count, `min`/`max("createdAt")`, `pg_table_size`, `pg_indexes_size`,
and the `pg_indexes` definitions for `calendar_log`. Already measured on 2026-08-29 (see
`proposal.md`); re-run so the committed pack has a single self-consistent timestamp.

If A6 proves too expensive under the 60 s statement timeout, reduce the sample and say so in the
pack. Do not silently truncate: a bounded sample that is labelled is evidence, an unlabelled one is
a false claim of coverage.

## Plan matrix

Run each shape at 1, 10, and 100 calendars, over recent (30-day) and year-long history — against
the fixture with full plan text, and against production with the redacted-JSON walker.

| # | Shape | SQL predicate |
| --- | --- | --- |
| P1 | v1 first page | `WHERE "calendarId" = ANY($1) ORDER BY "createdAt" DESC, "id" DESC LIMIT 51` |
| P2 | v1 following page | `… AND ("createdAt", "id") < ($2, $3) ORDER BY "createdAt" DESC, "id" DESC LIMIT 51` |
| P3 | v1 snapshot-bounded page | P2 plus `AND "createdAt" <= $4` (the cursor's `asOf`) |
| P4 | `unreadCount`, recent watermark | `SELECT count(*) … WHERE "calendarId" = ANY($1) AND "createdAt" > $2 AND "createdAt" <= $3` with `$2 = now() - 7 days` |
| P5 | `unreadCount`, one-year watermark | P4 with `$2 = now() - 1 year` |

`LIMIT 51` and `LIMIT 101` mirror the specification's read-one-extra-row rule, so the plan measured
is the plan the endpoint will run. The 100-row page repeats P1/P2 at `LIMIT 101`.

Note for the fixture database: server tests build their schema from the entity classes via
`synchronize` (`server/src/test-utils/typeorm/typeorm-test-module.ts`), and `CalendarLog` declares
`IDX_calendar_log_calendar_createdAt` and `IDX_calendar_log_createdAt` on the entity. A synchronized
fixture therefore has exactly the production index set — but it will have *no statistics* until
`ANALYZE` runs. Run `ANALYZE calendar_log` after seeding and before any plan or timing capture, or
every plan is measured against default estimates and is worthless.

## Decision: the index verdict follows a rule fixed here, not judgement at measurement time

The verdict authorizes a production index migration in Ticket 2, so it must not be a matter of how
the plan output feels on the day.

**The existing indexes are SUFFICIENT for a shape** if and only if, at the 100-calendar cohort over
year-long history, on the ANALYZEd representative fixture, all four hold:

1. no `Seq Scan` whose `Relation Name` is `calendar_log` appears anywhere in the plan;
2. any `Sort` node reports `Sort Method: top-N heapsort` (or no `Sort` node at all), never
   `external merge` / `Sort Space Type: Disk`;
3. the measured p95 is under the frozen latency budget for that shape; and
4. the production redacted plan for the same shape agrees with the fixture on node types and
   chosen `Index Name`.

**Otherwise the shape is INSUFFICIENT.** The verdict then names, per shape, the single index that
resolves it. For P1–P3 that is expected to be
`("calendarId", "createdAt" DESC, "id" DESC)` — it makes the keyset predicate and the tie-break
both index-ordered, which no current index does, since `id` appears in no composite index. For
P4–P5 the existing `("calendarId","createdAt")` already covers the range count and is expected to
be sufficient; if it is not, say which of the four conditions failed.

Record the verdict **per shape**, not as one global yes/no. "Sufficient for the unread count,
insufficient for the keyset page" is the most likely true answer and is the useful one for Ticket 2.

A verdict of INSUFFICIENT authorizes exactly the named index in Ticket 2 and nothing else. It does
not authorize this change to create one.

## Fixtures

Two artifacts, deliberately separated.

**The volume profile** — `server/src/test-utils/fixtures/activity-volume-profile.ts` — is a typed
constant holding only the aggregate buckets from A1–A6: percentile arrays for logs-per-calendar,
events-per-log, bytes-per-log, page-bytes, and cohort size, each with the date the probe ran. It is
committed, reviewable at a glance, and contains no identifier, token, title, location, or row. It
is the single source of truth that both the seeder and the tests read.

**The seeder** — `server/src/scripts/seed-activity-fixture.ts`, wired as `npm run seed:activity-fixture`
— materializes a database matching that profile: calendars drawn to the cohort distribution, logs
per calendar drawn to the A1/A2 distribution, and each log's `calendarChange` synthesized to the
A4/A5 event-count and byte distributions using generated text (`Synthetic course N`, `Room N`, in
the shape the existing `calendarLogFactory` already uses). It must be **deterministic**: a fixed
seed and a small explicit PRNG, never `Math.random()`, so two runs of the gate compare like with
like. It writes `createdAt` values spread across a full year so the year-long shapes are real.

Scale the seeded database to the p99 cohort, not the mean — the budget is a p95/p99 promise, and a
fixture seeded to the median measures nothing that matters.

## Harness

`server/src/scripts/measure-activity-capacity.ts`, wired as `npm run measure:activity-capacity`,
follows the established `profile:calendar-sync` pattern: build, run, print one structured result
object, and **exit non-zero when an assertion fails**. That non-zero exit is what makes it a gate
rather than a report. It measures, against the seeded fixture:

- P1/P2/P3 latency at `LIMIT 51` and `LIMIT 101`, p50/p95/p99 over a fixed sample count;
- serialized response bytes per page (the mapped v1 DTO shape, sans `calendarToken`);
- P4/P5 unread-count latency at both watermarks;
- maximum event-loop delay (`monitorEventLoopDelay`, as `profile-calendar-sync.ts` does) and peak
  RSS under a representative concurrent read burst; and
- the plan for each shape, asserted against the sufficiency conditions above.

It queries through the repository/SQL layer directly. It does **not** stand up the Nest HTTP app and
does **not** call `POST /v1/calendar-logs/search`, which does not exist and is Ticket 2's work.

The concurrency ceiling matters because production pods run with a 768 MiB memory limit and the
rentrée investigation measured peak working memory at ~410 MiB with event-loop delay reaching
157 s under sync load. Activity reads land on the same pods. Freeze a headroom budget accordingly
rather than only latency.

## Freezing the budgets

`docs/react-native-migration/05-tech-specs/activity-capacity-budgets.md` carries the frozen numbers.
It starts from the specification's initial budgets and **either confirms each or replaces it with a
measured one plus the reason**. Silently keeping a number because it was in the specification is the
failure mode this ticket exists to prevent; so is quietly loosening one to fit a measurement.

It must also freeze what the specification left open:

- a **page-byte ceiling** (p95 and max) for the default and maximum page;
- the **default page size**, with an explicit recommendation to lower it below 50 if A6 shows
  default pages materially exceeding the mobile/network budget — the accepted 100 maximum and the
  contract shape stay unchanged either way, and splitting one calendar-log group across pages
  remains out of scope;
- **unread-count** p95 at both watermarks;
- a **shared-buffer read ceiling** per page, which catches a plan regression that latency alone
  hides on a warm cache; and
- **memory and event-loop** ceilings under the concurrent read burst.

The document is written for someone with no access to this ticket's session: every number states
its date, the cohort it was measured at, the command that reproduces it, and what a breach means.
The CI-proof test asserts the harness enforces the same thresholds the document publishes, so the
two cannot drift.

## Privacy contract for every artifact

Applies to the investigation pack, the profile fixture, the budgets document, the harness output,
the PR body, and every issue comment:

- No calendar token, URL, or query string. No event title, location, description, UID, or time.
- No calendar, calendar-log, user, subscription, or trace identifier — including inside plan text.
- No `DATABASE_URL`, credential, or connection string.
- Counts, percentiles, bucket labels, byte sizes, durations, index names, and node types only.
- School hostnames are **not** needed here; unlike the rentrée pack, do not retain them.

Each committed document opens with a privacy-boundary paragraph naming what it does and does not
contain, matching `docs/investigations/2026-08-25-rentree-prod-health/07-calendar-sync-profile.md`.
The reviewer's check is by inspection, so make inspection cheap.

## Facts inherited from the rentrée investigation (do not re-derive incorrectly)

- `calendar_log` records successful syncs **with changes**, not every successful fetch. A zero is a
  prioritization signal, not proof of a dead source. This matters when reading A1: calendars with
  no logs are not necessarily inactive, and the "active calendar" denominator should come from
  `calendar.lastAccessedAt` / `lastUpdatedAt`, stated explicitly, rather than from log presence.
- `calendar_failure` has no school foreign key. Irrelevant to this probe; noted so nobody attempts
  a school join.

## If production access fails

Do not stall silently and do not substitute invented numbers. Comment on TIM-402 naming the exact
failure — the command, the namespace, the error — and mention the Founding Engineer, who holds the
fallback path and will post the aggregates. Then continue with everything that does not depend on
production: the seeder, the harness, the plan matrix against a synthetic fixture, and the budgets
document with its production-derived values left explicitly `TBD (blocked on probe)`. A committed
harness with a stated hole is worth more than a stalled branch.

## Human-only work

None expected. If any step turns out to need credentials, a device, or a console, file it as a
`(HUMAN: …)` note in `docs/react-native-migration/inbox/` — never as a blocker on this PR.
