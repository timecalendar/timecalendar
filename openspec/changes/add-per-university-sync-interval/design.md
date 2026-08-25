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

Four facts from reading the code that this design leans on:

- **`UPDATE_AFTER_MIN = 30` is the only rate limiter.** Neither client throttles; the Flutter
  app calls sync from three screens plus after calendar creation, the RN app on startup.
- **`syncAllForCronJob` is currently dead.** `SyncCalendarsJob.run()` has its body commented
  out since `7f03e9d` (2025-01-14). It is still exercised by tests, so keeping it correct
  costs nothing and it must not be able to bypass the throttle when re-enabled. The CEO plans
  to re-enable it at the start of the academic year, a few weeks out — so this path is about
  to become live again, and the design must treat it as load-bearing, not dead.
- **University detection already exists on this exact path.**
  `SchoolStrategy.isMatchingCalendarSource(school, source)` returns true when the strategy's
  `school` code equals the calendar's school code, **or** when any entry in `match` (string
  substring / `RegExp` / predicate on the source) hits the URL. `FetchService.getStrategy()`
  runs it for every fetch.
- **The moment a calendar's next fetch becomes decidable is the moment the previous one
  finishes.** `CalendarSyncService.saveCalendar()` ends with
  `calendarRepository.update(id, { lastUpdatedAt: new Date() })`, and by then the strategy for
  that calendar has already been resolved to do the fetch. That is the hook this design uses.

### Constraints

- No database storage for the interval **value** (explicit in the request) — the 60 minutes
  is hardcoded in the strategy. Storing the *derived due date* per calendar is a different
  thing and is what the CEO asked for; see Decision 3.
- No API/OpenAPI change — the committed spec is a build artifact checked in CI, and a diff
  would drag both mobile clients into this change.
- Must not make the selection query more expensive: it runs on every user sync request.

## Decision 1 — the interval is an option on the school strategy

`SchoolStrategyOptions` gains:

```ts
/**
 * Minimum number of minutes between two upstream fetches of the same calendar
 * for this school. Some universities ask us to limit how often we hit their
 * servers. Defaults to DEFAULT_MIN_SYNC_INTERVAL_MINUTES.
 */
minSyncIntervalMinutes: number
```

Required in the interface and resolved through `SchoolStrategy`'s existing `defaultOptions`
merge — exactly like `school`, `urlRenamers`, `fetcher` and `eventPipes` — so every strategy has
a concrete value and callers never handle `undefined`. Individual strategies still declare it
optionally, because the constructor takes `Partial<SchoolStrategyOptions>`.

**Why here.** "How often may we talk to this university's server" is a property of that
university's server, and the strategy is already the single place where per-university
knowledge lives (which fetcher, which URL renamers, which event pipes, how to recognise it).
Putting the interval anywhere else means a *second* university-detection table to keep in sync
with `schools.ts`, and the two would drift the first time a school changes domain.

**Alternatives rejected:**

| Alternative | Why not |
| --- | --- |
| A `SyncIntervalProvider` in `calendar-sync` with its own URL→interval map | Duplicates university detection. Two lists, two matchers, guaranteed drift. The strategy layer already does this correctly, including the school-code path a pure URL map would miss. |
| A `minSyncIntervalMinutes` column on the `School` entity | Ruled out by the request ("no need to store the 1h parameter in a database"), and it would only cover calendars with a `school` FK — many calendars have `schoolName` and a null `school`, which is exactly the URL-detection case. Noted as the natural future step if this ever needs to be operator-tunable without a deploy. |
| A hardcoded `Record<domain, minutes>` in `calendar-sync.constants.ts` | Simplest to write, but it is the "second detection table" in its smallest form, and it cannot express the school-code match or the predicate matchers some schools need. |
| Config/env var per school | Environment sprawl for a value that changes once every few years, and it hides university-specific behaviour from the file where all other university-specific behaviour lives. |

## Decision 2 — `FetchService` answers "how often?", because it already answers "who?"

One addition to `FetchService`, reusing the existing private `getStrategy()`:

```ts
getMinSyncIntervalMinutes(calendarSource: CalendarSource, school: string | null): number
```

Its single caller is `CalendarSyncService.sync()`, which has already resolved the school code
for the fetch it is about to do — so the interval is resolved once, next to the fetch it
governs, from exactly the same inputs.

**Why not have `calendar-sync` reach into the strategy list itself?** `FetchService` owns
strategy resolution — including the `[genericStrategy, ...strategies]` ordering and the
`SCHOOL_STRATEGIES` injection token. Duplicating that resolution in a second service is how
the two paths start disagreeing about which strategy a calendar belongs to.

