# Design — Measure Activity volume and freeze capacity budgets

Authoritative specification: `docs/react-native-migration/05-tech-specs/activity-revival.md`
(commit `595786a0`), sections **Observability and capacity**, **Architecture decision 2**,
**Architecture decision 4**, and **Delivery plan → Ticket 1**.

This is a measurement change. Its output is evidence and a frozen contract, not behavior. The design
decisions below exist because measurement can lie in several specific ways, and each decision closes
one of them.

## Context

The Activity read path the endpoint will run is fixed by the specification even though the endpoint
does not exist yet:

- Resolve calendar tokens through the indexed `calendar.token` (`@Index()` on
  `Calendar.token`, TypeORM-generated name).
- Page `calendar_log` by `createdAt DESC, id DESC`, constrained to `createdAt <= asOf`, filtered by
  the resolved calendar IDs, reading `limit + 1` rows to decide `nextCursor`.
- Count unread rows as `createdAt > unreadSince AND createdAt <= asOf` over the same calendar set.

Existing indexes available to that plan:

| Index | Columns | Migration |
| --- | --- | --- |
| `IDX_calendar_log_calendar_createdAt` | `calendar_log ("calendarId", "createdAt")` | `1781444474432-AddCalendarLogCalendarIndex` |
| `IDX_calendar_log_createdAt` | `calendar_log ("createdAt")` | entity `@Index`, synchronized |
| TypeORM-named token index | `calendar ("token")` | entity `@Index()` on `Calendar.token` |

Neither `calendar_log` index carries `id`, so the `(createdAt, id)` tie-breaker is not covered — the
plan must sort or filter after the index scan. Whether that matters at production scale is exactly
what this change measures.

## Decision 1 — Measure the query shape, not the endpoint

**Decision.** The harness issues the parameterized keyset and unread-count SQL directly against a
seeded database. It does not call `POST /v1/calendar-logs/search`, because Ticket 2 has not built it.

**Why.** Ticket 1 has no dependency and must land promptly, since its budgets gate Ticket 2's
acceptance. Waiting for the endpoint would invert the delivery graph. The controller, DTO
validation, and cursor codec add a small constant to the measurement and change none of the
database behavior the gates are about.

**Consequence, and how it is kept honest.** A measurement of a query shape is only useful if the
shipped endpoint runs *that* shape. So `queries.ts` is written as the single source of truth for the
SQL, and Ticket 2 **relocates** it into `modules/calendar-log/repositories/` and imports it from
there in both the repository and the harness. The harness must not keep a private copy: if Ticket 2
changes the query, the harness has to change with it or fail to compile. This is written into the
gate document as a standing obligation on Ticket 2, and Ticket 8 re-runs the harness against the
real route to close the remaining gap between "the query is fast" and "the endpoint is fast".

## Decision 2 — The gate document lives beside the specification it gates

**Decision.** `docs/react-native-migration/05-tech-specs/activity-capacity-gate.md`, cross-linked
from `activity-revival.md`'s **Observability and capacity** section.

**Why.** The ticket permits "a sibling path the Proposer justifies". The budgets are an extension of
one specific specification's capacity section, they are read by exactly the people reading that
specification, and Ticket 8's release review reads both together. A separate top-level docs area
would separate the promise from the evidence for the promise. The tech-spec directory already holds
one document per epic; this is that epic's second document, and it is named so the pairing is
obvious.

**Not chosen.** `openspec/specs/` — that is for capability specs, which this change also produces
separately and which state *rules*, not *measurements*. Numbers with dates belong in the docs tree.

## Decision 3 — Fixtures reproduce production's shape, not just the measured cohorts

**Decision.** The fixture corpus has two layers:

1. A **background corpus** sized to the production row count and calendar count from the aggregate
   read, seeded with `INSERT … SELECT FROM generate_series(…)` so it is server-side and fast.
2. The **measurement cohorts** seeded on top: 1, 10, and 100 calendars, each in a recent-history
   variant (roughly the last 30 days) and a year-long-history variant, plus a
   many-changes-in-one-log calendar carrying the p99 change-count observed in production.

**Why this is load-bearing.** Measuring a 100-calendar page against a table that contains *only*
those 100 calendars' rows proves nothing. Index selectivity, buffer behavior, and the planner's
choice between an index scan and a sequential scan all depend on how small the requested slice is
relative to the whole table. A fixture without background volume produces plans that look fine and
budgets that are meaningless — the single most likely way this change could produce a confident
wrong answer.

**Consequence.** The fixture scale is a *parameter* read from the aggregate result, not a constant.
Until the Founding Engineer's numbers land, the harness runs at a documented provisional scale, and
every number captured at provisional scale is labelled as such in the document and re-run once the
real buckets arrive. Seeding is deterministic (fixed seed, no `random()` without it) so a re-run
reproduces the same corpus.

## Decision 4 — The held-calendar cohort is approximated from notification subscriptions, with its bias stated

**Decision.** The server has no accounts, so "how many calendars does one student hold" is a
device-side fact it cannot observe directly. The closest server-side proxy is calendars per
notification subscription: `calendar_notification_subscription` grouped by
`notificationSubscriptionId`. The aggregate SQL reports that distribution, bucketed.

**Why, and the caveat that must be recorded.** That population is *students who enabled
notifications* — a biased sample, plausibly skewed toward heavier users. It is a proxy, not the
answer, and the document says so beside the number. The 1/10/100 cohort spine is therefore taken
from the specification and held fixed regardless of what the proxy shows; the proxy's job is to tell
us whether 100 is a realistic ceiling or an absurd one, and whether the *typical* case is nearer 1
or nearer 10.

## Decision 5 — Plans are captured against fixtures only, and redacted by construction

