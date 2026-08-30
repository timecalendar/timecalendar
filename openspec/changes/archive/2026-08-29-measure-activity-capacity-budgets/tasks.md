# Tasks

Ticket: **TIM-394** — Measure Activity volume and freeze capacity budgets (child 1 of 8 of TIM-389).
Specification: `docs/react-native-migration/05-tech-specs/activity-revival.md` @ `595786a0`.

**Order matters in one place only:** §1 must be posted to the Founding Engineer early (it is the
long pole — a human runs it), and §7 is written last because it consumes everything else. §2–§6 are
otherwise independent of the production numbers and must not wait on them.

**Local prerequisite** for §3–§6 (see `docs/agent-dev-environment.md` §4):

```bash
bin/server-compose.sh up -d postgres redis   # from repo root
```

## 1. Production aggregate SQL `[long pole — already in flight]`

The Proposer authored, verified, and dispatched this. It is the ticket's only human dependency, so
it was started in the propose stage rather than waiting a heartbeat. **Do not re-post it.**

- [x] 1.1 `production-aggregates.sql` written: eight independent
      `BEGIN TRANSACTION READ ONLY` blocks, each with `statement_timeout` and `lock_timeout`,
      projecting counts / bucket labels / percentiles / byte sizes / whole dates only — no `id`, no
      `token`, no `name`, no event content. Covers design D7 in full: totals and retention span (Q1),
      calendar population (Q2), logs-per-calendar buckets and percentiles all-time (Q3) and over 30
      days (Q4), stored *and* wire payload bytes (Q5), changes-per-log (Q6), estimated default-page
      bytes on a bounded sample (Q7, droppable), calendars-per-subscription (Q8, design D4).
- [x] 1.2 Verified against the local dev database (`server-postgres-1`, schema present): the whole
      file runs to completion under `psql -v ON_ERROR_STOP=1`, all eight blocks commit, and every
      returned column is an aggregate. Separately proved the guard bites — an `UPDATE` inside
      `BEGIN TRANSACTION READ ONLY` is rejected with `cannot execute UPDATE in a read-only
      transaction`.
- [x] 1.3 Posted on TIM-394 for `[@Founding Engineer](agent://e5083360-8e70-4144-8911-7d7656592ad1)`,
      stating that no pipeline stage opens a production connection.
- [x] 1.4 Moved to `server/src/scripts/activity-capacity/production-aggregates.sql` byte-identical
      (`git mv`, no content change).
- [x] 1.5 Results arrived 2026-08-29 and are transcribed into the gate document §1. The fixture
      quantiles in `fixtures.ts` are drawn from them, so no provisional-scale label survives.

## 2. Query shapes — the single source of truth

- [x] 2.1 Add `server/src/scripts/activity-capacity/queries.ts` exporting the two parameterized SQL
      builders the specification mandates: the keyset page
      (`WHERE "calendarId" = ANY($1) AND "createdAt" <= $2 AND ("createdAt", "id") < ($3, $4)
      ORDER BY "createdAt" DESC, "id" DESC LIMIT $5`, reading `limit + 1`) and the unread count
      (`WHERE "calendarId" = ANY($1) AND "createdAt" > $2 AND "createdAt" <= $3`), plus the token →
      calendar-id resolution over the indexed `calendar.token`. Parameterized values only; never
      string interpolation.
- [x] 2.2 Add a file-header comment recording design D1: Ticket 2 **relocates** this module into
      `server/src/modules/calendar-log/repositories/` and the harness imports it from there, so the
      shipped repository and the harness can never diverge silently.
      _(Verification: `npx tsc --noEmit` in `server/`.)_

## 3. Fixtures

- [x] 3.1 Add `server/src/scripts/activity-capacity/fixtures.ts` with a deterministic seeder (fixed
      PRNG seed; no bare `random()`). Cohorts: 1, 10, and 100 calendars, each with a recent-history
      variant (~30 days) and a year-long variant, plus one many-changes-in-one-log calendar carrying
      the p99 change count. Synthetic names/UIDs/titles only — never copied from production.