`CalendarSyncAllService` — the *selection* side — needs no knowledge of strategies or
intervals at all under Decision 3. It does not gain a `FetchService` dependency.

## Decision 3 — the next sync is planned when the previous one finishes (`syncPlannedAt`)

**This decision replaces the two-stage floor filtering of the first draft, at the CEO's
request. They were right, and this is the better design.** Rationale below, including what it
costs.

`Calendar` gains one column:

```ts
@Column({ type: "timestamp", default: () => "now()" })
syncPlannedAt: Date
```

**Write side** — `CalendarSyncService`. `sync()` already resolves the school code before
fetching; it resolves the interval in the same breath and hands it to `saveCalendar`, which
already owns the "stamp the calendar as synced" write:

```ts
// sync()
const code = await this.findSchoolCode(school?.id)
const minSyncIntervalMinutes = this.fetchService.getMinSyncIntervalMinutes(source, code)
…
// saveCalendar()
const now = new Date()
await this.calendarRepository.update(calendarId, {
  lastUpdatedAt: now,
  syncPlannedAt: addMinutes(now, minSyncIntervalMinutes),
})
```

**Read side** — `CalendarSyncAllService` collapses to one predicate and loses its
`subMinutes` import:

```ts
private async findCalendarsToSync({ tokens, syncEvenIfInactive } = {}) {
  const now = new Date()
  return this.calendarRepository.findDueForSyncWithContent({
    syncPlannedBefore: now,
    lastAccessedAtAfter: syncEvenIfInactive ? undefined : subDays(now, INACTIVITY_DAYS),
    filterByTokens: tokens,
  })
}
```

`findLastUpdatedBeforeWithContent` is renamed to `findDueForSyncWithContent`, its
`lastUpdatedBefore` parameter becomes `syncPlannedBefore`, and its
`order: { lastUpdatedAt: "ASC" }` becomes `order: { syncPlannedAt: "ASC" }` — oldest-due
first, which is the same fairness property, now expressed on the column that decides.

### Why this beats the floor filter

| | Floor filter (rejected) | `syncPlannedAt` (chosen) |
| --- | --- | --- |
| DB work | Loads a superset of rows, discards some in Node | Loads exactly the due rows |
| Indexable | No — the real predicate is not in SQL | Yes — one `timestamp` column, one index |
| Per-call cost | A strategy resolution per candidate row, on every sync request | Zero; resolution happens once per *actual fetch* |
| Observability | "When will this calendar next sync?" is only answerable by running the matchers | It is a column. `SELECT syncPlannedAt` answers Lyon 1's question directly |
| Extensibility | Cannot express a per-calendar decision (e.g. back off a repeatedly failing calendar) | The plan is per row, so backoff is a later one-liner |

The floor filter also had a latent trap the CEO's instinct caught: it made the DB query's
result set a function of *the smallest interval any strategy declares*. The day someone adds
a strategy with a 5-minute interval, every sync request starts loading six times as many rows
into memory across the whole fleet, for the benefit of one school. `syncPlannedAt` has no
such coupling.

### What it costs — stated plainly

1. **A migration and a column** (Decision 4). The floor filter needed neither.
2. **Stale plans when an interval changes in code.** A row already planned at
   `T + 30min` keeps that plan even after we raise its school to 60; the new interval only
   takes effect from its *next* sync. Both directions self-heal after one cycle:
   - Raising 30 → 60 (Lyon 1): at most **one** extra fetch per calendar, spaced 30 minutes,
     during the first cycle after deploy. Then correct forever.
   - Lowering an interval: calendars stay throttled a little longer for one cycle.

   We deliberately do **not** add a "recompute all plans" job or recompute on read — that
   would reintroduce per-row strategy resolution on the read path, which is the thing we just
   removed. If a future interval change ever needs to take effect immediately, it is a
   one-line `UPDATE calendar SET "syncPlannedAt" = …` run alongside the deploy, and that is
   the right amount of ceremony for a once-every-few-years event.
3. **The plan is written, not derived**, so a bug that writes a far-future value would stick.
   Bounded by the fact that the only writer is one expression, covered by tests, and the
   value is inspectable in SQL.

### Invariants preserved

- **Failures still throttle retries.** Today a failed sync of an existing calendar still
  reaches `saveCalendar` and bumps `lastUpdatedAt`, so the next attempt is 30 minutes out.
  Writing `syncPlannedAt` in the same statement preserves that exactly — a university that is
  down does not get hammered.
