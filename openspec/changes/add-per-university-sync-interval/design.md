# Design — per-university minimum sync interval

## Context

### How a calendar gets refreshed today

```
Flutter app (tabs/home/calendar screens, after create)   RN app (startup sync)
                    │                                          │
                    └──────────── POST /calendars/sync { tokens } ─────────┐
                                                                          ▼
                                        CalendarSyncAllService.syncAllForUser()
                                                                          │
                       findCalendarsToSync() ── DB: lastUpdatedAt < now-30min
                                                  (+ token filter)        │
                                                                          ▼
                                        syncAll() ── pLimit(10) ── CalendarSyncService.sync()
                                                                          │
                                                     FetchService.fetchEvents(source, schoolCode)
                                                                          │
                                                     getStrategy() → transformUrl() → fetcher.fetch()
                                                                          ▼
                                                              the university's ICS server
```

Three facts from reading the code that this design leans on:

- **`UPDATE_AFTER_MIN = 30` is the only rate limiter.** Neither client throttles; the Flutter
  app calls sync from three screens plus after calendar creation, the RN app on startup.
- **`syncAllForCronJob` is currently dead.** `SyncCalendarsJob.run()` has its body commented
  out since `7f03e9d` (2025-01-14). It is still exercised by tests, so keeping it correct
  costs nothing and it must not be able to bypass the throttle when re-enabled.
- **University detection already exists on this exact path.**
  `SchoolStrategy.isMatchingCalendarSource(school, source)` returns true when the strategy's
  `school` code equals the calendar's school code, **or** when any entry in `match` (string
  substring / `RegExp` / predicate on the source) hits the URL. `FetchService.getStrategy()`
  runs it for every fetch. `findLastUpdatedBeforeWithContent` already loads the `school`
  relation, so both inputs are on the entity we already have in memory.

### Constraints

- No database storage for the interval (explicit in the request).
- No API/OpenAPI change — the committed spec is a build artifact checked in CI, and a diff
  would drag both mobile clients into this change.
- Must not make the DB query more expensive: `findLastUpdatedBeforeWithContent` runs on every
  user sync request.

## Decision 1 — the interval is an option on the school strategy

`SchoolStrategyOptions` gains:

```ts
/**
 * Minimum number of minutes between two upstream fetches of the same calendar
 * for this school. Some universities ask us to limit how often we hit their
 * servers. Defaults to DEFAULT_MIN_SYNC_INTERVAL_MINUTES.
 */
minSyncIntervalMinutes?: number
```

resolved through `SchoolStrategy`'s existing `defaultOptions` merge, so every strategy has a
concrete value and callers never handle `undefined`.

**Why here.** "How often may we talk to this university's server" is a property of that
university's server, and the strategy is already the single place where per-university
knowledge lives (which fetcher, which URL renamers, which event pipes, how to recognise it).
Putting the interval anywhere else means a *second* university-detection table to keep in sync
with `schools.ts`, and the two would drift the first time a school changes domain.

**Alternatives rejected:**

| Alternative | Why not |
| --- | --- |
| A `SyncIntervalProvider` in `calendar-sync` with its own URL→interval map | Duplicates university detection. Two lists, two matchers, guaranteed drift. The strategy layer already does this correctly, including the school-code path a pure URL map would miss. |
| A `minSyncIntervalMinutes` column on the `School` entity | Ruled out by the request ("no need to store the 1h parameter in a database"), and it would only cover calendars with a `school` FK — many calendars have `schoolName` and a null `school`, which is exactly the URL-detection case. Noted as the natural future step if this ever needs to be operator-tunable. |
| A hardcoded `Record<domain, minutes>` in `calendar-sync.constants.ts` | Simplest to write, but it is the "second detection table" in its smallest form, and it cannot express the school-code match or the predicate matchers some schools need. |
| Config/env var per school | Environment sprawl for a value that changes once every few years, and it hides university-specific behaviour from the file where all other university-specific behaviour lives. |

## Decision 2 — `FetchService` answers the question; `calendar-sync` asks it

Two additions to `FetchService`, both reusing the existing private `getStrategy()`:

```ts
/** Smallest interval across every registered strategy — the DB pre-filter bound. */
readonly minSyncIntervalFloorMinutes: number   // computed once in the constructor

getMinSyncIntervalMinutes(source: CalendarSource, school: string | null): number
```

`CalendarSyncAllService` injects `FetchService` directly (`CalendarSyncModule` already imports
`FetchModule`, which already exports `FetchService`, so this is DI wiring we already have).

**Why not have `calendar-sync` reach into the strategy list itself?** `FetchService` owns
strategy resolution — including the `[genericStrategy, ...strategies]` ordering and the
`SCHOOL_STRATEGIES` injection token. Duplicating that resolution in a second service is how
the two paths start disagreeing about which strategy a calendar belongs to.

## Decision 3 — two-stage filtering: query on the floor, filter on the real interval

```ts
private async findCalendarsToSync({ tokens, syncEvenIfInactive } = {}) {
  const now = new Date()
  const candidates = await this.calendarRepository.findLastUpdatedBeforeWithContent({
    lastUpdatedBefore: subMinutes(now, this.fetchService.minSyncIntervalFloorMinutes),
    lastAccessedAtAfter: syncEvenIfInactive ? undefined : subDays(now, INACTIVITY_DAYS),
    filterByTokens: tokens,
  })
  return candidates.filter((calendar) => this.isDueForSync(calendar, now))
}

private isDueForSync(calendar: Calendar, now: Date) {
  const minutes = this.fetchService.getMinSyncIntervalMinutes(
    { url: calendar.url, customData: calendar.customData },
    calendar.school?.code ?? null,
  )
  return calendar.lastUpdatedAt < subMinutes(now, minutes)
}
```

