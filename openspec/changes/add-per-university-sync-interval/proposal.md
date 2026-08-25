# Per-university minimum sync interval — the refresh throttle that today is one global 30-minute constant becomes a property of the existing school strategy, so Université Lyon 1 can be capped at one upstream fetch per hour per calendar

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

So the fix is small and lands where the knowledge already lives: **the minimum sync interval
becomes an option on the school strategy**, defaulting to today's 30 minutes, and Lyon 1 gets
its own strategy declaring 60. No database column, no migration, no API change — exactly the
"hardcoded into a provider" shape the request asked for.

Two things we found while scoping this are worth stating plainly, because they change what
"update frequency" means today (see design.md Decisions 4 and 5 and the open questions in
`## Questions for the CEO`):

1. **The sync cron is disabled.** `SyncCalendarsJob.run()` has been a no-op since
   `7f03e9d` (2025-01-14, *"chore: temporarily disable sync"*) — the call is commented out.
   Calendars are therefore refreshed **only** when a user opens the app. This change makes
   the *user-triggered* path per-university-aware, which is the path that actually generates
   load on Lyon 1 today; it also makes the cron path correct for whenever it is re-enabled.
   Whether to re-enable it is a separate decision, not part of this change.
2. **A per-calendar interval caps per-calendar frequency, not our total request rate to
   Lyon 1.** If Lyon 1 meant "≤ 1 request per hour *per student calendar*" (our reading),
   this change is sufficient. If they meant a cap on aggregate requests to their servers, we
   need a per-domain rate limiter as well — a bigger change, sized in design.md Decision 6
   and deliberately **not** included here.

## What Changes

- **`SchoolStrategyOptions` gains `minSyncIntervalMinutes`** (optional; default
  `DEFAULT_MIN_SYNC_INTERVAL_MINUTES = 30`, moved into `modules/fetch/constants.ts`).
  Documented as: the minimum time that must elapse between two upstream fetches of the same
  calendar for this university. A strategy may raise it (Lyon 1: 60) or lower it.
- **A new `univlyon1` strategy** (`modules/fetch/schools/univlyon1/univlyon1-strategy.ts`,
  registered in `schools.ts`) whose only job today is
  `match: [<Lyon 1 host — pending CEO confirmation>]` + `minSyncIntervalMinutes: 60`.
  It inherits every default behaviour (generic ICS fetcher, generic URL renamers), so it is
  behaviour-neutral apart from the interval — and it gives Lyon 1 a home for future quirks.
- **`FetchService` exposes the interval to callers**, reusing its existing strategy
  resolution:
  - `getMinSyncIntervalMinutes(source, school): number` — resolve the strategy for this
    calendar (by school code *or* URL match, unchanged logic) and return its interval.
  - `minSyncIntervalFloorMinutes: number` — the smallest interval across all registered
    strategies, computed once in the constructor. This is what keeps the DB query cheap.
- **`CalendarSyncAllService.findCalendarsToSync()` becomes two-stage**: query the DB with the
  **floor** (a strict superset of what is due — 30 min today), then drop any candidate whose
  own resolved interval has not elapsed. `school` and `content` relations are already loaded
  by `findLastUpdatedBeforeWithContent`, so resolving the strategy per candidate needs no
  extra query. Both entry points — `syncAllForUser` (the live path) and `syncAllForCronJob`
  (currently dead) — go through it, so neither can bypass the throttle.
- **`UPDATE_AFTER_MIN` is retired** from `calendar-sync.constants.ts`; the concept now lives
  in the fetch/strategy layer as a default plus per-strategy overrides. `INACTIVITY_DAYS` and
  `UPDATE_CONCURRENCY` are untouched.
- **Tests**: unit tests on `FetchService` interval resolution (URL match, school-code match,
  generic default, floor computation) and DB-backed tests in
  `calendar-sync-all.service.test.ts` proving a Lyon 1 calendar last updated 45 minutes ago is
  **not** re-fetched while a generic one is, and that the Lyon 1 one *is* re-fetched at 65
  minutes. A stale `"less than 15 min ago"` test name (the constant has been 30 for years) is
  corrected in passing.

