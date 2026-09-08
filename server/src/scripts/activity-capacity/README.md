# Activity capacity harness (TIM-394)

The measurement behind
[`docs/react-native-migration/05-tech-specs/activity-capacity-gate.md`](../../../../docs/react-native-migration/05-tech-specs/activity-capacity-gate.md).
It seeds a representative local corpus, measures the shared Activity v1 SQL,
and can boot the real calendar-log Nest module to measure the shipped HTTP route.
The two measurements stay separate: SQL owns planner diagnosis; HTTP owns the
controller-to-serializer release proof.

## The standing rule

**This harness never connects to production, and neither does anything else in
this directory except `production-aggregates.sql`.**

`EXPLAIN` output is not an aggregate. PostgreSQL embeds the literal values of
index conditions in the plan, so a production plan capture would print calendar
UUIDs and tokens verbatim while looking like a harmless read. The CLI refuses any
host outside `localhost` / `127.0.0.1` / `::1` / `postgres` / `db`, and every line
it prints goes through `redactPlan` regardless.

The production side of this ticket is `production-aggregates.sql`: `SELECT`-only,
inside `BEGIN TRANSACTION READ ONLY`, statement-timed, projecting counts and
percentiles only. It is run by the Founding Engineer, never by a pipeline stage.

## Prerequisites

```bash
bin/server-compose.sh up -d postgres redis      # from the repository root
cd server && npm run db:migrate                  # the harness does not create schema
```

The SQL harness needs `DATABASE_URL` (or `--url`). It has no default: a harness that
guesses a connection is one environment variable away from guessing the wrong
one. In a worktree with shifted Compose ports, pass it explicitly:

```bash
DATABASE_URL=postgres://postgres@localhost:37491/timecalendar npm run activity:capacity:seed
```

## Commands

| Command                                                                      | What it does                                                                                                                                                                            |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run activity:capacity:seed`                                             | Clears previous fixture rows, seeds the background corpus and every cohort, `ANALYZE`s.                                                                                                 |
| `npm run activity:capacity:explain`                                          | `EXPLAIN (ANALYZE, BUFFERS)` for the token resolution, first page, following page, and both unread counts, per cohort. Redacted.                                                        |
| `npm run activity:capacity:measure`                                          | Latency, v1 page bytes, plans, and concurrent event-loop health.                                                                                                                        |
| `npm run activity:capacity:compare`                                          | Runs the whole measurement twice — once on the shipped indexes, once with the candidate composite index — then drops the candidate. This is what produces the index verdict's evidence. |
| `npm run activity:capacity:http -- --url <local-url> --candidate <full-sha>` | Boots the real calendar-log Nest module on loopback and measures first/following pages, both unread windows, serialized response bytes, and concurrent route health.                    |

Flags go after `--`:

```bash
npm run activity:capacity:seed    -- --calendars 200000 --logs 2000000
npm run activity:capacity:measure -- --samples 100
npm run activity:capacity:http -- --url postgres://postgres@localhost:37491/timecalendar --candidate "$(git rev-parse HEAD)" --samples 25 --warmups 3
```

`seed` defaults to 100,000 background calendars and 1,000,000 background logs.
That is below production's 444,072 / 3,893,928 on purpose — see `DEFAULT_SCALE`
in `fixtures.ts` for why the _ratio_ is what matters and why a smaller table is
the conservative direction for a plan assertion. Raise it when the machine has
the disk; the gate document records the scale every number was measured at.

Output is aggregate JSON on stdout and progress on stderr, so a run pipes
straight into a run-owned scratch file. The HTTP command requires a full
candidate SHA and includes it in the output; never relabel output for another
commit. Warm-ups are discarded, then the default policy records 25 samples per
cohort/page size plus 8 concurrent readers for 10 rounds. Request/response
bodies, tokens, ids, and cursors are never printed.

```bash
npm run activity:capacity:compare --silent > /tmp/compare.json
```

## What is in here

| File                                                                 | Role                                                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `../../modules/calendar-log/repositories/activity-search.queries.ts` | Production-owned v1 keyset and unread-count SQL imported by the repository and SQL harness.                                          |
| `fixtures.ts`                                                        | Deterministic two-layer corpus: background volume plus the 1/10/100 cohorts and the many-changes case.                               |
| `redact.ts`                                                          | Strips UUIDs and quoted literals from anything printed. Tested.                                                                      |
| `cli.ts`                                                             | `seed` / `explain` / `measure` / `compare` / `all`.                                                                                  |
| `http.ts`                                                            | Candidate-bound real-route measurement; it imports the lateral SQL export as an identity proof and never carries private query text. |
| `http.test.ts`                                                       | Bounded PostgreSQL-backed real-controller tripwire for the route, output, target, and shared-query contracts.                        |
| `plan.test.ts`                                                       | CI tripwire — bounded cohorts must neither sequentially scan `calendar_log` nor walk the full global index.                          |
| `production-aggregates.sql`                                          | The Founding-Engineer-executed production read. Not run by this harness.                                                             |

## Shared query ownership

`server/src/modules/calendar-log/repositories/activity-search.queries.ts` is the
single production-owned query source. `CalendarLogRepository` executes
`calendarLogPageLateralSql`; the SQL capacity CLI imports the same module. The
HTTP harness contains no query: it exercises the repository through the real
route and imports the same lateral export only so the focused identity test
fails if a private harness query appears.

## What the CI test is, and is not

`plan.test.ts` is a **regression tripwire**, not the capacity gate. It seeds a
bounded corpus (400 calendars / 12,000 logs), `ANALYZE`s, and asserts that the
one-, ten-, one-hundred- and empty-calendar lateral plans neither sequentially
scan `calendar_log` nor use its global created-at index. A mutation check proves
the same assertion rejects the known specification-shape global-index walk.

It deliberately does **not** use `SET enable_seqscan = off`. On a small table a
sequential scan genuinely is cheaper, so that setting would make the test assert
nothing while looking green. The corpus is sized until the index is honestly the
cheaper plan.

The CI tests are not latency evidence. The capacity gate is the full-scale
`compare` run plus the full-sample `http` run recorded for the exact candidate.
