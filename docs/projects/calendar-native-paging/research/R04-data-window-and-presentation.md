# R04: data window and presentation for an index-addressed pager

Scope: how the Calendar reads events today, and the data-side contracts a windowed, index-keyed
horizontal pager needs (page identity, data window, presentation cache, settlement, memory).
Gesture and scroll mechanics belong to R02 and render cost to R03. Paths are relative to `mobile/src/`
unless noted.

## 1. Observed facts: today's read and presentation pipeline

### 1.1 Query inventory

Every Drizzle read is **synchronous on the JS thread**. The Expo driver calls
`prepareSync`/`executeSync().getAllSync()` (`mobile/node_modules/drizzle-orm/expo-sqlite/session.js:20,84`),
and `useLiveQuery` delivers the result through `query.then` in a microtask
(`db/live-query.ts:69-90`). `calendar_events` and `personal_events` have **no index**. The only
indexes in `db/schema.ts` are on `activity_logs` (`schema.ts:212-213`). Every range predicate
therefore scans the whole table.

| Read | Source | Re-query trigger on a week change | Cost | Cached? |
| --- | --- | --- | --- | --- |
| Synced timed rows | `data/sync/hooks.ts:36-60`, deps `timed:${from}:${to}` | Yes. The 3-page envelope moves, so the deps change | Full scan of `calendar_events` | No. On a deps change `useLiveQuery` returns `[]` with `updatedAt` undefined until the new read lands (`live-query.ts:119-123`) |
| Synced date-only rows | `sync/hooks.ts:61-85` | Yes | Full scan. Fetched and decoded, then thrown away by the timeline: `classifyTimedEventSupport` rejects `date-only` (`data/timed-support.ts:21-22`) and there is no all-day lane yet (product §8.3 still requires one) | No |
| Personal rows | `personal-events/data/hooks.ts:13-44` | Yes | Full scan of `personal_events` | No |
| User calendars (visibility) | `calendar-sources/data/user-calendars/hooks.ts:11-19`, whole table, no deps | No. Re-reads only on a table change | Small table | Held in hook state |
| Hidden events | `hidden-events/data/hooks.ts:17-19`, MMKV parsed read | No | One storage read | Storage seam |
| Checklist progress | `event-checklists/data/progress.ts:46-70`, deps = sorted UID set | Yes, whenever the rendered UID set changes. This is a **second, dependent** round-trip after the event read | `IN (...)` over `checklist_items` | No. It returns `[]` for a new key, so badges can drop for a commit (inference) |

`useCalendarEventsSnapshot` (`data/events.ts:96-155`) mounts **5 live queries** (the three range
queries above, plus user calendars and the change listeners) and filters hidden, cancelled,
invisible-calendar and out-of-range events in JS (`events.ts:121-136`).

**The screen mounts this snapshot twice.** It reads once for the agenda range,
`useCalendarEvents(range)` (`ui/calendar-screen.tsx:95`, a 7-day range from `selectedDate`,
`use-calendar-screen-controller.ts:133-141`), with its own checklist read
(`calendar-screen.tsx:137`). It reads again for the timeline (`calendar-screen.tsx:96`). Both
are mounted in week/day view even though the agenda result is used only when `view === "agenda"`
(`calendar-screen.tsx:198-221`). A week change therefore re-runs **8 range scans and 2 checklist
reads**.

### 1.2 Range plan → presentation

- `planCalendarThreePageRange` (`data/range-plan.ts:36-98`) is hard-coded to directions
  `[-1,0,1]`. It builds every column through `addDaysInZone`/`dayKey`, which call
  `formatInTimeZone`/`toZonedTime` (Intl), about 3×7 columns × several Intl calls per render
  (`data/week.ts:46-64`, `data/day-key.ts:9-32`).
