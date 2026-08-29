## 0. Ground rules (read before task 1)

- [ ] 0.1 Read `design.md` in full, then `docs/react-native-migration/05-tech-specs/activity-revival.md` sections *Architecture decisions 2 and 4*, *Security and privacy*, *Observability and capacity*, and *Ticket 1*. Read `docs/investigations/2026-08-25-rentree-prod-health/README.md` and `07-calendar-sync-profile.md` for the artifact shape and the privacy-boundary wording this change copies.
- [ ] 0.2 Confirm the scope line before writing any code: **no** production write, **no** per-user or per-calendar drill-down, **no** load test against production, **no** file added or changed under `server/src/migrations/`, and **no** part of `POST /v1/calendar-logs/search`. The harness runs the keyset SQL shape directly; it never stands up the HTTP app.
- [ ] 0.3 Put every scratch file — probe scripts, raw JSON, `.cpuprofile` — under `$PAPERCLIP_RUN_SCRATCH_DIR`. Nothing raw from production is committed; only the reduced, aggregate artifacts are.

## 1. Production aggregate probe

- [ ] 1.1 Resolve a running API pod at run time (`kubectl -n timecalendar-production get pods`); never hard-code the pod name from `design.md`. Confirm `auth can-i create pods --subresource=exec` is still `yes`.
- [ ] 1.2 Write one probe script in the scratch directory that opens `BEGIN TRANSACTION READ ONLY`, sets `SET LOCAL statement_timeout = '60s'`, runs the A-series queries, and `ROLLBACK`s. It reads `DATABASE_URL` from `process.env` and never prints it. Run it with `kubectl -n timecalendar-production exec -i <pod> -- node - < probe.js`.
- [ ] 1.3 Run **A7** (row count, `min`/`max("createdAt")`, `pg_table_size`, `pg_indexes_size`, `pg_indexes` definitions for `calendar_log`) so the pack has one self-consistent timestamp. Cross-check against the 2026-08-29 headline in `proposal.md`; if the numbers moved materially, note it — this is a fast-growing table.
- [ ] 1.4 Run **A1** (logs per calendar over the retention window: percentiles at 0.5/0.75/0.9/0.95/0.99/1.0, mean, distinct calendars carrying logs, bucket histogram) and **A2** (the same over 30-day and 7-day windows). State the "active calendar" denominator explicitly from `calendar.lastAccessedAt`/`lastUpdatedAt` — not from log presence, because `calendar_log` records only syncs *with changes*.
- [ ] 1.5 Run **A3** (approximate held-calendar cohort: calendars per `notificationSubscriptionId` over `calendar_notification_subscription`, as percentiles, plus how many subscriptions sit at or above the 100-calendar request cap). Record the bias sentence from `design.md` alongside it.
- [ ] 1.6 Run **A4** (events per log via `json_array_length` over `newItems`/`oldItems`/`changedItems`, summed per row: percentiles + histogram) and **A5** (`octet_length("calendarChange"::text)` percentiles + histogram — the text rendering, not `pg_column_size`).
- [ ] 1.7 Run **A6** (page bytes: over a bounded random sample of calendars, the sum of `octet_length("calendarChange"::text)` across each calendar's newest 50 and newest 100 logs, reported as percentiles). If the 60 s statement timeout forces a smaller sample, shrink it and **label the sample size in the pack** — never truncate silently.
- [ ] 1.8 Verify by reading the captured output that every A-series result is a count, percentile, bucket label, or byte size, and that no identifier, token, name, URL, or event field appears. Only then copy anything out of the scratch directory.
- [ ] 1.9 If production access fails at any point: comment on TIM-402 with the exact command, namespace, and error, mention the Founding Engineer, and continue with tasks 2–6, leaving production-derived values in the artifacts as explicit `TBD (blocked on probe)`. Do not invent numbers and do not stall the branch.

## 2. Committed volume profile

- [ ] 2.1 Add `server/src/test-utils/fixtures/activity-volume-profile.ts`: a typed, exported constant holding the A1–A6 aggregate buckets and the probe date. Percentile arrays, histograms, and cohort sizes only — no identifier, no row, no sample of content. This is the single source of truth both the seeder and the tests read.
- [ ] 2.2 Give it a short header comment stating the privacy boundary and pointing at the investigation pack (task 5) for provenance.

## 3. Deterministic fixture seeder

- [ ] 3.1 Add `server/src/scripts/seed-activity-fixture.ts` and wire `"seed:activity-fixture"` in `server/package.json`, following the `db:seed` / `seed-database.ts` invocation pattern already in the repo.
- [ ] 3.2 Seed calendars to the A3 cohort distribution and logs per calendar to the A1/A2 distribution, scaled to the **p99** cohort, not the mean — a fixture seeded to the median measures nothing the budgets promise. Spread `createdAt` across a full year so the year-long shapes are real.
- [ ] 3.3 Synthesize each `calendarChange` to the A4 event-count and A5 byte distributions using generated text in the shape `calendarLogFactory` already uses (`Synthetic course N`, `Room N`). No production string is ever reproduced.
- [ ] 3.4 Make it deterministic: a fixed seed and a small explicit PRNG. `Math.random()` is banned here — two runs of the gate must compare like with like.
- [ ] 3.5 Run `ANALYZE calendar_log` (and the other seeded tables) at the end of seeding. Without statistics every plan captured later is measured against default estimates and is worthless. Assert it ran rather than leaving it to the operator.

## 4. Plan matrix, capacity harness, and the index verdict

- [ ] 4.1 Add `server/src/scripts/measure-activity-capacity.ts` and wire `"measure:activity-capacity"` in `server/package.json`, following the structure of `profile-calendar-sync.ts` / `"profile:calendar-sync"`: build, run, print one structured result object, exit non-zero on any failed assertion.
- [ ] 4.2 Implement the P1–P5 shapes from `design.md` as parameterized SQL (`= ANY($1)`, `("createdAt","id") < ($2,$3)`, `"createdAt" <= $4`, `ORDER BY "createdAt" DESC, "id" DESC`, `LIMIT 51` / `LIMIT 101`). Parameterized values only; no interpolated identifiers.
- [ ] 4.3 Measure against the seeded fixture at the 1-, 10-, and 100-calendar cohorts over recent and year-long history: p50/p95/p99 latency per shape and page size; serialized response bytes for the mapped v1 DTO shape (with `calendarToken` omitted, per the contract); unread-count latency at the 7-day and 1-year watermarks.
- [ ] 4.4 Measure maximum event-loop delay with `monitorEventLoopDelay` and peak RSS under a representative concurrent read burst, as `profile-calendar-sync.ts` does. Production pods run under a 768 MiB limit with ~410 MiB peak working memory already observed, so record headroom, not just latency.
- [ ] 4.5 Capture full `EXPLAIN (ANALYZE, BUFFERS)` text for every shape against the fixture — safe to commit verbatim because its identifiers are synthetic.
- [ ] 4.6 Implement the allowlist plan reducer from `design.md` (walk `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`, emit only the listed keys, recurse into `Plans`) and capture the production plan for each shape through it. Verify by reading the reduced output that no `Index Cond`, `Filter`, `Recheck Cond`, or `Output` string survived, and that `Sort Key` carries column names only.
- [ ] 4.7 Compare the production reduced plan against the fixture plan for each shape on node types and chosen `Index Name`. If they disagree, the fixture is unrepresentative: re-seed (usually a scale or distribution problem) and re-measure **before** freezing any budget. Record that the comparison was made either way.
- [ ] 4.8 Apply the four-condition sufficiency rule from `design.md` and record the verdict **per shape** (P1–P3 keyset, P4–P5 unread count), not as one global yes/no. For any insufficient shape, name the single index that resolves it — for P1–P3 this is expected to be `("calendarId", "createdAt" DESC, "id" DESC)`, since no current index carries `id`. **Do not create the index in this change**; `server/src/migrations/` stays untouched.
- [ ] 4.9 Make the harness assert the frozen budgets and exit non-zero on breach, naming the breached budget and its measured value. A report that always exits zero is not a gate.

## 5. Investigation pack

- [ ] 5.1 Create `docs/investigations/2026-08-29-activity-calendar-log-volume/` with `README.md` (executive summary, evidence and limitations, privacy boundary) plus `01-volume-distribution.md` (A1–A3), `02-payload-bytes.md` (A4–A6), and `03-query-plans.md` (fixture plans in full, production plans reduced, the per-shape verdict). Match the tone and structure of `docs/investigations/2026-08-25-rentree-prod-health/`.
- [ ] 5.2 Commit the exact A-series SQL as `queries.sql` in that directory so the probe is reproducible. The SQL is aggregate by construction; confirm no query selects `token`, `url`, `name`, `calendarChange` content, or any `id`.
- [ ] 5.3 Open every file with a privacy-boundary paragraph naming what it does and does not contain, as `07-calendar-sync-profile.md` does. Unlike the rentrée pack, do **not** retain school hostnames — they are not needed here.
- [ ] 5.4 Record the inherited caveats: `calendar_log` holds successful syncs *with changes* only, so a zero is a prioritization signal rather than proof of a dead source; and the A3 cohort proxy observes only students who enabled notifications.

## 6. Frozen budgets document

- [ ] 6.1 Write `docs/react-native-migration/05-tech-specs/activity-capacity-budgets.md`. For each budget give the value, measurement date, cohort and history depth, the reproducing command, and what a breach means. Link the investigation pack for provenance and the Activity revival specification for context.
- [ ] 6.2 Walk each of the specification's initial acceptance budgets — 50-log page p95 < 250 ms, 100-log page p95 < 500 ms, no sequential scan of `calendar_log` for a bounded token request, no token or event data in telemetry, one request per trigger after single-flight collapse — and **either confirm it against evidence or replace it with a measured value plus the reason**. Do not carry one forward because it was proposed, and do not loosen one to fit a measurement without saying so in one plain sentence.
- [ ] 6.3 Freeze the budgets the specification left open: page-byte ceiling (p95 and max) for the default and maximum page; the default page size, with an explicit recommendation to lower it below 50 if A6 shows default pages materially exceeding the mobile or network budget — keeping the accepted 100 maximum and the contract shape either way, and leaving group-splitting out of scope; unread-count p95 at both watermarks; a per-page shared-buffer read ceiling; and memory / event-loop-delay ceilings under the concurrent burst.
- [ ] 6.4 State the per-shape index verdict in this document too, in one table, so Ticket 2 does not have to read the investigation pack to learn whether it may add an index — and say plainly that an insufficiency authorizes only the named index.
- [ ] 6.5 Write it for a reader with no access to this ticket's session: no "as discussed", no scratch paths, no issue-thread references for load-bearing facts.

## 7. CI proof and verification

- [ ] 7.1 Add a CI-proof test (e.g. `server/src/modules/calendar-log/activity-capacity-ci-proof.test.ts`, following `calendar-sync-ci-proof.test.ts`) that parses the budgets document and asserts every published threshold equals the one the harness enforces. This is the drift guard the spec requires; it must fail when the two disagree.
- [ ] 7.2 Add a test asserting the committed volume profile is aggregate-only in shape — numeric buckets and dates, no free-form strings that could carry content — so the privacy guarantee is not review-attention-only.
- [ ] 7.3 Add a server test that seeds a small slice from the profile and asserts the keyset ordering shape is stable across pages under `(createdAt DESC, id DESC)` with equal `createdAt` values. Keep it small: this is a fixture-usability proof, not the capacity run.
- [ ] 7.4 Run the smallest gate set that proves the change from `server/`: `npm run lint`, `npm run build`, and `npm test -- --runInBand` scoped to the new tests. Record the exact commands and results in the PR body.
- [ ] 7.5 Run `npm run seed:activity-fixture` and `npm run measure:activity-capacity` end to end once locally and paste the structured result object (aggregate only) into the investigation pack, so the gate is proven runnable and not just written.

## 8. Definition of done

- [ ] 8.1 Re-read every committed artifact and confirm by inspection that no calendar token, event title, location, description, UID, calendar name, URL, opaque identifier, or connection string appears anywhere — including inside plan text and inside the harness's committed output.
- [ ] 8.2 Confirm `git diff --stat` touches no file under `server/src/migrations/`, `openapi/`, `mobile/`, `terraform/`, `k8s/`, or `.github/workflows/`, and adds no endpoint code.
- [ ] 8.3 Confirm the budgets document and the index verdict are each readable standalone by Tickets 2 and 8, and that the PR body flags the production-read-only sensitive surface.
- [ ] 8.4 File any step that turned out to need credentials, a device, or a console as a `(HUMAN: …)` note in `docs/react-native-migration/inbox/` — never as a blocker on this PR.
- [ ] 8.5 Run `openspec validate measure-activity-capacity-budgets --strict` and confirm it passes before handing off.