### Explicitly out of scope

- No database column, no migration, no admin UI for the interval (per the request).
- No change to `createCalendar` — creating a calendar always fetches once, immediately. That
  is a one-off per new user and not a frequency concern.
- No per-domain aggregate rate limiting or per-strategy concurrency cap (design.md Decision 6
  — a follow-up ticket if Lyon 1 meant aggregate rate).
- No re-enabling of the sync cron (design.md Decision 5 — separate decision).
- No client-side change. Neither app needs to know; the server is authoritative and the
  clients keep receiving the last-known content when a sync is throttled.

## Capabilities

### New Capabilities

- `server-calendar-sync-policy`: when a stored calendar is due for an upstream refresh —
  today one global minimum interval, now a per-university minimum interval resolved from the
  existing school-strategy layer, with inactivity and concurrency bounds. This behaviour has
  never been captured in a spec; this change writes it down and extends it.

### Modified Capabilities

None. `mobile-calendar-sync` (the client contract) is unaffected — `POST /calendars/sync`
keeps its request and response shape, and a throttled calendar is still returned with its
last-known content.

## Impact

- **Server only**, ~5 files: `modules/fetch/strategies/school-strategy-options.type.ts`,
  `modules/fetch/strategies/school-strategy.ts`, `modules/fetch/constants.ts`,
  `modules/fetch/schools/univlyon1/` (new), `modules/fetch/schools/schools.ts`,
  `modules/fetch/services/fetch.service.ts`,
  `modules/calendar-sync/services/calendar-sync-all.service.ts`,
  `modules/calendar-sync/calendar-sync.constants.ts`.
- **No API surface change** → the committed OpenAPI spec must stay byte-identical
  (`npm run generate:openapi` produces no diff), so no client regeneration and no mobile work.
- **No schema change** → no migration.
- **Behaviour change, one school**: Lyon 1 calendars refresh at most hourly instead of at most
  half-hourly. Users see up to 30 minutes of extra staleness on that school only.
- **Verification**: `cd server && npm test -- calendar-sync fetch` (needs the docker-compose
  Postgres for the DB-backed tests) + `npm run lint` + `npm run generate:openapi` diff check.
  Post-deploy, the existing `calendarSyncCounter` metric already carries `school` and `domain`
  labels, so the Grafana stack can show the actual fetch rate per Lyon 1 domain — that is our
  evidence for them, no new instrumentation needed.
- **Rollback**: revert the commit. No data or schema to unwind.

## Questions for the CEO

Blocking on Q1 for implementation (the matcher cannot be written without it); Q2–Q5 shape
scope and can be answered alongside approval.

1. **What is Lyon 1's calendar host?** I need either a real Lyon 1 calendar URL or the
   `school.code` row we use for them (there is no `lyon` anywhere in the repo — their strategy
   does not exist yet, so today they fall through to `genericStrategy`). My assumption is a
   URL containing `univ-lyon1.fr` (ADE-style), but I do not want to guess at a matcher that
   silently matches nothing. If several hosts/subdomains are in play, all of them.
2. **Did they mean 1 hour per calendar, or an aggregate cap on requests to their servers?**
   This change delivers the former. The latter needs a per-domain rate limiter (Decision 6).
3. **Is the disabled sync cron (`7f03e9d`, 2025-01-14) intentionally still off?** Calendars
   currently refresh only when a user opens the app. Want a follow-up ticket to decide?
4. **Lyon-1-only, or should the global default move from 30 → 60 too?** I recommend
   Lyon-1-only: the mechanism makes a global change a one-line follow-up if we want it.
5. **Should we also identify ourselves to universities?** `IcalFetcher` sends axios' default
   `User-Agent` and no contact info; some strategies retry up to **15 times** per sync
   (`withRetries: true` for flaky ADE instances — one sync becomes up to 15 requests). A
   descriptive `User-Agent` with a contact URL, and a look at whether retries should count
   against the interval, would both reduce friction with universities. Say the word and I will
   file it as a separate ticket rather than widen this change.