- `useCalendarTimelinePresentation` (`data/timeline-presentation-hook.ts:29-92`) does three
  things that matter here:
  - It keeps the **retained** snapshot through a setState during render (`:49-57`). The key
    includes `generation` and the DB revision. Each completed read therefore commits an extra
    render.
  - It reprojects the retained events onto the **new** range (`:59-62`). The edge week that just
    entered the window has no rows in the retained set, so it renders **empty, indistinguishable
    from a confirmed-empty week** until the read lands. This is the §13 "misleading empty week".
    `calendar.md:207-210` documents it as intended.
  - It builds the presentation **twice** (`:64-71` and `:75-83`), the first time only to derive
    UIDs for `useChecklistProgress`.
- `buildCalendarTimelinePresentation` (`data/timeline-presentation.ts:132-204`) is a pure, frozen
  3-tuple. Each event costs about 8 tz conversions: `classifyTimedEventSupport` does 2× `dayKey`
  and 2× `getTimezoneOffset` (`timed-support.ts:33-36`), plus `dayKey`, `minuteOfDayInZone` and
  `endMinute` (2× `dayKey` + 1 conversion) (`:147-166`). Each day goes through `layoutOverlaps`
  (`data/overlap-layout.ts:57-100`, O(n log n) plus column search). The whole presentation is
  stamped with `generation` (`:54,200`).
- The renderer recomputes, **in render, per page, every render**:
  - the accessibility projection for the centre page only (`renderer/owned-calendar-canvas.tsx:515-526`);
  - `planTargetConflicts` per column, which is O(n²) connected components
    (`data/target-conflicts.ts:75-93`), at `canvas.tsx:527-536`;
  - `eventLabel` per tile (Intl `formatTimeRange` + `t()`) (`canvas.tsx:663-680`, called at
    `:759`), and again in the chooser (`:628,634`);
  - header labels through `formatDayHeaderParts` per column (`renderer/owned-calendar-header.tsx:63-80`).

  `projectCalendarAccessibilityEntries` throws on a non-centre page
  (`data/accessibility-projection.ts:50-52`). This bakes "centre = direction 0" into the data.
- When no presentation is passed, the coordinator builds a fallback empty presentation on every
  render (`renderer/owned-calendar-coordinator.ts:234-246`).

### 1.3 Transition model

`data/week-transition.ts:8-167` holds request, cancel, settle and replace, each guarded by a
`revision`. `settle` bumps `generation` (`:129`) and so does every `replace` (`:164`). The
controller exposes `rendererGeneration`, `transitionRevision`, `acceptedTransitionRevision` and
`transitionPending` (`ui/calendar-screen/use-calendar-screen-controller.ts:191-213`). `generation`
then flows into:

- the pager key (`canvas.tsx:301`), which forces a remount;
- the presentation stamp;
- the title-focus gate `presentationGeneration === generation`
  (`ui/calendar-screen/use-calendar-title-focus.ts:29-34`);
- the shell's focus context (`renderer/owned-calendar-shell.tsx:196-227`);
- the pinch guard (`owned-calendar-coordinator.ts:290`).

`firstWeekday` is the constant `1` (`use-calendar-screen-controller.ts:29`).

### 1.4 A small leak

`useRejectedRowDiagnostics` adds `${revision}:${reason}` keys to a `Set` that is never pruned
(`data/events.ts:81-91`). `revision` changes on every range read, so while any malformed row
exists the set grows with every week paged. That makes it unbounded over a session (D05 / §13).

## 2. Inference

- Per settled week, the screen probably commits 3–4 renders, each with two full presentation
  builds:
  1. the dispatch;
  2. the batched query results;
  3. the retained setState;
  4. the checklist re-key.

  Measuring this belongs to R03. Data-wise, the cost is dominated by **re-querying and
  rebuilding all three pages when only one page is new**.
- Because the driver is synchronous, a "loading" state exists only because results are routed
  through `then`/state. A store that reads synchronously **in the window-shift callback, before
  publishing**, can make an un-loaded visible page structurally rare. It will not be impossible:
  errors still happen, and an async driver could arrive later.
