# Tasks

Single PR, server-only. **Phase 1 is blocked on CEO answer Q1** (Lyon 1's host / school code)
— every other phase can be written and tested before that answer lands, with the matcher left
as the last edit.

## 1. Confirm the Lyon 1 identity (blocking — see proposal Q1)

- [ ] 1.1 Get a real Université Lyon 1 calendar URL (or the `school.code` row we use for them)
  from the CEO. There is no `lyon` reference anywhere in the repo today, so their calendars
  currently fall through to `genericStrategy`.
- [ ] 1.2 Record the confirmed matcher(s) and the school code in this file before writing
  `univlyon1-strategy.ts`, so the strategy's `match` and `school` are both grounded in a real
  value rather than a guess.

## 2. Fetch layer — the interval becomes a strategy option

- [ ] 2.1 In `server/src/modules/fetch/constants.ts`, add
  `export const DEFAULT_MIN_SYNC_INTERVAL_MINUTES = 30` with a docstring explaining it is the
  minimum time between two upstream fetches of the same calendar.
- [ ] 2.2 In `modules/fetch/strategies/school-strategy-options.type.ts`, add the optional
  `minSyncIntervalMinutes?: number` field, documented as "some universities ask us to limit how
  often we hit their servers; raise this for them".
- [ ] 2.3 In `modules/fetch/strategies/school-strategy.ts`, add
  `minSyncIntervalMinutes: DEFAULT_MIN_SYNC_INTERVAL_MINUTES` to `defaultOptions` so the merged
  `options` always carries a concrete number and callers never handle `undefined`. Note the
  field must move from optional-in-the-interface to always-present-after-merge — mirror how the
  existing options are typed rather than inventing a new pattern.

## 3. Fetch layer — resolve the interval for a calendar

- [ ] 3.1 In `modules/fetch/services/fetch.service.ts`, add
  `getMinSyncIntervalMinutes(calendarSource: CalendarSource, school: string | null): number`
  — reuse the existing private `getStrategy()`, fall back to `genericStrategy` exactly as
  `fetchEvents` does, and return `strategy.options.minSyncIntervalMinutes`.
- [ ] 3.2 Add `readonly minSyncIntervalFloorMinutes: number`, computed **once in the
  constructor** as the minimum over `this.strategies` (which already includes
  `genericStrategy`). Do not recompute per call.
- [ ] 3.3 Unit-test `FetchService` interval resolution in
  `modules/fetch/services/fetch.service.test.ts`: (a) a real Lyon 1 URL with `school: null`
  → 60; (b) `school: "univlyon1"` with an unrelated URL → 60; (c) an unrelated URL with
  `school: null` → 30; (d) a deliberate **near-miss** URL (same ADE-style shape, different
  host) → 30, guarding against an over-broad matcher; (e) `minSyncIntervalFloorMinutes` === 30
  with the current strategy set.

## 4. Lyon 1 strategy

- [ ] 4.1 Create `modules/fetch/schools/univlyon1/univlyon1-strategy.ts`: a `SchoolStrategy`
  with the confirmed `school` code, `match: [<confirmed host(s)>]`,
  `minSyncIntervalMinutes: 60`, and nothing else — it inherits the default `IcalFetcher`,
  the generic URL renamers, and no event pipes. Add a comment recording *why* (Lyon 1's
  request) and *when*.
- [ ] 4.2 Register it in `modules/fetch/schools/schools.ts`, keeping the list's alphabetical
  order (`univlehavre`, `univlyon1`, `univorleans`, …).
- [ ] 4.3 Sanity-check strategy ordering: `getStrategy` is a `.find()` over
  `[genericStrategy, ...strategies]`, and `genericStrategy` only matches on
  `school === "generic"`, so adding a strategy cannot shadow an existing one. Confirm no other
  strategy's `match` also hits the Lyon 1 host (grep the `match` lists) — if one does, the
  first match wins and the ordering becomes load-bearing, which must be called out.

## 5. Sync layer — apply the per-calendar interval

- [ ] 5.1 In `modules/calendar-sync/services/calendar-sync-all.service.ts`, inject
  `FetchService` (no module change needed: `CalendarSyncModule` already imports `FetchModule`,
  which exports it).
- [ ] 5.2 Rewrite `findCalendarsToSync` to the two-stage form (design Decision 3): query with
  `subMinutes(now, this.fetchService.minSyncIntervalFloorMinutes)`, then
  `.filter(...)` on a private `isDueForSync(calendar, now)` that resolves the calendar's own
  interval from `{ url, customData }` + `calendar.school?.code ?? null`. Take `now` **once**
  per call and thread it through, instead of the current three separate `new Date()` calls.
- [ ] 5.3 Delete `UPDATE_AFTER_MIN` from `modules/calendar-sync/calendar-sync.constants.ts`
  (its role is now `DEFAULT_MIN_SYNC_INTERVAL_MINUTES` in the fetch layer) and confirm no other
  reference survives (`grep -rn UPDATE_AFTER_MIN server/src`). Leave `INACTIVITY_DAYS` and
  `UPDATE_CONCURRENCY` untouched.
- [ ] 5.4 Confirm both entry points are still covered: `syncAllForUser` and
  `syncAllForCronJob` both go through `findCalendarsToSync`, and neither gains a bypass flag.

## 6. Tests — the throttle is proven end to end

- [ ] 6.1 In `modules/calendar-sync/services/calendar-sync-all.service.test.ts`, resolve the
  `FetchService` mock question from design Decision 7: prefer using the **real** `FetchService`
  and mocking at the `IcalFetcher`/axios boundary so real strategy resolution is exercised;
  fall back to extending the existing `{ fetchEvents }` mock with
  `getMinSyncIntervalMinutes` + `minSyncIntervalFloorMinutes` if the suite's wiring makes the
  real service awkward. Whichever route is taken, state it in the PR description.
- [ ] 6.2 Add: a Lyon-1-URL calendar with `lastUpdatedAt = now - 45min` is **not** fetched by
  `syncAllForUser` (assert `fetchEvents` not called for it **and** `lastUpdatedAt` unchanged),
  while a generic calendar at `now - 45min` **is** — one test with both calendars is the
  strongest form, since it also proves the floor query does not drop the generic one.
- [ ] 6.3 Add: the same Lyon-1-URL calendar at `now - 65min` **is** fetched.
- [ ] 6.4 Add the equivalent Lyon-1 assertion for `syncAllForCronJob`, so the dead-but-tested
  path cannot regress when it is re-enabled.
- [ ] 6.5 Fix the stale test name `"does not update a calendar updated less than 15 min ago"`
  → 30 minutes (the constant has not been 15 for years), and use the new constant name in the
  comment if one is referenced.
- [ ] 6.6 Confirm `calendarFactory()` can build a calendar with an arbitrary `url` (check
  `modules/calendar/factories/calendar.factory.ts`); if the URL is fixed by the factory, pass
  it as an override rather than changing the factory's default.

## 7. Verification

- [ ] 7.1 `cd server && npm run lint` clean.
- [ ] 7.2 `cd server && npx tsc --noEmit` clean.
- [ ] 7.3 `cd server && npm test -- calendar-sync fetch` green (needs the docker-compose
  Postgres; the DB-backed suite uses the parallel worker-isolated harness).
- [ ] 7.4 `cd server && npm run generate:openapi` → **no diff** in the committed spec (this
  change touches no controller or DTO; a diff means something leaked into the API surface).
- [ ] 7.5 Post-merge sanity, no new instrumentation needed: the existing
  `calendarSyncMetricsService.calendarSyncCounter` already carries `school` and `domain`
  labels, so fetch rate per Lyon 1 domain is readable from the Grafana stack — that is the
  evidence to send back to Lyon 1.

## 8. Follow-ups to file (not part of this change)

- [ ] 8.1 If the CEO answers Q2 with "aggregate rate cap", file a ticket for per-domain rate
  limiting / per-strategy concurrency (design Decision 6).
- [ ] 8.2 If the CEO wants the sync cron reconsidered (Q3), file a ticket to re-enable
  `SyncCalendarsJob` with a load estimate — after this change lands.
- [ ] 8.3 If the CEO wants us to identify ourselves upstream (Q5), file a ticket for a
  descriptive `User-Agent` + contact URL on `IcalFetcher`, and for whether `withRetries: true`
  (up to 15 attempts per sync) should be bounded by the same interval budget.
