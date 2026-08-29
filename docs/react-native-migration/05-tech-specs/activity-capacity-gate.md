# Activity capacity gate

**Status:** frozen 2026-08-29 · **Ticket:** TIM-394 · **Gates:** TIM-395 (endpoint acceptance), TIM-401 (release review)

The measured performance contract for the Activity read path specified in
[`activity-revival.md`](./activity-revival.md). TIM-395's acceptance and TIM-401's release review
are measured against the table in [Frozen gates](#frozen-gates), not against numbers restated in a
ticket or a pull-request comment.

The harness that produced every number here is
[`server/src/scripts/activity-capacity/`](../../../server/src/scripts/activity-capacity/README.md)
and is runnable locally with no production access.

---

## Headline

1. **The default page size of 50 is safe.** The v1 response shape drops roughly 59% of the bytes
   the database stores, which the production aggregate read could not see. Estimated production
   p99 for a 50-log page: **~400 KB**, not the ~1 MB the raw column sizes suggested.
2. **The existing indexes are sufficient. No new index is required, and the obvious composite
   index does not help.** Adding `("calendarId", "createdAt" DESC, "id" DESC)` was measured and
   changes nothing that matters.
3. **The query shape the specification wrote down has a planner cliff, and that is the real
   finding.** A request for 100 calendars that hold no logs — the majority case, since 75% of
   production calendars have never produced one — reads the entire `calendar_log` index and takes
   **944 ms** to return nothing. Rewritten as a `LATERAL` per calendar it takes **2.1 ms**. TIM-395
   must ship the second shape; it is already written and measured in `queries.ts`.

Point 3 is a query change, not a contract change: same inputs, same rows, same order, proven
row-for-row by a test.

---

## 1. Production volume

Measured on **2026-08-29** by the Founding Engineer, by executing
[`production-aggregates.sql`](../../../server/src/scripts/activity-capacity/production-aggregates.sql)
unmodified against production. Aggregate-only: every projected column is a count, a bucket label, a
percentile, a byte size, or a whole date.

**Read the 30-day window as a summer-break floor, not term time.** TIM-401 re-runs the same file in
term time and records the difference here.

### Population and retention

| | |
| --- | --- |
| `calendar_log` rows | 3,893,928 |
| Calendars, total | 444,072 |
| Calendars with at least one log | 111,530 (25%) |
| **Calendars with zero logs** | **332,542 (75%)** |
| Calendars accessed in last 30 days | 39,524 |
| Calendars accessed in last 365 days | 165,039 |
| Retention span | 362 days (2025-09-01 → 2026-08-29) — the one-year prune holds |
| `calendar_log` on disk | 6,951 MB total (4,060 MB heap, 384 MB indexes, ~2.5 GB TOAST) |

### Logs per calendar

Over calendars that have any log.

| Window | measured | mean | p50 | p90 | p95 | p99 | max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Whole retention year | 111,530 | 34.91 | 23 | 83 | 109 | 164 | 911 |
| Last 30 days | 7,097 | 2.00 | 1 | 4 | 5 | 9 | 22 |

Bucketed, whole year: 1–10 → 33,970 · 11–50 → 50,626 · 51–200 → 26,520 · 201–1000 → 414 · 1000+ → 0.

**Pagination depth is not a risk.** A whole year of one calendar's history is p99 = 164 logs, so at
any page size ≥ 50 the client reaches the end of history in one to four pages.

### Payload

| Metric | mean | p50 | p95 | p99 | max |
| --- | --- | --- | --- | --- | --- |
| `pg_column_size(calendarChange)` — stored | 1,506.7 | 890 | 3,116 | 16,113 | 740,608 |
| `octet_length(calendarChange::text)` — serialized | 6,706.1 | 1,643 | 25,486 | 105,283 | **3,745,367** |
| Changed events per log (sampled 3%, 119,178 rows) | 12.11 | 2 | 45 (p95) | 214 | 3,656 |

The stored/serialized gap is ~4.5× at the mean and ~36× at the p99 — TOAST compresses this payload
extremely well, which is exactly why the disk footprint never surfaced the problem.

### Estimated page bytes, raw `calendarChange` only

Sampled over 5,000 md5-ordered calendars accessed in the last 30 days (3,993 with logs).

| page size | mean | p50 | p95 | p99 | max | >256 KB | >1 MB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 32,901 | 17,971 | 108,963 | 221,795 | 1,643,029 | 0.63% | 0.08% |
| 25 | 69,721 | 47,215 | 178,250 | 428,129 | 2,055,930 | 2.4% | 0.25% |
| **50** | 132,534 | 90,853 | 323,883 | 980,600 | 6,172,226 | 8.5% | 0.95% |
| 100 | 231,176 | 108,919 | 498,687 | 2,334,438 | 26,106,413 | 21% | 1.8% |

**These are not v1 response bytes.** See [§4](#4-default-page-size-verdict) — the v1 shape is a
five-field projection of what is stored, and the difference decides the verdict.

### Calendars per student — no answer exists

`calendar_notification_subscription` returned zero rows: production holds 1 notification
subscription, 0 calendar links, and 1 FCM channel. The notification pipeline is deployed but
unpopulated.

There is no other candidate. **None of the schema's 14 tables associates a device or a person with
more than one calendar.** "How many calendars does one student hold" is not a skewed proxy here, it
is *unobservable server-side*, and will stay so until the notification pipeline has real
subscribers. The 1/10/100 cohort spine below therefore rests on the specification's judgement, not
on measurement, and TIM-401 will not be able to change that.

---

## 2. Fixtures

`server/src/scripts/activity-capacity/fixtures.ts`. Deterministic — no `random()`, every id and
timestamp derived from an index and a fixed reference date, so a re-run reproduces the corpus
byte-for-byte and two measurements are comparable rather than merely repeated. Every string is
synthetic.

### Background corpus

| | measured at | production |
| --- | --- | --- |
| Calendars | 100,000 | 444,072 |
| `calendar_log` rows | 1,000,000 | 3,893,928 |
| Fraction of calendars with logs | 25% | 25% |
| Table size incl. TOAST | 1,918 MB | 6,951 MB |
| Seed wall-clock | **101 s** | — |

The background corpus is the load-bearing part. Measuring a 100-calendar page against a table
holding only those 100 calendars' rows proves nothing: index selectivity and the planner's choice
between access paths depend on how small the requested slice is relative to the whole table.

It is below production scale on purpose. What matters is the *ratio* — a 100-calendar year cohort
is 0.09% of production's table and 0.43% of this one, both far inside the range where an index scan
must win — and the smaller table is the **conservative** direction, since fewer pages make a
sequential scan cheaper. Raise it with `--calendars` / `--logs`; this document records the scale
every number was measured at.

Background payloads are deliberately small (1–3 events), which is conservative for the same reason.

### Cohorts

Per-calendar log counts are drawn from the §1 quantiles by linear interpolation, so a cohort
reproduces the measured distribution rather than n copies of its mean.

| Cohort | Calendars | History | Logs seeded |
| --- | --- | --- | --- |
| `c1-recent` | 1 | 30 days | 1 |
| `c1-year` | 1 | 365 days | 23 (the measured p50 calendar) |
| `c10-recent` | 10 | 30 days | 20 |
| `c10-year` | 10 | 365 days | 383 |
| `c100-recent` | 100 | 30 days | 219 |
| `c100-year` | 100 | 365 days | 4,285 |
| **`c100-empty`** | **100** | **none** | **0** |
| `many-changes` | 1 | 365 days | 3 logs carrying 45 / 214 / 3,656 events |

`c100-empty` was added during measurement and is not in the original ticket's cohort list. It
earned its place: 75% of production calendars carry no log, so an empty Activity screen is the
majority request — and it is the request with nothing for a `LIMIT` to stop early on. It is the
only cohort that failed a budget.

Every seventh log shares its predecessor's `createdAt`, so the `(createdAt, id)` tie-breaker is
actually exercised rather than assumed.

---

## 3. Frozen gates

Evidence citations name the run recorded in [§5](#5-measurement-evidence). A budget may be
tightened or loosened **only** by editing its Evidence cell in the same commit and appending to
[§8](#8-change-log).

| # | Budget | Verdict | Evidence |
| --- | --- | --- | --- |
| G1 | Default 50-log page p95 < 250 ms | **PASS** for every cohort with the lateral shape; worst 75.0 ms (`many-changes`). **FAIL** for `c100-empty` with the specification shape (944 ms). | Run A |
| G2 | Maximum 100-log page p95 < 500 ms | **PASS** with the lateral shape; worst 73.8 ms. **FAIL** for `c100-empty` with the specification shape (884 ms). | Run A |
| G3 | No sequential scan of the full `calendar_log` table for a bounded token request | **PASS** — no cohort produces `Seq Scan on calendar_log` under either shape. See G3a. | Run A plans; CI tripwire |
| G3a | *(added)* No **full index** scan of `calendar_log` for a bounded token request | **FAIL** with the specification shape, **PASS** with the lateral shape. G3 as originally written does not catch this failure — see [§4](#4-index-and-query-shape-verdict). | Run A plans |
| G4 | Unread count p95 < 250 ms over recent and one-year watermarks | **PASS** — worst 4.5 ms, all cohorts, both watermarks, both shapes. | Run A |
| G5 | No token or event data in telemetry or recorded evidence | **PASS** — plans pass through `redactPlan`; unit-tested; plans are captured against synthetic fixtures only. | `redact.test.ts`; §7 |
| G6 | Event-loop delay stays bounded under representative concurrent reads | **PASS** — 8 concurrent readers × 10 rounds: max delay 12.8 ms, p99 12.0 ms, heap growth 27.3 MB. | Run B |
| G7 | Serialized v1 page stays under 1 MB at p99 | **PASS (estimated)** — ~400 KB at page 50; ~950 KB at page 100. Derived, not directly measured — see [§4](#4-default-page-size-verdict). | Run A + §1 |
| G8 | One request per trigger after single-flight collapse | **Not measured here.** Owned by **TIM-397** (coordinator) and **TIM-399** (lifecycle); verified at release by **TIM-401**. | — |
| G9 | Smooth cached scrolling on supported iPhone, iPad portrait, and Android devices | **Not measured here.** Owned by **TIM-398**; verified at release by **TIM-401**. | — |

G8 and G9 are frozen in this table but no server harness can measure them. They name the ticket
that verifies them rather than citing a run, so nobody later mistakes their presence for coverage.

**G3a is new.** The specification's G3 asks only about *sequential* scans. The failure this ticket
found passes G3 while being 450× over budget, because a backward walk of an index is not a
sequential scan. Ticket 8 must check G3a, not G3 alone.

---

## 4. Verdicts

### Index and query shape verdict

> **The existing indexes are sufficient. No migration is required by this epic.**
>
> `IDX_calendar_log_calendar_createdAt` (`"calendarId", "createdAt"`),
> `IDX_calendar_log_createdAt` (`"createdAt"`), and the TypeORM-generated index on
> `calendar("token")` serve every v1 query. The candidate composite index
> `("calendarId", "createdAt" DESC, "id" DESC)` was built and measured and is **not** recommended:
> it costs 56.5 MB, it does not fix the one failure, and where it changes anything it is noise.
>
> **What is required is a query change, in TIM-395.** The page query must use
> `calendarLogPageLateralSql`, not `calendarLogPageSql`.

The evidence, page size 50, existing indexes, 1,004,934-row corpus:

| Cohort | Specification shape p95 | Lateral shape p95 | Buffers, specification | Buffers, lateral |
| --- | --- | --- | --- | --- |
| `c1-year` | 6.5 ms | 8.8 ms | 10 | 11 |
| `c10-year` | 3.0 ms | 3.8 ms | 71 | 86 |
| `c100-year` | 4.8 ms | 11.3 ms | 357 | 872 |
| **`c100-empty`** | **944.4 ms** | **2.1 ms** | **128,919** | **300** |

The plan for `c100-empty` under the specification's shape, redacted, verbatim:

```
Limit  (cost=87.03..4491.74 rows=51 width=832) (actual time=924.044..924.046 rows=0 loops=1)
  Buffers: shared hit=12520 read=116399
  ->  Incremental Sort  (cost=87.03..343913.29 rows=3981 width=832) (actual time=924.042..924.043 rows=0 loops=1)
        Sort Key: "createdAt" DESC, id DESC
        Presorted Key: "createdAt"
        Buffers: shared hit=12520 read=116399
        ->  Index Scan Backward using "IDX_calendar_log_createdAt" on calendar_log
              (cost=0.68..343734.14 rows=3981 width=832) (actual time=924.035..924.036 rows=0 loops=1)
              Index Cond: ("createdAt" <= ‹redacted›::timestamp without time zone)
              Filter: ("calendarId" = ANY (‹redacted›::uuid[]))
              Rows Removed by Filter: 1004934
```

`Rows Removed by Filter: 1004934` is the whole table. The planner believes `LIMIT 51` will let it
stop after ~1/250th of the global `createdAt` index; there is nothing to find, so it exhausts the
index instead.

The same request, same corpus, lateral shape:

```
Limit  (cost=16916.88..16917.01 rows=51 width=832) (actual time=0.766..0.769 rows=0 loops=1)
  Buffers: shared hit=300
  ->  Sort  (cost=16916.88..16926.88 rows=4000 width=832) (actual time=0.764..0.766 rows=0 loops=1)
        Sort Key: l."createdAt" DESC, l.id DESC
        ->  Nested Loop  (cost=4.56..16783.44 rows=4000 width=832) (actual time=0.760..0.761 rows=0 loops=1)
              ->  Function Scan on unnest c  (actual time=0.018..0.030 rows=100 loops=1)
              ->  Index Scan Backward using "IDX_calendar_log_calendar_createdAt" on calendar_log l
```

Three properties of this failure make it worse than the numbers alone suggest, and all three are
reasons to fix the shape rather than to cap something:

- **It is a cliff, not a gradient.** At this corpus, requests for 10, 20, 30, 40, 50, 60, and 80
  empty calendars all planned correctly at 0.8–1.6 ms. 100 planned catastrophically at 858 ms. One
  extra token, 600× the cost.
- **The cliff's position moves.** It is a cost-model crossover, so it depends on table size and
  statistics. Capping the token count at a number measured today does not hold tomorrow.
- **The candidate index does not move it.** With
  `("calendarId","createdAt" DESC,"id" DESC)` present, `c100-empty` under the specification's shape
  still costs 930.0 ms — the planner keeps choosing the global index. The problem is not a missing
  index; it is a choice between two indexes, one of which is wrong.

The lateral shape removes the choice: each branch is an equality lookup on `calendarId` followed by
an ordered walk, which only `IDX_calendar_log_calendar_createdAt` can serve. It costs roughly 2×
on the dense `c100-year` case (11.3 ms against 4.8 ms) — the premium for not having a cliff.

**It is a plan change and nothing else.** `plan.test.ts` walks both shapes page by page across a
timestamp tie and asserts the returned row ids are identical.

### Default page size verdict

> **The default of 50 is safe. Do not lower it.** The contract shape and the maximum of 100 do not
> change.

The production aggregate read sized `calendarChange` **as it is stored**. The v1 response does not
return that. `CalendarLogEventGet` keeps five fields — `uid`, `title`, `startsAt`, `endsAt`,
`location` — and drops `description`, `teachers`, `tags`, `type`, `fields`, `allDay`, and
`exportedAt`. Nothing in an aggregate query could have shown this; it takes serializing the real
response shape, which is what the harness does.

Measured, page size 50, per page:

| Cohort | Rows | Stored `calendarChange` | Serialized **v1 response** | v1 ÷ stored |
| --- | --- | --- | --- | --- |
| `c1-year` | 23 | 261.2 KB | 107.0 KB | 0.41 |
| `c10-recent` | 20 | 124.5 KB | 53.5 KB | 0.43 |
| `c100-recent` | 50 | 67.5 KB | 39.3 KB | 0.58 |
| `c100-year` | 50 | 36.4 KB | 27.1 KB | 0.74 |
| `many-changes` | 3 | 3,845.5 KB | **1,563.5 KB** | 0.41 |

The ratio rises toward 1 on small pages because v1 adds ~130 constant bytes per row (`id`,
`calendarId`, `calendarName`, two timestamps), which dominates when the payload is tiny. **On the
pages that threaten the budget it is consistently 0.41.**

Applying 0.41 to the production estimates in §1:

| page size | p50 | p95 | p99 | max |
| --- | --- | --- | --- | --- |
| **50** | ~37 KB | ~133 KB | **~402 KB** | ~2.5 MB |
| 100 | ~45 KB | ~204 KB | ~957 KB | ~10.7 MB |

A p99 of ~400 KB for the default page is comfortably inside a mobile budget, and gzip has not been
counted at all — these payloads are highly repetitive and compress well on the wire. **The default
of 50 stands.**

Two things this verdict does **not** claim:

- **The 0.41 ratio is derived from fixture events, not production ones.** Fixture events carry a
  fixed ~190-character description; a cohort of production events with longer descriptions would
  compress *further* under the projection, and one with empty descriptions would compress less.
  TIM-401 should re-derive the ratio if the term-time re-measure moves the byte percentiles.
- **The worst case is still bad.** One log holding 3,656 changed events serializes to 1.5 MB in the
  v1 shape, and production's largest page estimates to ~2.5 MB at page 50 and ~10.7 MB at page 100.
  A 10 MB `JSON.parse` on a mid-range Android device is the failure, not the transfer. Row
  pagination is not a byte limit, and this document does not pretend otherwise — see the open
  question below.

### Open question carried to TIM-389

Whether the list response should carry the full `calendarChange` or a summary with detail fetched
on demand is a **specification-level question**, not TIM-394's to decide. It was raised on
[TIM-389](/TIM/issues/TIM-389) so TIM-395 is not where it gets discovered. This document's verdict
is conditional on the current shape: *given* that the response carries the full change, 50 is safe.

---

## 5. Measurement evidence

Both runs: PostgreSQL 14, local Docker Compose, 1,004,934 `calendar_log` rows across 100,323
calendars, seeded and `VACUUM ANALYZE`d by `activity:capacity:seed` immediately before.

### Run A — `activity:capacity:compare --samples 25`, 2026-08-29

Every cohort × both page shapes × page sizes 50 and 100, run twice: once on the shipped indexes and
once with the candidate index present, under identical corpus, cache, and statistics conditions.

First-page p95, milliseconds, **existing indexes**:

| Cohort | spec @50 | lateral @50 | spec @100 | lateral @100 |
| --- | --- | --- | --- | --- |
| `c1-recent` | 1.3 | 1.2 | 1.3 | 1.1 |
| `c1-year` | 6.5 | 8.8 | 11.0 | 8.4 |
| `c10-recent` | 4.1 | 4.6 | 6.6 | 3.9 |
| `c10-year` | 3.0 | 3.8 | 4.8 | 4.6 |
| `c100-recent` | 6.9 | 4.0 | 20.8 | 17.3 |
| `c100-year` | 4.8 | 11.3 | 6.8 | 11.1 |
| `c100-empty` | **944.4** | **2.1** | **883.6** | **1.3** |
| `many-changes` | 69.6 | 75.0 | 73.7 | 73.8 |

Following-page p95 tracks first-page p95 within noise for every cohort that has one (worst: 53.1 ms,
`c100-recent` @100, specification shape). Unread-count p95 never exceeded **4.5 ms** for any cohort,
watermark, shape, or index configuration.

With the candidate index present, `c100-empty` under the specification shape was **930.0 ms** @50
and **908.0 ms** @100 — unchanged.

#### Access path per cohort, existing indexes, page size 50

`composite` = `IDX_calendar_log_calendar_createdAt` · `global createdAt` = `IDX_calendar_log_createdAt`
· `—` = the cohort has no following page. No cohort produced a sequential scan under either shape.

| Cohort | Shape | First page | Following page | Unread (30 d) | Unread (365 d) |
| --- | --- | --- | --- | --- | --- |
| `c1-recent` | specification | Index Scan using composite | — | Index Only Scan using composite | Index Only Scan using composite |
| `c1-year` | specification | Index Scan using composite | — | Index Only Scan using composite | Index Only Scan using composite |
| `c10-recent` | specification | Bitmap Index Scan on composite | — | Index Only Scan using composite | Index Only Scan using composite |
| `c10-year` | specification | Bitmap Index Scan on composite | Bitmap Index Scan on composite | Index Only Scan using composite | Index Only Scan using composite |
| `c100-recent` | specification | **Index Scan Backward using global createdAt** | **global createdAt** | Index Only Scan using composite | Index Only Scan using composite |
| `c100-year` | specification | **Index Scan Backward using global createdAt** | **global createdAt** | Index Only Scan using composite | Index Only Scan using composite |
| `c100-empty` | specification | **Index Scan Backward using global createdAt** | — | Index Only Scan using composite | Index Only Scan using composite |
| `many-changes` | specification | Index Scan using composite | — | Index Only Scan using composite | Index Only Scan using composite |
| `c1-recent` | lateral | Index Scan Backward using composite | — | Index Only Scan using composite | Index Only Scan using composite |
| `c1-year` | lateral | Index Scan Backward using composite | — | Index Only Scan using composite | Index Only Scan using composite |
| `c10-recent` | lateral | Index Scan Backward using composite | — | Index Only Scan using composite | Index Only Scan using composite |
| `c10-year` | lateral | Index Scan Backward using composite | composite | Index Only Scan using composite | Index Only Scan using composite |
| `c100-recent` | lateral | Index Scan Backward using composite | composite | Index Only Scan using composite | Index Only Scan using composite |
| `c100-year` | lateral | Index Scan Backward using composite | composite | Index Only Scan using composite | Index Only Scan using composite |
| `c100-empty` | lateral | Index Scan Backward using composite | — | Index Only Scan using composite | Index Only Scan using composite |
| `many-changes` | lateral | Index Scan Backward using composite | — | Index Only Scan using composite | Index Only Scan using composite |

Read the bold rows together: **all three 100-calendar cohorts fall onto the global `createdAt`
index under the specification's shape, not just the failing one.** `c100-recent` and `c100-year`
survive at 6.9 ms and 4.8 ms only because their rows happen to sit near the top of the global
timeline, so the early exit really does fire. They are on the same cliff as `c100-empty` and are
one quiet term away from it. The lateral shape puts every cohort on the composite index
unconditionally.

The unread-count query never leaves the composite index in any configuration — it has no `ORDER BY`
and no `LIMIT`, so the planner is never offered the trade that goes wrong.

Full JSON output including every plan verbatim is reproducible with the command above; the two
plans that carry the verdict are quoted in §4.

### Run B — `activity:capacity:measure --samples 5`, 2026-08-29

Event-loop and heap health, 8 concurrent readers issuing `c100-year` page-50 reads through the
lateral shape and serializing each response on the shared loop, 10 rounds (80 reads):

| | |
| --- | --- |
| Wall clock | 201.5 ms |
| Max event-loop delay | 12.79 ms |
| p99 event-loop delay | 11.97 ms |
| Heap growth | 27.32 MB |

### CI tripwire

`server/src/scripts/activity-capacity/plan.test.ts` — 400 calendars / 12,000 background logs,
`ANALYZE`d, **10.2 s** (budget: 30 s). It asserts no `Seq Scan on calendar_log` for a bounded token
request under both shapes, that both shapes return identical row ids page by page, that the
`(createdAt DESC, id DESC)` ordering is stable across pages and deterministic on ties, that the
fixture actually contains ties, and that the empty cohort reads a bounded number of buffers.

It does **not** use `SET enable_seqscan = off`. That was verified rather than asserted: with the
composite index dropped at the same corpus size, the specification shape falls to a sequential scan
and the assertion fails, and the lateral shape loses the index name and fails too. The test has
teeth at the size it runs at.

**The tripwire is not the capacity gate.** It is a regression detector: once TIM-395 ships the
repository, a query rewrite that loses the index fails a test instead of silently regressing
production. The gate is Run A.

---

## 6. Obligations this document creates

### On TIM-395 (the endpoint)

1. **Ship the lateral page shape.** `calendarLogPageLateralSql`. The specification's shape fails
   G3a. This is not optional and it is not a performance nicety — it is the difference between 2 ms
   and 944 ms on the majority request.
2. **Relocate `queries.ts`, do not copy it.** Move
   `server/src/scripts/activity-capacity/queries.ts` to
   `server/src/modules/calendar-log/repositories/` and import it from *both* the shipped repository
   and the harness. If the harness keeps a private copy the two drift, and this gate quietly stops
   describing the endpoint while still passing. Sharing the module makes divergence a compile error.
3. **Add no index.** The verdict is that none is needed. If TIM-395's own measurements disagree,
   that is a change to §3 and needs §8.
4. Keep the default page size at 50 and the maximum at 100.

### On TIM-401 (release review)

Re-run, in term time, and compare against this document:

```bash
# 1. Production volume — the same committed file, executed by the Founding Engineer
server/src/scripts/activity-capacity/production-aggregates.sql

# 2. Local harness
bin/server-compose.sh up -d postgres redis
cd server && npm run db:migrate
DATABASE_URL=… npm run activity:capacity:seed
DATABASE_URL=… npm run activity:capacity:compare --silent > compare.json
```

Compare specifically:

- **§1 30-day distribution.** August is the seasonal floor. If term-time p99 logs-per-calendar rises
  well above 9, re-check G7 — page bytes scale with it.
- **§1 page-byte percentiles.** If they move, re-derive the 0.41 projection ratio from Run A's
  `v1PageBytes` ÷ `storedChangeBytes` rather than reusing it.
- **G3a on the shipped route**, not on the harness query. Run A measures a query shape; TIM-401
  should measure the real endpoint and close the remaining gap between "the query is fast" and "the
  endpoint is fast".
- **G8 and G9**, which nothing here covers.

---

## 7. What may never appear here

No calendar token, calendar name, event title, event location, event description, calendar id,
calendar-log id, or cursor value appears in this document, in harness output, or in the aggregate
query results.

This is enforced by construction, not by review:

- The production read is **aggregate-only** — every projected column is a count, a bucket label, a
  percentile, a byte size, or a whole date — and runs inside `BEGIN TRANSACTION READ ONLY` with a
  statement timeout.
- `EXPLAIN` is captured against **local synthetic fixtures only**. Plan output embeds
  index-condition literals verbatim, so a production plan capture would print calendar ids and
  tokens while looking like a harmless read. The CLI refuses any non-local host.
- Everything the harness prints passes through `redactPlan`, which replaces UUIDs and quoted string
  literals with `‹redacted›` and has its own unit test.

---

## 8. Change log

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-08-29 | Document created; all gates frozen at the values in §3. | TIM-394, Runs A and B |
| 2026-08-29 | Added **G3a** (no full *index* scan). G3 as specified only forbids sequential scans and is satisfied by the 944 ms failure. | Run A, `c100-empty` plan |
| 2026-08-29 | Added the `c100-empty` cohort, which is not in TIM-394's original cohort list. 75% of production calendars carry no log. | §1 population |
| 2026-08-29 | G7 (page bytes) recorded as **estimated**, not measured, and its derivation stated. The production read could not see the v1 projection. | §4 |