- React Compiler memoizes per component instance and keeps one entry per slot. It cannot act as
  a cross-page cache. Once pages stop remounting (keyed by date), though, **per-page derived data
  that depends on zoom** can safely live in the page component's own memo.
- Synced data is a rolling ±12-month upstream window (`docs/mobile/architecture-book/calendar.md:254-257`).
  Personal events are unbounded. A ±5-year page domain is therefore far beyond synced data, but a
  personal event or a `focusDate` can still sit outside it.

## 3. Design

### 3.1 Page identity: civil epoch days, not instants or generations

Pages are addressed in **civil-day space**: `EpochDay` is an integer count of days since
1970-01-01, zone-free. All page math becomes integer arithmetic with no Intl and no DST:

- `weekday(d) = (d + 4) mod 7`, because 1970-01-01 was a Thursday;
- `weekStart(d, fw) = d - ((weekday(d) - fw + 7) mod 7)`;
- `epochDayToKey`/`keyToEpochDay` use `Date.UTC` arithmetic (UTC has no DST).

Instants appear only at the two edges that need them: chunk query bounds and "now". Both use
`dayKeyToDate(key, zone)`, which is already DST-safe (`day-key.ts:16-18`).

- **Domain.** `{ mode, firstWeekday, originDay, count }`, where `originDay` is aligned to a week
  start (week mode) or is any day (day mode). The domain is built once per mount or re-base,
  centred on the initial selected day ± `DOMAIN_YEARS` (5). That gives about 522 week pages or
  about 3,652 day pages.
- **Index ↔ day.**
  - Week mode: `pageStartDay(i) = originDay + 7i` and `indexOf(d) = floor((weekStart(d) - originDay) / 7)`.
  - Day mode: `originDay + i` and `d - originDay`.
- **Page key = `${mode}:${firstWeekday}:${startDayKey}`.** It is content-addressed and survives
  re-base, so the renderer keys page components by it. The index is only a position. Under a fixed
  domain, keying by index and keying by key are equivalent. The key is also robust across re-base.
- **What does not change identity.**
  - `showWeekends`: a column filter inside the page.
  - `displayZone`: it changes the instants inside the page, not which civil days the page shows.
    Product §10 requires the selected date to be preserved.
  - Day-boundary rollover: the domain origin does not depend on "today".
- **Re-base.** A new domain is created only when:
  1. the mode changes (page size changes);
  2. `firstWeekday` changes (not user-settable at launch);
  3. a navigation target falls outside `[0, count)` (Today after a very long session, `focusDate`,
     or a personal-event deep link).

  A re-base sets the new content offset non-animated in the same commit. Pages whose keys survive
  are not remounted.
- **Generation goes away as a renderer identity.** Its jobs move to content-addressed values:
  - "Is this async focus or announcement still current?" becomes `pageKey === settledPageKey && page.status === "ready"`.
  - "Is this presentation for the current anchor?" becomes `presentation.pageKey === pageKey`, which holds by construction.
  - The pager key disappears.

  Only R01/R03's geometry concerns (pinch) may still need a token. That should be a per-gesture
  epoch local to the coordinator, never fed into data.

### 3.2 Data window: chunked, prefetched, keep-previous

- **Chunk = 4 firstWeekday-aligned weeks (28 civil days).** Chunk boundaries are week boundaries,
  so **every week page and every day page lies inside exactly one chunk**. Pages need no
  cross-chunk merge or dedupe. Because timed events that span midnight are already excluded
  (`timed-support.ts:41-42`), per-day overlap layout stays chunk-local. Day and week mode share
  chunks, so a mode switch reuses the cache.
- **Required set** = chunks intersecting `[c - P, c + P]` pages around the current rounded index
  `c`. P = 4 in week mode and 7 in day mode, which keeps the whole render window (±2) plus a full
  swipe burst resident. That is at most 3 chunks in week mode and 2 in day mode. **The required
  set changes only when crossing a chunk-boundary distance**, about every 4 week pages. Crossing a
  page usually triggers no query.
