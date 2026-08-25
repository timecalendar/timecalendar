# Per-university minimum sync interval — the refresh throttle that today is one global 30-minute constant becomes a per-university interval declared on the existing school strategy and persisted per calendar as a planned next-sync date, so Université Lyon 1 can be capped at one upstream fetch per hour per calendar

## Why

Université Lyon 1 asked us to reduce how often we hit their calendar servers — **1 hour
maximum**. We cannot honour that today: the throttle is a single global constant.

`server/src/modules/calendar-sync/calendar-sync.constants.ts` declares
`UPDATE_AFTER_MIN = 30`, and `CalendarSyncAllService.findCalendarsToSync()` applies it to
*every* calendar in one DB predicate:

```ts
lastUpdatedBefore: subMinutes(new Date(), UPDATE_AFTER_MIN)
```

That constant is the **only** rate limiter standing between our users and a university's
servers. Both clients call `POST /calendars/sync` eagerly and without any client-side
throttle — the Flutter app from `tabs_screen`, `home_screen`, `calendar_screen` and after
calendar creation; the RN app from its startup sync. A student who opens the app ten times
an hour produces ten sync requests; `UPDATE_AFTER_MIN` is what collapses those into at most
two upstream fetches. Raise it to 60 for Lyon 1 and we are compliant; raise it globally and
every other school's students get staler calendars for no reason.

The infrastructure to decide "which university is this?" **already exists and is already on
the sync path**. `SchoolStrategy.isMatchingCalendarSource(school, source)` matches a
calendar either by the school code the user selected **or** by URL matcher
(`match: ["grenet.fr"]`, regexes, or predicate functions), and `FetchService.getStrategy()`
resolves it on every fetch. What is missing is not detection — it is that the strategy has
no say in *how often* it may be fetched.

So the fix lands in two halves, each where the knowledge already lives:

1. **The interval becomes an option on the school strategy** — `minSyncIntervalMinutes`,
   defaulting to today's 30 minutes, with Lyon 1 declaring 60. Hardcoded in code, exactly the
   "hardcoded into a provider" shape the request asked for.
2. **The resulting due date is persisted per calendar** as `syncPlannedAt`, written at the end
   of every sync (when the strategy has just been resolved anyway). Selection becomes a single
   indexed `syncPlannedAt < now` predicate instead of a global time window.

The alternative — keep selecting on a global window and filter the surplus rows in memory —
was the first draft of this proposal and was rejected by the CEO. They were right: it loads
rows only to discard them, the real predicate is not expressible in SQL so it can never be
indexed, and it silently couples every sync request's memory footprint to the *shortest*
interval any school declares. Persisting the plan costs one column and one migration and buys
a query that means what it says. Full comparison and the costs we are accepting: design.md
Decision 3.

## What Changes

- **`SchoolStrategyOptions` gains `minSyncIntervalMinutes`** (optional; default
  `DEFAULT_MIN_SYNC_INTERVAL_MINUTES = 30` in `modules/fetch/constants.ts`). Documented as:
  the minimum time that must elapse between two upstream fetches of the same calendar for this
  university. A strategy may raise it (Lyon 1: 60) or lower it.
- **A new `univlyon1` strategy** (`modules/fetch/schools/univlyon1/univlyon1-strategy.ts`,
  registered in `schools.ts`) whose only job today is `match: ["univ-lyon1.fr"]` (CEO-confirmed
  host) + `minSyncIntervalMinutes: 60`. It inherits every default behaviour (generic ICS
  fetcher, generic URL renamers), so it is behaviour-neutral apart from the interval — and it
  gives Lyon 1 a home for future quirks.
- **`FetchService.getMinSyncIntervalMinutes(source, school): number`** — resolves the strategy
  for a calendar with the existing, unchanged logic (school code *or* URL match) and returns
  its interval.
- **`Calendar` gains `syncPlannedAt`** (`timestamp NOT NULL DEFAULT now()`, indexed): when this
  calendar may next be fetched upstream. Not exposed by the API.
- **`CalendarSyncService` writes the plan.** `sync()` resolves the interval alongside the
  school code it already resolves; `saveCalendar()` writes
  `syncPlannedAt = now + interval` in the same `update` that already writes `lastUpdatedAt`.
  Failed syncs of existing calendars advance the plan exactly as they advance `lastUpdatedAt`
  today, so a university that is down is not hammered.
- **`CalendarSyncAllService.findCalendarsToSync()` reads the plan**: one predicate,
  `syncPlannedAt < now`. It gains no dependency on the fetch layer and loses its `subMinutes`
  import. `CalendarRepository.findLastUpdatedBeforeWithContent` is renamed to
  `findDueForSyncWithContent` (`lastUpdatedBefore` → `syncPlannedBefore`, ordering moves to
  `syncPlannedAt ASC`).
- **A migration** adds the column, backfills `syncPlannedAt = lastUpdatedAt + 30 minutes` — so
  the deploy is behaviour-neutral at the instant it lands — and creates the index.
- **`UPDATE_AFTER_MIN` is retired** from `calendar-sync.constants.ts`; the concept now lives in
  the fetch/strategy layer as a default plus per-strategy overrides. `INACTIVITY_DAYS` and
  `UPDATE_CONCURRENCY` are untouched.
- **The E2E seed is updated.** `scripts/seed-e2e-calendar.ts` sets `lastUpdatedAt: now`
  specifically to stop `/calendars/sync` making a real iCal call; under the new predicate it
  must set a future `syncPlannedAt` instead, or E2E starts hitting the network.