- **Creation is never throttled.** `createCalendar` → `sync()` with no `id` → the insert takes
  the `now()` default (due immediately, which is irrelevant since it is being fetched right
  now) and the follow-up `update` writes the real plan. A new Lyon 1 calendar is planned 60
  minutes out from creation.
- **Neither entry point can bypass it.** `syncAllForUser` and `syncAllForCronJob` both go
  through `findCalendarsToSync`, and neither gains a force flag.
- **`lastUpdatedAt` keeps its meaning** — "when was this content last refreshed" — and stays
  in `CalendarForPublicDto`, so no API change. `syncPlannedAt` is server-internal and is not
  exposed.

### Why `default: () => "now()"` rather than a nullable column

A missing plan must mean **"due now"**, never "never due" — the failure direction has to be
towards syncing. A `NOT NULL DEFAULT now()` column gives that for free, keeps the predicate a
single `syncPlannedAt < now` (no `OR … IS NULL`), and keeps the index simple. Any row that
somehow escapes the writer is picked up on the next pass instead of going silently stale.

## Decision 4 — the migration backfills `lastUpdatedAt + 30 minutes`

```sql
ALTER TABLE "calendar" ADD "syncPlannedAt" TIMESTAMP NOT NULL DEFAULT now();
UPDATE "calendar" SET "syncPlannedAt" = "lastUpdatedAt" + interval '30 minutes';
CREATE INDEX "IDX_calendar_syncPlannedAt" ON "calendar" ("syncPlannedAt");
```

- **`lastUpdatedAt + 30 minutes` reproduces today's behaviour exactly** for every existing
  row, so the deploy is behaviour-neutral at the instant it lands. Lyon 1 rows converge to 60
  after their first post-deploy sync (see the cost note above).
- **`30` is hardcoded in the SQL, not imported from the constant.** A migration is frozen
  history; importing a constant means a future edit to that constant silently rewrites what
  this migration did. Standard practice, worth stating because the constant is right there.
- **`ADD COLUMN … DEFAULT now()` is metadata-only** on PostgreSQL 11+, so the schema change
  itself does not rewrite the table; the `UPDATE` does one pass. On a table of this size
  (student calendars, not events) that is a short lock, acceptable in a normal deploy window.
- **The index is included in this migration** rather than deferred: the cron path the CEO is
  re-enabling in a few weeks scans this predicate across the whole table with no token filter.
  Today's equivalent predicate (`lastUpdatedAt`) has no index either, so this is a strict
  improvement, and it is one line in a migration we are already writing.
- **`down()`** drops the index then the column. No data to preserve — the column is derived.

Generated with `npm run db:generate` then hand-edited to add the backfill `UPDATE` and the
index (TypeORM generates neither), following the existing hand-written migration style of
`1781444474432-AddCalendarLogCalendarIndex.ts`.

## Decision 5 — `syncEvenIfInactive` stays orthogonal

`syncAllForUser` passes `syncEvenIfInactive: true`, which drops the `INACTIVITY_DAYS` bound —
a user actively opening the app is proof of activity. That is about *whether a calendar is
still worth syncing*, not *how often*; the two bounds compose, and the interval applies to
both entry points regardless. No change.

## Decision 6 — the disabled cron is left disabled (CEO-confirmed)

`SyncCalendarsJob.run()` is a no-op (`7f03e9d`, "chore: temporarily disable sync"). The CEO's
answer: *"Leave it off. we will re enable it at the beginning of the academic year in a few
weeks."*

So it is out of scope here, but it is **not** treated as dead code: the job calls
`syncAllForCronJob`, which reads `syncPlannedAt` like the user path, and the test suite keeps
asserting that. The index in Decision 4 exists specifically for that re-enable.

## Decision 7 — per-calendar throttling, not per-domain rate limiting (CEO-confirmed scope)

This change caps **fetches per calendar**. It does not cap **fetches per university server**:
with N Lyon 1 students, worst case is N fetches per hour, in bursts of `UPDATE_CONCURRENCY`
(10) concurrent requests, spread by when students open the app.

The CEO confirmed per-calendar is the right reading. If Lyon 1 later means an aggregate cap,
the shape would be a per-domain token bucket or a per-strategy concurrency limit in
`syncAll()` — replacing the single global `pLimit(10)` with a per-domain limiter, plus
deferral rather than failure when the bucket is empty. Sized here so that conversation is
cheap; not built.

## Decision 8 — what the tests must prove, and where

The persisted design moves the interesting assertion. Selection no longer *computes*
anything — it reads a column — so the Lyon-1 behaviour is proven where it is decided:

**`fetch.service.test.ts` — resolution is correct.** A real Lyon 1 URL → 60; `school:
"univlyon1"` with an unrelated URL → 60; an unrelated URL → 30; a deliberate near-miss host →
30 (guards against an over-broad matcher).