- **Reads.** A screen-scoped `CalendarWindowStore` (an external store, read through
  `useSyncExternalStore`) replaces the per-range `useLiveQuery` hooks for the timeline and the
  agenda.
  - `ensure(required)` runs in the window-shift handler (the RN callback of the UI-thread
    crossing). It reads missing chunks synchronously, using one combined pass over synced timed,
    date-only and personal rows plus checklist progress for that chunk's UIDs, then publishes once.
  - The single double-build disappears because checklist UIDs come from the chunk's rows.
  - One `addDatabaseChangeListener` per store covers `calendar_events`, `personal_events` and
    `checklist_items`. A burst re-reads **all resident chunks in one batch and one emit**, which
    keeps sync replacement atomic across pages (product §11). This is the same coalescing as
    `live-query.ts:99-106`.
- **Keep-previous, not retain-and-reproject.** A chunk entry keeps its last good rows while a
  re-read is pending (`stale: true`). A chunk never seen is `loading`, never `ready` with `[]`.
  Rows are never reprojected onto other dates. The setState-in-render at
  `timeline-presentation-hook.ts:49-57` goes away.
- **Out-of-order safety.** Each read carries `{ chunkKey, seq }`. A result is written only to its
  own `chunkKey` and only if `seq` is still the latest for that key. Results can fill the right
  chunk late, but never relabel another one. Pages read their chunk by key, so nothing recentres.
- **Filters stay in JS at presentation time.** Hidden UIDs and names, cancelled events, and
  calendar visibility are applied there, so a hide or visibility toggle invalidates presentation,
  not rows. The user-calendars read moves into the store, so there is one subscription per screen.
- **Environment invalidation.** Instant bounds depend on `displayZone`, so a zone change flushes
  rows and synchronously re-reads the required chunks in one batch. This gives the atomic
  old→new replacement of §10. Locale, scheme, contrast and the no-title string invalidate only
  presentation.
- **Loading vs empty (§13).** `PageStatus = "loading" | "ready" | "error"`. A `ready` page with
  no tiles is a confirmed empty date (§11). A `loading` page draws the grid without tiles, marks
  the page container `accessibilityState={{ busy: true }}`, and is never announced as empty. The
  settled-context announcement and title focus wait for `ready`; today's `presentationReady` gate
  already does this. With synchronous `ensure` plus prefetch, `loading` should be reachable only
  on a re-base before its first read, or on error. Any visual for it is an owner decision (see Q2).
- **Indexes.** Every query is an unindexed scan. D05 defers indexes to query-plan evidence.
  Chunking keeps the number of scans low (about 1 per 4 pages instead of 8 per page), so indexes
  can stay optional until a dense-store trace says otherwise.

### 3.3 Presentation out of render

There are two layers, and neither is computed in a render body.

1. **`PagePresentation`** is zoom-independent and built in the store and cached. It holds:
   - columns with day key, weekday and a weekend flag;
   - header label parts (precomputed `formatDayHeaderParts`);
   - tiles with overlap columns, minute geometry, appearance, title, location and checklist,
     plus **`timeLabel` and `accessibilityLabel`** (the `eventLabel` output moved into data);
   - the **chronological accessibility order** for every page. `projectCalendarAccessibilityEntries`
     loses the "centre only" throw, and the renderer decides `accessible = pageKey === settledPageKey`.

   - **Cache key:** `pageKey | chunkSeq | filterRev | envRev`, where `envRev` covers locale,
     zone, scheme, increasedContrast, noTitle and showWeekends.
   - **Bound:** an LRU of 16 pages (window 5 + prefetch + reversal headroom). Entries are frozen,
     so identity-stable props let `React.memo`/the compiler skip unchanged pages entirely.