- [x] 3.2 Seed the **background corpus** (design D3) with server-side
      `INSERT INTO "calendar_log" (…) SELECT … FROM generate_series(…)`, so millions of rows land in
      seconds rather than through an ORM loop. Its size is a parameter (`--calendars`, `--logs`),
      defaulting to the documented provisional scale until §1 returns real buckets.
- [x] 3.3 Run `ANALYZE "calendar_log"; ANALYZE "calendar";` at the end of seeding — without fresh
      statistics every plan captured afterwards is meaningless.
- [x] 3.4 Verify: seed at provisional scale locally, then confirm row counts and cohort shapes with a
      counting query. Record the wall-clock seed time in the gate document.

## 4. Redaction

- [x] 4.1 Add `server/src/scripts/activity-capacity/redact.ts` — `redactPlan(text: string): string`
      replacing UUIDs and single-quoted string literals with `‹redacted›`. Everything the harness
      prints goes through it (design D5).
- [x] 4.2 Add `redact.test.ts` covering: a UUID inside an `Index Cond`, a quoted token literal, a
      quoted event title, multiple literals on one line, and a plan line with nothing to redact
      passing through unchanged.
      _(Verification: `npm test -- redact` in `server/`.)_

## 5. Measurement harness

- [x] 5.1 Add `server/src/scripts/activity-capacity/cli.ts` with subcommands `seed`, `explain`,
      `measure`, and `all`, following the existing `src/scripts/profile-calendar-sync.ts` shape
      (JSON to stdout, percentile helper, `monitorEventLoopDelay`).
- [x] 5.2 `measure`: for every cohort × history variant, sample first-page and following-page
      latency and report p50/p95/p99; sample unread-count latency over a recent watermark and a
      one-year watermark. Use enough samples that p95 is meaningful and record the sample count.
- [x] 5.3 `measure`: report the serialized **v1** page byte distribution — map rows through the v1
      shape (`id`, `calendarId`, `calendarName`, `calendarChange`, `createdAt`, `updatedAt`; **no**
      `calendarToken`) and take `Buffer.byteLength(JSON.stringify(page))`. Report p50/p95/p99 and the
      largest page from the many-changes cohort.
- [x] 5.4 `measure`: record `monitorEventLoopDelay` max and heap growth while running representative
      concurrent page reads, so the memory/event-loop gate has a number.
- [x] 5.5 `explain`: run `EXPLAIN (ANALYZE, BUFFERS)` for the keyset and unread-count queries per
      cohort, pass the output through `redactPlan`, and emit it. **Fixture database only** — the CLI
      must refuse to run against a URL it was not pointed at explicitly, and the README states plans
      are never captured against production (design D5).
- [x] 5.6 Add `activity:capacity:seed` and `activity:capacity:measure` scripts to
      `server/package.json`, following the existing `db:seed` / `app:tsnode` pattern.
- [x] 5.7 Add `server/src/scripts/activity-capacity/README.md`: prerequisites, the exact commands,
      what each subcommand emits, and the standing rule that this harness never connects to
      production.
      _(Verification: `npm run activity:capacity:seed && npm run activity:capacity:measure` completes
      locally and prints redacted JSON.)_

## 6. CI plan tripwire

- [x] 6.1 Add `server/src/scripts/activity-capacity/plan.test.ts`: seed a bounded corpus through the
      §3 seeder, `ANALYZE`, run `EXPLAIN` for a bounded token request, and assert the plan contains
      no `Seq Scan on calendar_log`. **Do not** use `SET enable_seqscan = off` (design D6) — size the
      corpus until the index is honestly the cheaper plan.
- [x] 6.2 `corpus = 12,000 background rows + 123 cohort rows / 500 calendars, runtime = 10.2 s`.
      Budget: **30 s** — inside it, no downgrade needed. The assertion was mutation-checked rather
      than assumed: dropping `IDX_calendar_log_calendar_createdAt` at this corpus size makes the
      specification shape fall to a sequential scan and the lateral shape lose the index name, so
      both assertions fail. No `enable_seqscan` override anywhere.
