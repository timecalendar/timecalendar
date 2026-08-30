# 048 — Deduplicate Activity refreshes in-module and never request with zero tokens

## Status

Accepted.

## Context

Activity history was originally switched off because the legacy read path had no
cursor, no limit and no response bound: one student's request could return a year
of logs in a single unversioned payload. TIM-394 measured the real cost (a 50-log
page is p99 ≈ 981 KB) and TIM-395 shipped the bounded
`POST /v1/calendar-logs/search` replacement.

Reviving Activity in React Native reintroduces the same capacity risk by a
different route. Four independent triggers want fresh Activity — calendar sync, a
push notification, opening the screen, foregrounding the app — and four triggers
each issuing their own request is the original problem again. Two questions had
to be settled before any of them could be wired up: *what deduplicates them*, and
*when is a request worth issuing at all*.

Upstream source: `docs/react-native-migration/05-tech-specs/activity-revival.md`,
architecture decisions 6 and 7. Implemented by TIM-397; triggers are wired by
TIM-399.

## Decision

**Single-flight is a module-level promise in `@/features/activity/data`, not
TanStack Query.** Architecture decision 6 permits TanStack Query for in-flight
dedup; we decline it, for reasons that are properties of the callers rather than
preferences:

- The callers are not components. Calendar sync, the push handler and the
  lifecycle listener are plain modules, where `useMutation` is uncallable —
  reaching the dedup would mean threading a `QueryClient` singleton into
  non-React code.
- `fetchQuery` dedup writes to the query cache, and Activity must not enter the
  persisted school-selection cache. Using no query layer at all is a stronger
  guarantee than configuring one not to persist, and it is testable as an
  import-level fact.
- The freshness clock must survive process death. `lastSuccessfulRefreshAt` is a
  SQLite column; TanStack's `dataUpdatedAt` is in-memory and resets on every cold
  launch, which would make "refresh when the last success is older than five
  minutes" fire on every single app start.

The newest page and the older page hold **independent** slots, so a backfill can
neither block nor be blocked by a forced refresh.

**No Activity request is issued unless the device holds between 1 and 100 unique
calendar tokens — on either path.** The server short-circuits an empty token
array *before* it distinguishes a first page from a following page, and `tokens`
carries no `@ArrayNotEmpty()`, so `tokens: []` is a deliberate `200` that nothing
in the contract or the generated client prevents the client from sending. Each
path then corrupts state irreversibly:

- **Newest page — the badge wipe.** `emptyPage` returns `unreadCount: 0` without
  reaching `countUnread`. A passive refresh sends `unreadSince`, so the
  request-branching rule reads that `0` as legitimate, stores it, and clears the
  badge on a device that has unread activity.
- **Older page — permanent chain death.** The response is a `200` with
  `nextCursor: null`, which writes `olderPageComplete: true`. Nothing ever clears
  it: a newest-page write deliberately keeps a completed chain complete, and the
  only writer of `false` is the cursor reset, which fires only on a `400`. The
  student could never load older history again on any later launch, short of
  clearing the database.

The upper bound is the same guard, not a second one: above 100 unique tokens the
server answers `400` unconditionally, so issuing is a guaranteed failure that a
trigger loop would repeat.

Rejected: implementing the older-page half by ignoring `nextCursor: null`. That
is the legitimate final-page signal, and suppressing it restarts pagination
forever at the end of history.

## Consequences

- A failed precondition moves no state — in particular not
  `lastSuccessfulRefreshAt` — so the skip is not cached and the next trigger
  retries as soon as tokens exist. Every zero-calendar device also stops spending
  a round trip per trigger, which is free capacity headroom.
- The ownership prune normally rides a page write, so suppressing the write means
  a student who removes their **last** calendar would keep that calendar's rows
  cached. `pruneToHeldCalendars` exists to close that, and it is authoritative
  **only** when a removal event supplies the list: a speculative `findAll()`
  cannot distinguish an empty device from a read that raced the sources table,
  and pruning on the latter destroys the whole cache. TIM-399 owns the wiring.
- Single-flight rests on a check-then-assign adjacency that no type or lint rule
  can protect. Inserting an `await` between the check and the assignment silently
  reintroduces duplicate requests and passes `tsc`, ESLint and every other test.
  The concurrency tests in `coordinator.test.ts` are the only guard, and they
  were mutation-verified against exactly that edit.
- A lint boundary confines the generated calendar-log client and the
  `activityLogs` / `activityState` tables to `src/features/activity/data/`. B-1
  is sublayer-scoped and would permit any feature's `data/` to issue calendar-log
  requests, so this is a `no-restricted-imports` seam ban rather than a
  `boundaries` rule.

## Revisit if

- TIM-401's capacity gate says the 50-log page budget must move — the page size
  is a single named client constant for exactly that reason.
- A trigger appears that genuinely needs a second concurrent newest-page request
  (none exists today; every trigger wants "the newest page, now or recently").
- A future Activity surface is built from components only, making a hook-based
  dedup viable — the non-component callers are the load-bearing half of the
  TanStack Query rejection.
