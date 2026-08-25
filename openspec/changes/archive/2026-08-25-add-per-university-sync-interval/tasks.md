# Tasks

Single PR, server-only, one migration. No blockers remain — the CEO confirmed Lyon 1's host
(`univ-lyon1.fr`), per-calendar scope, Lyon-1-only, cron stays off, and the `syncPlannedAt`
design (see proposal `## CEO decisions`).

Order matters: phases 1–2 (fetch layer) are self-contained; phase 3 (schema) must land before
phases 4–5 compile; phase 6 (tests + seed) is where the existing suite is migrated off
`lastUpdatedAt`-as-predicate.

## 1. Fetch layer — the interval becomes a strategy option

- [x] 1.1 In `server/src/modules/fetch/constants.ts`, add
  `export const DEFAULT_MIN_SYNC_INTERVAL_MINUTES = 30` with a docstring explaining it is the
  minimum time between two upstream fetches of the same calendar.
- [x] 1.2 In `modules/fetch/strategies/school-strategy-options.type.ts`, add the
  `minSyncIntervalMinutes: number` field, documented as "some universities ask us to limit how
  often we hit their servers; raise this for them". Match the surrounding doc-comment style.
- [x] 1.3 In `modules/fetch/strategies/school-strategy.ts`, add
  `minSyncIntervalMinutes: DEFAULT_MIN_SYNC_INTERVAL_MINUTES` to `defaultOptions` so the merged
  `options` always carries a concrete number and callers never handle `undefined`. Mirror how
  the existing defaulted options (`school`, `urlRenamers`, `fetcher`, `eventPipes`) are typed —
  required in the interface, declared optionally by strategies because the constructor takes
  `Partial<SchoolStrategyOptions>` — rather than inventing a new pattern.

## 2. Fetch layer — resolve the interval for a calendar

- [x] 2.1 In `modules/fetch/services/fetch.service.ts`, add
  `getMinSyncIntervalMinutes(calendarSource: CalendarSource, school: string | null): number`
  — reuse the existing private `getStrategy()`, fall back to `genericStrategy` exactly as
  `fetchEvents` does, and return `strategy.options.minSyncIntervalMinutes`.
- [x] 2.2 Create `modules/fetch/schools/univlyon1/univlyon1-strategy.ts`: a `SchoolStrategy`
  with `school: "univlyon1"`, `match: ["univ-lyon1.fr"]`, `minSyncIntervalMinutes: 60`, and
  nothing else — it inherits the default `IcalFetcher`, the generic URL renamers, and no event
  pipes. Add a comment recording *why* (Lyon 1 asked us to cap at 1 h) and *when* (2026-08).
  Note: schools live in the database, not the repo, so `"univlyon1"` is our chosen strategy
  key. Check the `school` table for an existing Lyon 1 row and use its `code` if one exists —
  if it does not match, only the code-based path is inert; the `univ-lyon1.fr` URL matcher
  carries the behaviour either way.
- [x] 2.3 Register it in `modules/fetch/schools/schools.ts`, keeping the list's alphabetical
  order (`univlehavre`, `univlyon1`, `univorleans`, …) in both the imports and the array.
