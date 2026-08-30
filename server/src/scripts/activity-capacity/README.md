# Activity capacity harness (TIM-394)

The measurement behind
[`docs/react-native-migration/05-tech-specs/activity-capacity-gate.md`](../../../../docs/react-native-migration/05-tech-specs/activity-capacity-gate.md).
It seeds a representative local corpus, runs the Activity v1 read path's SQL
against it, and reports latency, plans, payload bytes, and event-loop health.

TIM-395 implements the endpoint; this harness measures the query shape it will
run, so the gate exists before the thing it gates.

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

The harness needs `DATABASE_URL` (or `--url`). It has no default: a harness that
guesses a connection is one environment variable away from guessing the wrong
one. In a worktree with shifted Compose ports, pass it explicitly:

```bash
DATABASE_URL=postgres://postgres@localhost:37491/timecalendar npm run activity:capacity:seed
```

## Commands

| Command                                                              | What it does                                                                                                                                                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run activity:capacity:seed`                                     | Clears previous fixture rows, seeds the background corpus and every cohort, `ANALYZE`s.                                                                                                 |
| `npm run activity:capacity:explain`                                  | `EXPLAIN (ANALYZE, BUFFERS)` for the token resolution, first page, following page, and both unread counts, per cohort. Redacted.                                                        |
| `npm run activity:capacity:measure`                                  | Latency, v1 page bytes, plans, and concurrent event-loop health.                                                                                                                        |
| `npm run activity:capacity:compare`                                  | Runs the whole measurement twice — once on the shipped indexes, once with the candidate composite index — then drops the candidate. This is what produces the index verdict's evidence. |
| `npm run activity:capacity:http -- --base-url http://127.0.0.1:3006` | Measures the shipped HTTP route against the same local deterministic tokens, including serialized response bytes and 8 × 10 concurrent reads. The target is loopback-only.              |

Flags go after `--`:

```bash
npm run activity:capacity:seed    -- --calendars 200000 --logs 2000000
npm run activity:capacity:measure -- --samples 100
```

`seed` defaults to 100,000 background calendars and 1,000,000 background logs.
That is below production's 444,072 / 3,893,928 on purpose — see `DEFAULT_SCALE`
in `fixtures.ts` for why the _ratio_ is what matters and why a smaller table is
the conservative direction for a plan assertion. Raise it when the machine has
the disk; the gate document records the scale every number was measured at.

Output is JSON on stdout and progress on stderr, so a run pipes straight into a
file:

```bash
npm run activity:capacity:compare --silent > /tmp/compare.json
```

## What is in here

| File                        | Role                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `queries.ts`                | The v1 keyset and unread-count SQL. **Single source of truth** — see below.                            |
| `fixtures.ts`               | Deterministic two-layer corpus: background volume plus the 1/10/100 cohorts and the many-changes case. |
| `redact.ts`                 | Strips UUIDs and quoted literals from anything printed. Tested.                                        |
| `cli.ts`                    | `seed` / `explain` / `measure` / `compare` / `all`.                                                    |
| `plan.test.ts`              | CI tripwire — a bounded token request must not sequentially scan `calendar_log`.                       |
| `production-aggregates.sql` | The Founding-Engineer-executed production read. Not run by this harness.                               |

## The obligation on TIM-395

`queries.ts` is written to be **relocated**, not copied. TIM-395 moves it to
`server/src/modules/calendar-log/repositories/` and imports it from both the
shipped repository and this harness.

If the harness keeps a private copy, the two drift and the gate quietly stops
describing the endpoint — the measurement would still pass while production
regressed. Sharing the module makes that a compile error instead.

## What the CI test is, and is not

`plan.test.ts` is a **regression tripwire**, not the capacity gate. It seeds a
bounded corpus (400 calendars / 12,000 logs), `ANALYZE`s, and asserts the planner
does not sequentially scan `calendar_log` for a bounded token request. Its job is
to fail when a later query rewrite loses the index.

It deliberately does **not** use `SET enable_seqscan = off`. On a small table a
sequential scan genuinely is cheaper, so that setting would make the test assert
nothing while looking green. The corpus is sized until the index is honestly the
cheaper plan.

The capacity gate is the full-scale `compare` run recorded in the gate document.