**Why the floor, and why it is safe.** The floor is the smallest interval any strategy
declares, so `lastUpdatedAt < now - floor` is a strict superset of "due under my own
interval" — no calendar that *is* due can be filtered out by the query. The in-memory pass
then removes the ones whose university asked for more room. Today the floor is 30 (nothing
declares less), so the query plan and its result set are **identical to today's**; only Lyon 1
rows are dropped afterwards. Making it a floor rather than hardcoding 30 also means a strategy
could later declare a *shorter* interval without silently doing nothing.

**Why not push it into SQL?** A `CASE`/`OR` predicate over per-school intervals would need the
university-detection rules expressed in SQL — including substring matchers and arbitrary
predicate functions. That is not expressible, and the in-memory pass is over rows we already
loaded (the query is already `relations: { school, content }`, so it is not a hot loop we are
adding to).

**Cost.** One extra strategy resolution per candidate row: a `.find()` over ~15 strategies,
each doing a handful of `String.includes`/regex tests. Negligible next to the HTTP fetch it
guards, and it runs only over rows already materialised.

**Both entry points go through `findCalendarsToSync`**, so `syncAllForUser` (the live path)
and `syncAllForCronJob` (dead today) are throttled identically. The throttle is not
bypassable by a client — `syncAllForUser` never had a "force" flag and does not gain one.

## Decision 4 — `syncEvenIfInactive` stays orthogonal

`syncAllForUser` passes `syncEvenIfInactive: true`, which drops the `INACTIVITY_DAYS` bound —
a user actively opening the app is proof of activity. That is about *whether a calendar is
still worth syncing*, not *how often*; the two bounds compose, and the interval applies to
both entry points regardless. No change.

## Decision 5 — the disabled cron is left disabled

`SyncCalendarsJob.run()` is a no-op (`7f03e9d`, "chore: temporarily disable sync"). Two
reasons not to touch it here:

- Re-enabling it *increases* load on every university, including Lyon 1 — the opposite of
  what this ticket is for, and it deserves its own risk assessment (14 days of inactivity
  filtering means the job's blast radius is "every active calendar every 5 minutes").
- The change is correct either way: the job calls `syncAllForCronJob`, which now honours
  per-university intervals.

Flagged as Q3 for the CEO. If we do want it back, that is a follow-up ticket with its own
load estimate — and it should land *after* this one.

## Decision 6 — per-calendar throttling, not per-domain rate limiting (scoped out)

This change caps **fetches per calendar**. It does not cap **fetches per university server**:
with N Lyon 1 students, worst case is N fetches per hour, in bursts of `UPDATE_CONCURRENCY`
(10) concurrent requests, spread by when students open the app.

If Lyon 1 meant an aggregate cap (Q2), the shape would be a per-domain token bucket or a
per-strategy concurrency limit in `syncAll()` — replacing the single global `pLimit(10)` with
a per-domain limiter, plus deferral rather than failure when the bucket is empty. That is a
materially bigger change (queue semantics, back-pressure, what a deferred calendar returns to
the client) and should not be smuggled into this one. Sized here so we can decide quickly if
the answer to Q2 is "aggregate".

## Decision 7 — verification is a spec-backed test, not a manual check

The DB-backed tests in `calendar-sync-all.service.test.ts` (real Postgres, `FetchService`
mocked out for event fetching) prove the throttle directly with fake timers:

- Lyon-1-URL calendar, `lastUpdatedAt = now - 45min` → `fetchEvents` **not** called.
- Lyon-1-URL calendar, `lastUpdatedAt = now - 65min` → called.
- Generic calendar, `lastUpdatedAt = now - 45min` → called (no regression for other schools).

Note the existing suite overrides `FetchService` with `{ fetchEvents: jest.fn() }`. That mock
must grow the two new members (`getMinSyncIntervalMinutes`, `minSyncIntervalFloorMinutes`) —
or, better, the DB-backed tests should use the **real** `FetchService` (it is pure apart from
the network call) and mock only at the `IcalFetcher`/axios boundary. The first is the smaller
diff and keeps the suite's existing shape; the second is more honest because it exercises real
strategy resolution. Implementation should try the real-service route first and fall back to
extending the mock if the suite's wiring makes it awkward — either way, the pure resolution
logic is covered by a dedicated `FetchService` unit test.

## Risks

| Risk | Mitigation |
| --- | --- |
| The Lyon 1 matcher matches nothing (wrong host) and we silently stay at 30 min | Blocking Q1 — get a real URL or their `school.code` before implementing. A unit test asserts a concrete real Lyon 1 URL resolves to 60. |
| The matcher is too broad and slows down other schools sharing a host (shared ADE instances exist) | Match on the Lyon 1 hostname, not on a generic ADE path. The unit test includes a near-miss URL that must still resolve to 30. |
| Users perceive Lyon 1 calendars as "not updating" | Expected and accepted: 30 extra minutes of staleness at worst, at the university's request. Content is still returned on every sync; only the upstream refetch is deferred. |
| Retry amplification (`withRetries: true` → up to 15 requests per sync) undoes the intent | Lyon 1's strategy does not set `withRetries`, so it inherits 1 attempt. Raised as Q5 for a broader look. |