**`calendar-sync.service.test.ts` — the plan is written correctly.** After syncing a Lyon 1
calendar, `syncPlannedAt === lastUpdatedAt + 60min`; after syncing a generic one,
`+ 30min`; after a *failed* sync of an existing calendar, the plan is still advanced (the
retry-throttling invariant).

**`calendar-sync-all.service.test.ts` — selection honours the plan.** A calendar with
`syncPlannedAt` in the future is not fetched; one in the past is; the cron entry point behaves
identically. Plus one **round-trip** test that ties the two halves together and is the real
proof of the ticket: sync a Lyon-1-URL calendar, then run `syncAllForUser` again with the
clock advanced 45 minutes — no second fetch; advance to 65 — it fetches.

**`calendar.repository.test.ts`** — the renamed `findDueForSyncWithContent` keeps its existing
coverage (token filter, inactivity bound), retargeted at the new column.

The existing suite overrides `FetchService` with `{ fetchEvents: jest.fn() }`. Prefer using
the **real** `FetchService` in the DB-backed suites and mocking at the `IcalFetcher`/axios
boundary, so real strategy resolution is exercised end to end; fall back to extending the mock
with `getMinSyncIntervalMinutes` if the wiring makes that awkward. Either way the pure
resolution logic is covered by the `FetchService` unit test.

## Risks

| Risk | Mitigation |
| --- | --- |
| The Lyon 1 matcher matches nothing (wrong host) and we silently stay at 30 min | CEO confirmed `univ-lyon1.fr`. A unit test asserts a concrete Lyon 1 URL resolves to 60, so a future host change fails loudly rather than degrading silently. |
| The matcher is too broad and slows down other schools sharing a host (shared ADE instances exist) | Match on the Lyon 1 hostname, not on a generic ADE path. The unit test includes a near-miss URL that must still resolve to 30. `match` is a substring test for all 15 strategies, so a suffix-planted host (`univ-lyon1.fr.example.com`) does over-match; kept and characterised by a test, because over-matching only syncs that host *less* often, while under-matching is what would break the promise to Lyon 1. No other registered school domain contains `univ-lyon1.fr`. |
| **Registering the strategy changes which URL we fetch for Lyon 1.** `FetchService.transformUrl` applies *every* strategy's renamers to a calendar that matched nothing, and only the matched one once it does. Lyon 1 matched nothing before, so its URLs were running through `univstetienne`'s host-agnostic `&projectId=-1` → `&projectId=3` rewrite. It is the only host-agnostic renamer in the repo (ensea's and univsmb's bail on their own host; univrouen's and univpoitiers' are host-specific literals), and it only touches URLs literally containing `&projectId=-1`. | Intended: `-1` means "the current project" in ADE and is what Lyon 1's own export URL carries, while `3` is a St-Étienne-instance id (its own comment reads `// 2025-2026`). Pinned from both sides by tests against the real strategy list, and stated in the strategy's doc comment plus a comment on the fallback itself. Degrades softly for existing calendars — 0 events raises before content is written, so the user keeps their last-known events and `syncPlannedAt` is still bumped — but **adding a new** Lyon 1 calendar with `projectId=-1` would fail outright. Reversible by deleting one line from `schools.ts`. Pre-merge: count affected rows in production. |
| **The E2E seed breaks.** `scripts/seed-e2e-calendar.ts` sets `lastUpdatedAt: now` precisely so `/calendars/sync` does not make a real iCal call. Under the new predicate that row would take the `now()` default and be immediately due → E2E starts hitting the network → flake. | The seed must set `syncPlannedAt` in the future. Called out as an explicit task, not left to be discovered by a red pipeline. |
| Test factories build rows without a plan and every eligibility test silently changes meaning | `calendarFactory` gets an explicit `syncPlannedAt` default; every existing test that manipulated `lastUpdatedAt` to control eligibility is migrated to `syncPlannedAt` deliberately, one by one. |
| A row escapes the writer and never syncs again | `NOT NULL DEFAULT now()` means an unwritten plan reads as "due now" (Decision 3). |
| Users perceive Lyon 1 calendars as "not updating" | Expected and accepted: 30 extra minutes of staleness at worst, at the university's request. Content is still returned on every sync; only the upstream refetch is deferred. |
| Retry amplification (`withRetries: true` → up to 15 requests per sync) undoes the intent | Lyon 1's strategy does not set `withRetries`, so it inherits 1 attempt. The CEO declined a broader look for now (answer to Q5: "not now"). |