- [x] 6.3 Assert the ordering contract too: `(createdAt DESC, id DESC)` is stable across pages and
      deterministic when `createdAt` values tie.
      _(Verification: `npm test -- activity-capacity` in `server/`.)_

## 7. The gate document

- [x] 7.1 Write `docs/react-native-migration/05-tech-specs/activity-capacity-gate.md` with: aggregate
      volume buckets (from §1, or a table marked **pending**), fixture definitions and seed
      parameters, the frozen gate table, the plan evidence, the byte distribution, and a dated change
      log.
- [x] 7.2 The gate table starts from the specification's initial budgets — default 50-log page p95
      < 250 ms; maximum 100-log page p95 < 500 ms; no sequential scan of `calendar_log` for a bounded
      token request; no token/event data in telemetry; one request per trigger after single-flight
      collapse — and carries an **Evidence** column citing either the specification or a named
      harness run (design D8). Mark the single-flight and cached-scroll rows as owned by Tickets 4/6
      and 8, not measured here.
- [x] 7.3 State the **index verdict** explicitly: existing indexes sufficient, or a named composite
      index required with the failing plan, the proposed definition, and the plan with it present.
      Add no migration either way — that is Ticket 2's.
- [x] 7.4 State the **default page size** verdict: the measured 50-log byte distribution and whether
      50 is safe. The contract shape and the 100 maximum do not change.
- [x] 7.5 Record Ticket 2's standing obligation from design D1 (relocate `queries.ts`, keep the
      harness importing it) and Ticket 8's re-run instructions (exact commands, what to compare).
- [x] 7.6 Cross-link: add a pointer to this document from `activity-revival.md`'s **Observability and
      capacity** section. Do not otherwise edit the specification.
- [x] 7.7 **Redaction sweep.** Grep the full diff for UUIDs, `token`, quoted titles/locations, and
      cursor-like base64 before committing. Nothing identifying may land.
      _(Verification: `git diff --cached | grep -nEi "[0-9a-f]{8}-[0-9a-f]{4}-" ` returns only
      synthetic fixture constants.)_

## 8. Close out

- [x] 8.1 Green locally: `npm test -- activity-capacity redact` and `npx tsc --noEmit` in `server/`,
      plus `npm run lint` on the touched paths.
- [x] 8.2 `openspec validate measure-activity-capacity-budgets --strict`.
- [x] 8.3 Confirm the diff touches **no** `server/src/migrations/`, **no** `openapi/openapi.json`,
      **no** `mobile/`, and no production code under `server/src/modules/`.
- [x] 8.4 Update the PR body's stage marker and hand off per `pipeline-core`.
- [x] 8.5 Not needed — the aggregates arrived during this stage, so nothing is outstanding and the
      ticket does not park on `blocked`.

## 9. Deltas from the proposal `[recorded, not silent]`

The measurement changed two things the proposal fixed. Both are recorded in the gate document's
change log (§8) and in `queries.ts`.

- [x] 9.1 **Added the `c100-empty` cohort.** Not in the ticket's cohort list. 75% of production
      calendars carry no log, so an empty Activity screen is the majority request — and it is the
      only cohort that failed a budget. Omitting it would have shipped a gate that passed while the
      common case took a second.
- [x] 9.2 **Added `calendarLogPageLateralSql` beside the specification's page query, and measured
      both.** The specification's shape reads the entire `calendar_log` index for the empty cohort
      (944 ms p95, 1,004,934 rows discarded); the lateral shape takes 2.1 ms. Design D1 makes
      `queries.ts` the single source of truth that TIM-395 relocates, so the remedy belongs there.
      The contract is unchanged — `plan.test.ts` proves both shapes return identical row ids page by
      page — and no migration is added: the verdict is that the existing indexes are sufficient and
      the candidate composite index does not help.