**Decision.** `EXPLAIN (ANALYZE, BUFFERS)` runs **only** against the local fixture database, never
against production. All harness output passes through `redact.ts`, which replaces UUIDs and quoted
string literals with `‹redacted›` before anything is printed or pasted into the document.

**Why.** A plan is not an aggregate. `EXPLAIN` output embeds the literal values of index conditions
and filters — which for this query means calendar UUIDs and calendar tokens, verbatim, in the
`Index Cond` line. Capturing a production plan would defeat the entire privacy posture of this
ticket while looking like a harmless read. Restricting plans to synthetic fixtures makes the
production act purely aggregate, which is what makes it safe to hand to the Founding Engineer.

Redaction is code, with its own unit test, rather than a review-time habit. The forbidden set is the
ticket's: token, calendar name, event title/location/description, calendar ID, log ID, cursor value.
Since fixture values are synthetic, redaction is defense in depth — but it is also what makes the
harness safe to run against a preproduction database later without re-litigating the question.

## Decision 6 — The CI proof test is a tripwire, not the proof

**Decision.** CI seeds a bounded corpus (target: a few thousand `calendar_log` rows across a few
dozen calendars — the exact figure and its measured runtime are recorded in `tasks.md`), runs
`ANALYZE`, and asserts the plan for a bounded token request contains no sequential scan of
`calendar_log`.

**Why the honesty matters.** PostgreSQL's planner is cost-based. On a small table it will prefer a
sequential scan *whatever* indexes exist, because that genuinely is cheaper — so a naive assertion
either fails on a correct system or gets "fixed" with `SET enable_seqscan = off`, which would make
the test assert nothing at all. The corpus must therefore be large enough that the index is honestly
the cheaper plan, and `ANALYZE` must run so the planner has statistics.

That still does not make CI the proof. The proof is the full-scale harness run recorded in the
document. CI's job is narrower and worth having: once Ticket 2 ships the repository, a query rewrite
that drops the index — a reordered `WHERE`, a wrapped column, a changed join — fails a test instead
of silently regressing production. The document states this division explicitly so nobody later
mistakes a green CI run for a capacity gate.

**If the corpus needed to make the planner behave costs more CI time than the budget in `tasks.md`
allows,** the test asserts the weaker invariants it can afford (ordering stability, keyset
correctness, no full-table row estimate) and the plan assertion moves to the harness alone — with
that downgrade written down. Weakening the assertion silently is the failure mode to avoid.

## Decision 7 — The production read is aggregate-only, time-limited, and executed by the Founding Engineer

**Decision.** `production-aggregates.sql` is committed to the repository *before* it is run. Every
statement is `SELECT`-only, wrapped in a read-only transaction with `SET LOCAL statement_timeout`,
and projects only counts, bucket labels, and percentiles. The Proposer posts it on TIM-394 for the
Founding Engineer; no pipeline stage opens a production connection.

**Why committed first.** The SQL is reviewable evidence in its own right. A reader can check that it
cannot write, cannot run long, and cannot emit an identifier, without trusting a transcript of what
was run. It also means Ticket 8 re-runs a known artifact rather than a comment.

**What it returns:** total `calendar_log` rows and the retention window's day span; logs-per-calendar
distribution (bucketed, plus p50/p90/p95/p99/max) over all time and over the last 30 days; the
`pg_column_size` distribution of `calendarChange`; the changes-per-log distribution
(`json_array_length` over `newItems`/`oldItems`/`changedItems`); the estimated bytes of a default
50-log page; and the calendars-per-notification-subscription distribution from Decision 4.

**If the numbers do not arrive in time.** Everything else lands, the document ships with its volume
table clearly marked *pending* and its numbers labelled provisional-scale, and only then does the
ticket move to `blocked` with the Founding Engineer named as unblock owner. Fixture, harness, gate
table, CI test, and index verdict methodology are never blocked on it.

## Decision 8 — A budget may move only with its evidence attached

**Decision.** The gate table carries an **Evidence** column. Every row cites either the specification
(for a budget inherited unchanged) or a specific harness run recorded in the document. Tightening or
loosening any budget requires editing that cell in the same commit, and appending to the document's
change log.

**Why.** "Frozen" is not a property of a number, it is a property of a process. Without an evidence
column, a later ticket that misses a budget can quietly raise it and still claim the gate passed —
which is precisely how the original capacity problem stayed invisible. With one, the loosening is
visible in the diff and has to be argued.

The mobile-side gates — one request per trigger after single-flight collapse, smooth cached
scrolling on supported devices — are frozen in the same table but marked as **owned by Tickets 4/6
and 8**. This harness cannot measure them, and the document says so rather than implying coverage it
does not have.

## Risks

| Risk | Mitigation |
| --- | --- |
| Fixtures without background volume produce flattering plans. | Decision 3: two-layer corpus sized from the aggregate read; provisional runs labelled. |
| The harness measures SQL the shipped endpoint does not run. | Decision 1: `queries.ts` relocates into the repository in Ticket 2; harness imports it; Ticket 8 re-runs against the route. |
| A production plan capture leaks tokens through `Index Cond`. | Decision 5: plans are fixture-only; `redact.ts` strips UUIDs and string literals regardless. |
| CI plan assertion is satisfied by planner luck at small scale. | Decision 6: sized corpus + `ANALYZE`, no `enable_seqscan` override, explicit downgrade path if the cost is too high. |
| Aggregate numbers never arrive and the ticket stalls entirely. | Decision 7: only the volume table blocks; everything else lands first. |
| A later ticket loosens a budget to make its own numbers pass. | Decision 8: evidence column + document change log. |
| The 100-calendar cohort turns out to be unrepresentative. | Decision 4: cohort spine is fixed by the specification; the subscription proxy characterizes reality beside it, bias stated. |