- [x] 2.4 Confirm no other strategy's `match` also hits `univ-lyon1.fr` (`grep -rn "match:" -A4
  src/modules/fetch/schools`). `getStrategy` is a `.find()` over `[genericStrategy,
  ...strategies]` and `genericStrategy` only matches `school === "generic"`, so a new strategy
  cannot shadow an existing one — but if two `match` lists overlap, ordering becomes
  load-bearing and must be called out in the PR.
- [x] 2.5 Unit-test resolution in `modules/fetch/services/fetch.service.test.ts`: (a) a real
  Lyon 1 URL with `school: null` → 60; (b) `school: "univlyon1"` with an unrelated URL → 60;
  (c) an unrelated URL with `school: null` → 30; (d) a deliberate **near-miss** URL (same
  ADE-style shape, different host) → 30, guarding against an over-broad matcher.

## 3. Schema — the planned next sync

- [x] 3.1 In `modules/calendar/models/calendar.entity.ts`, add
  `@Column({ type: "timestamp", default: () => "now()" }) syncPlannedAt: Date`, documented as
  "when this calendar may next be fetched upstream". Not nullable — a missing plan must read as
  "due now", never "never due" (design Decision 3).
- [x] 3.2 Generate the migration with `npm run db:generate`, then hand-edit it to add, in
  `up()` and in this order: the `ADD COLUMN`, the backfill
  `UPDATE "calendar" SET "syncPlannedAt" = "lastUpdatedAt" + interval '30 minutes'`, and
  `CREATE INDEX "IDX_calendar_syncPlannedAt" ON "calendar" ("syncPlannedAt")`. `down()` drops
  the index then the column. **Hardcode `30` in the SQL** — do not import
  `DEFAULT_MIN_SYNC_INTERVAL_MINUTES`; a migration is frozen history (design Decision 4).
- [x] 3.3 Verify the migration round-trips locally against the docker-compose Postgres:
  `npm run db:migrate`, check `\d calendar` shows the column, the index, and a sane
  `syncPlannedAt` on existing rows, then `npm run typeorm migration:revert` and confirm a clean
  drop. Re-run `npm run db:generate` afterwards and confirm it produces **no** new migration
  (entity and schema agree).
- [x] 3.4 In `modules/calendar/repositories/calendar.repository.ts`, rename
  `findLastUpdatedBeforeWithContent` → `findDueForSyncWithContent`, its `lastUpdatedBefore`
  param → `syncPlannedBefore` (filtering `syncPlannedAt: LessThan(...)`), and its ordering →
  `{ syncPlannedAt: "ASC" }`. Rename the params type to match.
- [x] 3.5 Confirm `syncPlannedAt` did **not** leak into `CalendarForPublicDto` — it is
  server-internal (`modules/calendar/models/dto/calendar-for-public.dto.ts` picks fields
  explicitly, so this should be a no-op check, but the OpenAPI diff in 7.4 is the real gate).

## 4. Sync layer — write the plan

- [x] 4.1 In `modules/calendar-sync/services/calendar-sync.service.ts`, in `sync()`, resolve
  `const minSyncIntervalMinutes = this.fetchService.getMinSyncIntervalMinutes(source, code)`
  next to the existing `code` resolution, and pass it to `saveCalendar`.
- [x] 4.2 In `saveCalendar`, take `now` once and write both fields in the existing final
  update: `{ lastUpdatedAt: now, syncPlannedAt: addMinutes(now, minSyncIntervalMinutes) }`
  (`addMinutes` from `date-fns`, already a dependency).
- [x] 4.3 Confirm the failure path is unchanged in shape: an existing calendar whose fetch
  errored still reaches `saveCalendar`, so it still advances both timestamps and is not retried
  before its interval. A *new* calendar whose fetch errored still throws before any write.

## 5. Sync layer — read the plan

- [x] 5.1 In `modules/calendar-sync/services/calendar-sync-all.service.ts`, rewrite
  `findCalendarsToSync` to call `findDueForSyncWithContent({ syncPlannedBefore: now, ... })`.
  Take `now` **once** per call instead of the current two `new Date()` calls, and drop the now
  unused `subMinutes` import. *(TIM-167 rebase: `main` inlined `findCalendarsToSync` back into
  `syncAllForUser` and deleted `syncAllForCronJob`, so this is now a single
  `findDueForSyncWithContent({ syncPlannedBefore: new Date(), filterByTokens: tokens })` call —
  see design addendum.)*
- [x] 5.2 Delete `UPDATE_AFTER_MIN` from `modules/calendar-sync/calendar-sync.constants.ts`
  (its role is now `DEFAULT_MIN_SYNC_INTERVAL_MINUTES` in the fetch layer) and confirm no other
  reference survives (`grep -rn UPDATE_AFTER_MIN server/src` — note
  `scripts/seed-e2e-calendar.ts` references it in a comment, updated in 6.5). Leave
  `INACTIVITY_DAYS` untouched. *(TIM-167 rebase: `main`'s `calendarsDueBefore()` wrapper around
  `UPDATE_AFTER_MIN` goes with it — the cut-off is now just `new Date()`. `UPDATE_CONCURRENCY`
  was already deleted by `main`'s queue refactor; `calendarsActiveSince()` stays.)*
- [x] 5.3 Confirm `CalendarSyncAllService` gained **no** `FetchService` dependency — under this
  design the selection side knows nothing about strategies (design Decision 2).
- [x] 5.4 Confirm both entry points are still covered and neither gains a bypass/force flag.
  *(TIM-167 rebase: the entry points are now `syncAllForUser` → `findDueForSyncWithContent` and
  `SyncCalendarsFanoutJob` → `findDueCalendarIds`; the latter was retargeted onto
  `syncPlannedAt` as part of the merge, since the throttle lives in selection and `sync()` does
  not re-check it.)*

## 6. Tests, factories and the E2E seed

- [x] 6.1 In `modules/calendar/factories/calendar.factory.ts`, add an explicit `syncPlannedAt`
  default consistent with the existing `lastUpdatedAt: new Date()` (i.e. a calendar built by
  the factory is *not* due): `addMinutes(new Date(), DEFAULT_MIN_SYNC_INTERVAL_MINUTES)`.
- [x] 6.2 Migrate every existing test that manipulated `lastUpdatedAt` to control sync
  eligibility over to `syncPlannedAt` — deliberately, one by one, not with a blind
  search-replace: `calendar-sync-all.service.test.ts` and `calendar.repository.test.ts` are the
  two suites concerned. `lastUpdatedAt` assertions that are about *content freshness* stay.
- [x] 6.3 In `modules/calendar-sync/services/calendar-sync.service.test.ts`, prove the plan is
  written: syncing a Lyon-1-URL calendar sets `syncPlannedAt ≈ lastUpdatedAt + 60min`; a
  generic calendar gets `+ 30min`; a **failed** sync of an existing calendar still advances the
  plan (the retry-throttling invariant from 4.3).
- [x] 6.4 In `modules/calendar-sync/services/calendar-sync-all.service.test.ts`: a calendar
  with a future `syncPlannedAt` is not fetched, one with a past `syncPlannedAt` is, and the
  cron path behaves identically. *(TIM-167 rebase: the cron-path assertions moved to
  `jobs/sync-calendars-fanout.job.test.ts`, which now asserts what the fan-out enqueues.)* Add the
  **round-trip** test that is the real proof of this ticket: sync a Lyon-1-URL calendar, then
  run `syncAllForUser` with the clock at +45 min → no second fetch; at +65 min → it fetches.
  Prefer the **real** `FetchService` with mocking at the `IcalFetcher`/axios boundary over
  extending the existing `{ fetchEvents }` mock, so real strategy resolution is exercised; if
  the suite's wiring makes that awkward, extend the mock and say so in the PR description.
- [x] 6.5 Update `scripts/seed-e2e-calendar.ts`: it sets `lastUpdatedAt: now` precisely so
  `/calendars/sync` does not make a real iCal call. Set a future `syncPlannedAt` as well and
  rewrite the explanatory comment (it names `UPDATE_AFTER_MIN`, which no longer exists).
  **Without this the E2E suite starts hitting the network** (design Risks).
- [x] 6.6 Fix the stale test name `"does not update a calendar updated less than 15 min ago"`
  → the constant has not been 15 for years; name it after the planned-date behaviour now.

## 7. Verification

- [x] 7.1 `cd server && npm run lint` clean.
- [x] 7.2 `cd server && npx tsc --noEmit` clean.
- [x] 7.3 `cd server && npm test -- calendar-sync fetch calendar.repository` green (needs the
  docker-compose Postgres; the DB-backed suite uses the parallel worker-isolated harness).
- [x] 7.4 `cd server && npm run generate:openapi` → **no diff** in the committed spec (this
  change touches no controller or DTO; a diff means `syncPlannedAt` leaked into the API
  surface).
- [x] 7.5 Migration round trip verified in 3.3 is re-confirmed on a clean database
  (`npm run db:init` then `npm run db:migrate`).
- [ ] 7.6 Post-merge sanity, no new instrumentation needed: `calendarSyncCounter` already
  carries `school` and `domain` labels, so fetch rate per Lyon 1 domain is readable from
  Grafana — that is the evidence to send back to Lyon 1. Direct spot check:
  `SELECT "syncPlannedAt" - "lastUpdatedAt" FROM calendar WHERE url LIKE '%univ-lyon1.fr%'`
  should read `01:00:00` for rows synced after the deploy.

## 8. Follow-ups to file (not part of this change)

- [ ] 8.1 Re-enabling `SyncCalendarsJob` at the start of the academic year (CEO's stated plan),
  with a load estimate. This change leaves that path correct and indexes the predicate it
  scans.
