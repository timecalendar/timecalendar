## Why

The Activity revival epic ([TIM-389](https://paperclip.lyrolab.fr/TIM/issues/TIM-389),
specification `docs/react-native-migration/05-tech-specs/activity-revival.md`) reintroduces a
feature that was hard-disabled in Flutter for server capacity reasons. The specification carries
*initial* acceptance budgets — 50-log page p95 < 250 ms, 100-log page p95 < 500 ms, no sequential
scan, no token/event data in telemetry, one request per trigger — and says explicitly that these
are starting points that the capacity ticket must confirm or revise against real aggregate volume.

They need confirming, because the table is bigger than the specification's prose implies. A
read-only aggregate probe of production `calendar_log` run while writing this proposal
(2026-08-29, `BEGIN TRANSACTION READ ONLY`, aggregate counts only) returned:

| Measurement | Value |
| --- | --- |
| `calendar_log` rows | 3,893,905 |
| `pg_table_size` | 6,567 MB |
| `pg_indexes_size` | 384 MB |
| Oldest / newest `createdAt` | 2025-09-01 / 2026-08-29 (one-year prune is holding) |
| Indexes present | `("calendarId","createdAt")`, `("createdAt")`, PK `(id)` |

Mean stored bytes per row is therefore roughly 1.8 KB, and a `calendar_log` row is *one sync's
worth of changed events*, not one event. A default 50-row page is plausibly ~90 KB and its tail is
unknown — which is precisely the risk the specification flags ("a single log can contain many
changed events, so row pagination is not a strict byte limit"). Nothing in the repository records
the distribution, so Ticket 2 would otherwise pick a page size by feel.

The index question is equally open. No index on `calendar_log` carries `id`, and the v1 contract
orders by `(createdAt DESC, id DESC)` across up to 100 calendars. Whether PostgreSQL can serve
that from `("calendarId","createdAt")` as a bounded top-N, or falls back to a large sort over a
year of a 6.5 GB table, is a plan question with a measurable answer. The epic makes that answer
load-bearing: a "no" here is the **only** thing that authorizes Ticket 2 to add an index migration.

## What Changes

This change produces evidence and frozen gates. It writes no production data, implements no
endpoint, and adds no migration.

- **Aggregate production probe.** Read-only, statement-time-limited aggregate queries for the
  `calendar_log` distribution per active calendar, the events-per-log and bytes-per-log
  distributions, and an approximate held-calendar cohort (calendars per notification subscription).
  Committed as an investigation pack in the shape of the existing
  `docs/investigations/2026-08-25-rentree-prod-health/` precedent.
- **Query-plan evidence and an index verdict.** `EXPLAIN (ANALYZE, BUFFERS)` for the v1 keyset
  first page, following page, and `unreadCount`-after-`lastReadAt` query at 1, 10, and 100
  calendars over recent and year-long history. The verdict — existing indexes sufficient, yes or
  no, and for which query — is recorded against a decision rule fixed in `design.md` so it is not
  a judgement call at measurement time.
- **Committed representative fixtures.** A frozen aggregate *volume profile* (percentile buckets
  only) plus a deterministic seeder that materializes a representative local/preproduction
  database from it, usable by server tests and re-runnable by Tickets 2 and 8.
- **A re-runnable capacity harness.** `npm run measure:activity-capacity`, modelled on the existing
  `npm run profile:calendar-sync`, which measures page latency, page bytes, unread-count latency,
  event-loop delay and memory under concurrent reads against the fixture, and **exits non-zero when
  a frozen budget is breached**. Ticket 8 re-runs this command; it is the capacity gate.
- **Frozen budgets document.** `docs/react-native-migration/05-tech-specs/activity-capacity-budgets.md`
  — the numbers Tickets 2 and 8 are measured against, readable without this ticket's session
  context, including a page-byte ceiling and an explicit default-page-size recommendation.

**Not in scope:** any production write, any per-user or per-calendar drill-down, a load test
against production, creating an index, and any part of `POST /v1/calendar-logs/search`. The
harness exercises the v1 keyset *SQL shape* directly; it does not implement or call the endpoint.

## Capabilities

### New Capabilities

- `server-activity-capacity`: the Activity read path has frozen, evidence-backed capacity budgets
  and a committed, re-runnable gate that fails when they are breached; and the measurement
  artifacts that produce them are aggregate-only by construction.

### Modified Capabilities

<!-- none -->

## Impact

- **Docs:** new `docs/react-native-migration/05-tech-specs/activity-capacity-budgets.md`; new
  `docs/investigations/2026-08-29-activity-calendar-log-volume/` evidence pack.
- **Server:** new `src/test-utils/fixtures/activity-volume-profile.ts` (aggregate buckets), new
  `src/scripts/seed-activity-fixture.ts` and `src/scripts/measure-activity-capacity.ts`, two
  `package.json` scripts, and one CI-proof test binding the budgets document to the harness's
  enforced thresholds. No module, controller, repository, entity, or migration change.
- **Contract:** none. `openapi/openapi.json` and `mobile/src/api/generated/` are untouched.
- **Sensitive surfaces:** **production PostgreSQL, read-only** (aggregate queries under a statement
  timeout inside `BEGIN TRANSACTION READ ONLY`, executed through an existing application container
  — the service account can `create pods/exec` but cannot `create pods`, so the runbook's ephemeral
  psql pod is unavailable). `server/src/migrations/` is deliberately **not touched**: this change
  only produces the evidence that decides whether Ticket 2 may add an index. The artifacts
  themselves are the leak surface — see the privacy contract in `design.md`.
- **Risk:** the probe is the risk. A careless `EXPLAIN` paste leaks calendar UUIDs into a committed
  file. `design.md` fixes a redaction discipline that makes the leak structurally impossible rather
  than relying on review attention, and the CI-proof test asserts it.