2. **The conflict plan** depends on `settledPixelsPerHour` and the platform. It is computed in the
   **page component** with the compiler's per-instance memo, keyed by `(presentation,
   settledPixelsPerHour)`. That is safe only because pages no longer remount. It recomputes once
   per zoom settle per mounted page (5), never per scroll frame.

Presentation for a newly resident chunk is built **lazily per page on first read**, not for all
28 days at once. The shift handler builds only the pages entering the render window.

### 3.4 Settlement contract

- **Controller state:** `{ view, mode, selectedDay: EpochDay, domain }`. The `selectedIndex` and
  the `settledPageKey` are derived from it.
- **The pager reports exactly one thing: `onSettle(index)`** at native settle. The controller sets
  `selectedDay = pageStartDay(index)`. This is idempotent: the same index is a no-op. Cancelled or
  partial drags settle back to the same index, so no state changes. Interrupted momentum produces
  no intermediate settle. The header month/title stay on the old settled page until then (§6.1).
- **Commands are imperative and fired from the event that caused them:**
  `pagerRef.current.scrollToIndex(i, { animated: !reduceMotion })`. They are never stored in
  state.
  - **Today:** `target = indexOf(today)`. If it is inside the domain, call `scrollToIndex`.
    Otherwise re-base around today and mount at that index without animation.
  - **`focusDate`:** the same path, run from the param effect (`use-calendar-screen-controller.ts:158-165`).
  - **Day↔week:** map per §6.2 (week→day uses the week start; day→week uses the containing week).
    Then build a new domain, mount at that index, and preserve vertical offset and zoom (R01/R03).
  - **Agenda↔timeline:** set `selectedDay` from the agenda's active section and mount at its index.

  A non-animated programmatic scroll must still emit `onSettle`. On iOS it raises no momentum-end
  event; R02 owns synthesizing it.
- **What gets deleted:**
  - `requestCalendarTransition`, `cancelCalendarTransition`, `settleCalendarTransition` and `replaceCalendarTransition`;
  - `CalendarTransitionState`, `revision`, `pending` and `generation` (`week-transition.ts:8-26,68-167`);
  - the five matching reducer actions (`use-calendar-screen-controller.ts:31-129`).

  `normalizeTimelineAnchor`/`shiftTimelineAnchor` give way to the `EpochDay` helpers. Stale-callback
  protection is no longer needed, because a settle carries a position, not a delta. "Previous" and
  "next" from accessibility actions become `scrollToIndex(selectedIndex ± 1)`.

### 3.5 Memory bounds after hundreds of weeks (D05, §13)

| Resource | Bound |
| --- | --- |
| Row chunks | LRU of 6 chunks (24 weeks). Rows are at most the events in 24 weeks |
| Page presentations | LRU of 16 |
| Mounted page components / native views | Render window of 5 pages (R03) |
| DB listeners | 1 per store (today about 12 `useLiveQuery` listeners) |
| Checklist maps | Owned by their chunk and evicted with it |
| Diagnostics | Report keyed by `reason` + chunk content hash, with a bounded set, or report once per reason per session. This replaces the unbounded `events.ts:81` set |
| Formatter caches | Bounded by the count of `(locale, zone)` pairs (`data/format.ts:25-40`) |

No structure grows with distance paged. A soak run should assert a flat heap after 500 page
crossings in both directions.

## 4. Type sketches

```ts
type EpochDay = number & { readonly __brand: "EpochDay" }
type PageIndex = number & { readonly __brand: "PageIndex" }
type ChunkKey = `${FirstWeekday}:${string}` // first civil day of a 28-day chunk
type PageKey = `${CalendarTimelineMode}:${FirstWeekday}:${string}`

interface PageDomain {
  mode: CalendarTimelineMode
  firstWeekday: FirstWeekday
  originDay: EpochDay
  count: number
}
declare function pageStartDay(domain: PageDomain, index: PageIndex): EpochDay
declare function indexOfDay(domain: PageDomain, day: EpochDay): PageIndex | null // null → re-base
declare function pageKey(domain: PageDomain, index: PageIndex): PageKey
declare function chunkOfDay(day: EpochDay, firstWeekday: FirstWeekday): ChunkKey
declare function requiredChunks(domain: PageDomain, center: PageIndex): readonly ChunkKey[]

