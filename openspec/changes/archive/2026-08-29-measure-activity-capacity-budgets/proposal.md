## Why

The Activity feature exists in Flutter but has been hard-disabled since the commit that
introduced it. TIM-275 established the reason: **server capacity**, not a product defect. The
Activity revival epic (TIM-389) therefore rests on a promise — that the new
`POST /v1/calendar-logs/search` endpoint is bounded and cheap enough that re-enabling the feature
does not recreate the original problem.

Today that promise is guesswork. Nobody knows how many `calendar_log` rows a real calendar
accumulates, how many calendars a real student holds, or how many bytes a 50-log page actually
weighs. The specification's budgets (p95 < 250 ms for a default page, < 500 ms for a maximum page,
no sequential scan) were written as *initial* numbers with no measurement behind them, and its
Architecture decision 4 explicitly defers the index question — "add a composite index only if the
plans show the existing indexes cannot meet the agreed budget" — to evidence that does not yet
exist.

So Ticket 2 would be designed against invented numbers, and Ticket 8 would have nothing to re-run
at release time. This change produces the numbers, the runnable harness that produced them, and the
frozen gate document that both tickets are measured against.

## What Changes

- **Author the production aggregate SQL** (`server/src/scripts/activity-capacity/production-aggregates.sql`) —
  read-only, `SET LOCAL statement_timeout`, emitting bucketed counts and percentiles only. No token,
  calendar name, event content, calendar ID, or log ID leaves the database. The Founding Engineer
  runs it and posts the anonymized result on TIM-394; this change never opens a production
  connection.
- **Add a seedable fixture corpus** (`server/src/scripts/activity-capacity/fixtures.ts`) that
  reproduces the measured buckets locally: a background corpus sized to production order of
  magnitude, plus the 1-calendar, 10-calendar, and 100-calendar measurement cohorts over both recent
  and year-long history, plus the many-changes-in-one-log case. Seeding is deterministic and uses
  server-side `generate_series` bulk inserts so millions of rows land in seconds, not in an ORM loop.
- **Add a measurement harness** (`server/src/scripts/activity-capacity/cli.ts`) that runs the exact
  parameterized keyset and unread-count SQL the specification mandates, and reports: first- and
  following-page p50/p95/p99 latency, unread-count latency over recent and one-year watermarks,
  serialized v1 page byte distribution, `EXPLAIN (ANALYZE, BUFFERS)` plans for every cohort, and
  event-loop delay plus heap growth under representative concurrency.
- **Add a CI proof test** that seeds a bounded corpus, `ANALYZE`s it, and asserts the planner does
  not sequentially scan `calendar_log` for a bounded token request — a regression tripwire Ticket 2
  inherits, so a later query rewrite cannot silently lose the index.
- **Freeze the gates in a committed document**
  (`docs/react-native-migration/05-tech-specs/activity-capacity-gate.md`): the aggregate volume
  buckets, the fixture definitions, the gate table with an evidence column, the plan evidence, the
  measured default-page byte distribution, and a one-line verdict — **existing indexes are
  sufficient**, or **this named composite index is required, and here is the plan that proves it**.
- **Redact by construction.** A `redact.ts` helper strips UUIDs and quoted string literals from
  `EXPLAIN` output before anything is written down, so the privacy rule is enforced by code rather
  than by a reviewer's attention.

## Non-goals

- Any production **write**, user-level or row-level inspection of production data, or load test
  against production. The production read is aggregate-only and is executed by the Founding Engineer.
- Creating an index. This change *decides* whether one is needed and proves it; the migration is
  Ticket 2's, and no `server/src/migrations/` file is touched here.
- Implementing `POST /v1/calendar-logs/search`. The harness measures the query shape the
  specification mandates; the route, DTOs, cursor encoding, and OpenAPI are Ticket 2's.
- Changing the mobile app. Nothing under `mobile/` moves, so no Architecture Book rule changes —
  the mobile-side gate ("one request per trigger after single-flight collapse") is frozen in the
  document but verified by Tickets 4 and 6, not measured here.
- Changing retention, change detection, or the notification pipeline.

## Capabilities

### New Capabilities

- `activity-capacity-gate`: The frozen, evidence-backed performance contract for the Activity read
  path — what is measured, against which fixtures, which budgets must hold, how a budget may be
  changed, and what may never appear in the recorded evidence.

### Modified Capabilities

<!-- None. No existing capability spec covers the Activity read path; Ticket 2 introduces the
     endpoint capability itself. -->

## Impact

- **Server (`server/`):** new `src/scripts/activity-capacity/` module (fixtures, query shapes,
  redaction, CLI, tests, the aggregate SQL, a README) and two `package.json` scripts. **No
  production code path changes** — nothing under `src/modules/` is modified, so the running server
  is untouched by this change.
- **Docs:** new `docs/react-native-migration/05-tech-specs/activity-capacity-gate.md`, sitting
  beside `activity-revival.md` — the specification it gates — and cross-linked from it.
- **CI:** one new server jest test file. It seeds and `ANALYZE`s a bounded corpus against the
  existing worker test database, so it costs a bounded amount of wall-clock and needs no new
  service. Its measured runtime is recorded in `tasks.md`; if it exceeds the budget stated there,
  the corpus shrinks rather than the assertion weakening.
- **Sensitive surfaces:** **the production database (read-only, aggregate-only, Founding-Engineer-executed)**
  and `ci/`-adjacent test lifecycle. No `server/src/migrations/` change. No `openapi/openapi.json`
  change. No native or store config.
- **Downstream:** Ticket 2 cannot close until this document's gate table is frozen; Ticket 8 re-runs
  this harness against the release candidate. Landing promptly is the point.