- **Tests**: interval resolution (`fetch.service.test.ts`), plan-writing including the failure
  path (`calendar-sync.service.test.ts`), selection and both entry points
  (`calendar-sync-all.service.test.ts`) plus a round-trip test — sync a Lyon 1 calendar, no
  refetch at +45 min, refetch at +65 min — and the renamed repository method
  (`calendar.repository.test.ts`). A stale `"less than 15 min ago"` test name (the constant has
  been 30 for years) is corrected in passing.

### Explicitly out of scope

- **No database storage of the interval value** (per the request) — the 60 lives in the
  strategy. `syncPlannedAt` stores the *derived* due date, not the policy.
- No admin UI, no runtime configuration.
- No change to `createCalendar` — creating a calendar always fetches once, immediately, and is
  then planned like any other. That is a one-off per new user and not a frequency concern.
- No per-domain aggregate rate limiting or per-strategy concurrency cap (design.md Decision 7).
- No re-enabling of the sync cron — CEO: *"Leave it off. we will re enable it at the beginning
  of the academic year in a few weeks."* This change keeps that path correct and indexes the
  predicate it will scan.
- No `User-Agent` / retry-amplification work (CEO: "not now").
- No client-side change. Neither app needs to know; the server is authoritative and the clients
  keep receiving the last-known content when a sync is throttled.

## Capabilities

### New Capabilities

- `server-calendar-sync-policy`: when a stored calendar is due for an upstream refresh —
  today one global minimum interval, now a per-university minimum interval resolved from the
  existing school-strategy layer and persisted per calendar, with inactivity and concurrency
  bounds. This behaviour has never been captured in a spec; this change writes it down and
  extends it.

### Modified Capabilities

None. `mobile-calendar-sync` (the client contract) is unaffected — `POST /calendars/sync`
keeps its request and response shape, and a throttled calendar is still returned with its
last-known content.

## Impact

- **Server only**, ~10 files: `modules/fetch/constants.ts`,
  `modules/fetch/strategies/school-strategy-options.type.ts`,
  `modules/fetch/strategies/school-strategy.ts`, `modules/fetch/schools/univlyon1/` (new),
  `modules/fetch/schools/schools.ts`, `modules/fetch/services/fetch.service.ts`,
  `modules/calendar/models/calendar.entity.ts`,
  `modules/calendar/repositories/calendar.repository.ts`,
  `modules/calendar/factories/calendar.factory.ts`,
  `modules/calendar-sync/services/calendar-sync.service.ts`,
  `modules/calendar-sync/services/calendar-sync-all.service.ts`,
  `modules/calendar-sync/calendar-sync.constants.ts`, `scripts/seed-e2e-calendar.ts`,
  plus one migration.
- **Schema change** → one migration, additive, backfilled, reversible. `ADD COLUMN … DEFAULT
  now()` is metadata-only on PostgreSQL 11+; the backfill is a single `UPDATE` pass over the
  `calendar` table.
- **No API surface change** → the committed OpenAPI spec must stay byte-identical
  (`npm run generate:openapi` produces no diff), so no client regeneration and no mobile work.
  `syncPlannedAt` is not added to `CalendarForPublicDto`.
- **Behaviour change, one school**: Lyon 1 calendars refresh at most hourly instead of at most
  half-hourly. Users see up to 30 minutes of extra staleness on that school only. During the
  first cycle after deploy, backfilled Lyon 1 rows get at most one more 30-minute-spaced fetch
  before converging on 60 (design.md Decision 3).
- **Deploy ordering**: migration then code, the normal order. The backfilled value reproduces
  today's behaviour, so a window where the new column exists but the old code runs is harmless
  (old code ignores the column), and rolling back the code without rolling back the migration
  is equally safe.
- **Verification**: `cd server && npm test -- calendar-sync fetch calendar.repository` (needs
  the docker-compose Postgres for the DB-backed tests) + `npm run lint` + `npx tsc --noEmit` +
  `npm run generate:openapi` diff check + one local `npm run db:migrate` / revert round trip.
  Post-deploy, the existing `calendarSyncCounter` metric already carries `school` and `domain`
  labels, so the Grafana stack can show the actual fetch rate per Lyon 1 domain — that is our
  evidence for them, no new instrumentation needed. `SELECT "syncPlannedAt" - "lastUpdatedAt"`
  on a Lyon 1 row is the direct spot check.
- **Rollback**: revert the commit; optionally revert the migration. Nothing derived is lost —
  the column is recomputed on the next sync of each calendar.

## CEO decisions (answered 2026-08-25)

The five open questions from the first draft are resolved; recorded here so the implementation
does not relitigate them.

1. **Lyon 1's host** — match any URL containing **`univ-lyon1.fr`**.
2. **Per calendar, not aggregate** — the per-calendar cap is what they meant. No per-domain
   rate limiter for now.
3. **The disabled sync cron** — *"Leave it off. we will re enable it at the beginning of the
   academic year in a few weeks."* Not touched here; kept correct and now indexed for that day.
4. **Lyon 1 only** — the global default stays at 30 minutes.
5. **Identifying ourselves upstream** (`User-Agent`, retry amplification) — not now.
6. **Design pushback, adopted**: *"I really don't like the floor filtering. why not storing in
   a new column the date of the next sync (like `syncPlannedAt`)? migration to backfill
   existing, and for new ones we get the value from the strategy."* — this is now Decision 3;
   the floor filter is gone.