type PageStatus = "loading" | "ready" | "error"

interface ChunkRows {
  key: ChunkKey
  seq: number
  stale: boolean
  events: readonly CalendarEvent[] // decoded, unfiltered
  checklist: ChecklistProgressMap
}

interface TileV2 extends Omit<TimedTileV1, "version"> {
  timeLabel: string
  accessibilityLabel: string
  accessibilityOrder: number
}
interface PagePresentation {
  pageKey: PageKey
  status: PageStatus
  columns: readonly {
    key: string
    weekday: FirstWeekday
    isWeekend: boolean
    header: DayHeaderParts
    tiles: readonly TileV2[]
  }[]
}

interface CalendarWindowStore {
  subscribe(listener: () => void): () => void
  ensure(domain: PageDomain, center: PageIndex): void // sync read + one emit
  page(domain: PageDomain, index: PageIndex): PagePresentation // LRU-cached, frozen
  setEnvironment(env: PresentationEnv): void // zone flush, locale, scheme…
  dispose(): void
}

interface CalendarPagerHandle {
  scrollToIndex(index: PageIndex, options: { animated: boolean }): void
}
interface CalendarPagerProps {
  domain: PageDomain
  initialIndex: PageIndex
  onWindowShift(center: PageIndex): void // once per rounded-index crossing
  onSettle(index: PageIndex): void // once per native settle, also for non-animated scrolls
  renderPage(index: PageIndex): React.ReactNode
}
```

## 5. Open questions (evidence)

- What is the JS-thread cost of a synchronous chunk `ensure` (3 scans + checklist) on a OnePlus 6
  with a dense, realistic store? This decides whether `ensure` may run inline in the crossing
  handler or must be deferred and accept `loading`.
- What is the cost of building one week's `PagePresentation` with dense overlaps? This decides
  whether eager per-page builds fit within a crossing.
- Do Fabric `useSyncExternalStore` updates during an active native horizontal scroll cause any
  visible hitch (shared with R02/R03)?

## Recommendations for design

1. Adopt civil `EpochDay` page identity with a bounded ±5-year domain and content-addressed
   `PageKey`. Re-base only on mode change or an out-of-domain target. Drop `generation` from data,
   pager keys and focus gating.
2. Replace both `useCalendarEventsSnapshot` mounts and the per-range `useLiveQuery` hooks with one
   screen-scoped `CalendarWindowStore`. It should use 28-day firstWeekday-aligned chunks, a
   ±1-chunk prefetch, sequence-guarded per-chunk writes, keep-previous on invalidation, and a
   single DB listener with batched re-reads.
3. Make `PageStatus` explicit. `loading` is never rendered or announced as empty. Delete the
   retain-and-reproject hook.
4. Move tiles, overlap, labels, header parts and a11y order into a frozen, LRU-bounded
   `PagePresentation`. Keep only the zoom-dependent conflict plan in the stable page component.
   Build once, with checklist UIDs taken from rows.
5. Replace the transition reducer with `selectedDay` + `onSettle(index)` + imperative
   `scrollToIndex`. Delete `week-transition.ts`'s request/settle/cancel/replace and generation.
6. Fix the unbounded diagnostics set. Add a 500-crossing heap soak to the acceptance evidence.

## Questions for the owner

1. **Domain size.** Is a ±5-year bounded domain (re-based on out-of-range Today or deep links)
   acceptable as the meaning of §6.1's "dates years away remain navigable"?
2. **Loading presentation.** If a page is ever visible before its chunk is read, should it show
   the bare grid (busy, never announced as empty), or a subtle visual affordance? §11 forbids a
   "date-change loader", and §13 forbids an "unexplained blank".
3. **Agenda on the same store.** May the agenda read from the shared chunk store (one read path)
   rather than its own 7-day snapshot? This changes `calendar.md`/`storage.md` rules on the
   per-range live query and needs a changelog entry.
