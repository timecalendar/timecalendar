# Calendar

The Phase-04 calendar surface. Entries below are R-1 pointers plus the caveats
tooling can't carry; the load-bearing decisions are **ADR
[019](./decisions/019-calendar-rendering-adopt-calendar-kit.md)** (adopt
`@howljs/calendar-kit` v2 behind a seam, salvage the overlap/time-grid primitives)
and **ADR [020](./decisions/020-calendar-kit-seam.md)** (the seam form). The **day/week
timeline** (item 1, first half) and the **agenda/planning view** (the "Agenda / planning
view" section — `add-mobile-calendar-agenda`) have both landed; calendar sync is the
remaining scoped follow-up that builds on the unchanged events-source seam.

## The renderer dependency — `@howljs/calendar-kit` v2, pure-JS

- `@howljs/calendar-kit` (`~2.5.6`, `npx expo install`-pinned) is the day/week timeline
  renderer (ADR 019 — the Phase-04 spike's adopt decision). It is **pure-JS**: it
  autolinks **nothing**, adds **no `app.config.ts` plugin**, and **does not bump the EAS
  fingerprint** — it rides the OTA lane (its native footprint is inherited entirely from
  the already-present Reanimated/gesture-handler). Its `luxon` / `rrule` / `lodash.*`
  transitives enter the lockfile.
- It requires a **`GestureHandlerRootView` ancestor** (verified in the spike). Mounted as
  the **outermost** wrapper in `src/app/_layout.tsx` (`style={{ flex: 1 }}`, from
  `react-native-gesture-handler`, already a dep). This is **app infrastructure**, not a
  calendar-kit import — it is the standard RN gesture root and benefits any future gesture
  surface, so it is NOT behind the calendar seam (D5).

## The chrome-wrapper seam + lint ban — ADR 020

- `src/components/chrome/calendar-kit.tsx` is the **single import site** for
  `@howljs/calendar-kit`. Feature/screen/route code imports `@/components/chrome`, never
  the library — **lint-enforced**: `mobile/eslint.config.js` `chromeAlphaImportPatterns`
  bans `@howljs/calendar-kit` (+ subpaths) everywhere except `src/components/chrome/**`
  (re-set off for the `timecalendar/chrome-seams` block, mirroring `@expo/ui`).
- **The ban's justification is swap-reversibility, NOT alpha churn** (the load-bearing
  nuance vs. ADR 010): calendar-kit is a stable dep, but it is the #1-risk surface on a
  single maintainer, so the lint-enforced single import site is what makes "fork or swap
  to custom behind the unchanged wrapper" cheap (ADR 019's revisit anticipates exactly
  this). The constant is named `chromeAlphaImportPatterns` but the list is really "imports
  reachable only through a chrome wrapper" — its doc comment says so; a rename is ADR
  020's revisit trigger (out-of-scope line churn here).
- The wrapper stays **thin** (R-2): it re-exports `CalendarContainer` / `CalendarHeader` /
  `CalendarBody` + the `EventItem` type, and owns `buildCalendarTheme(@/theme tokens)` —
  the token → calendar-kit `theme` mapping so the grid/header/now-indicator can't drift
  from the brand palette (the now-indicator rides `primary`). No higher-level composed
  calendar from a sample of one consumer; that is earned by the agenda/home ships.

## The salvaged primitives — pure, owned, 90%-gated, the fallback insurance

Owned **regardless of the renderer** (ADR 019's salvage mandate), under
`src/features/calendar/data/`, pure (no React, no calendar-kit, no `@/db`, no `t()`):

- **`overlap-layout.ts` — `layoutOverlaps<T extends Interval>`** ports the spike-validated
  unbounded-column packing (5-way cluster → 5 even columns; A/B/C → exact thirds; freed
  columns reused; chronological stable sort; fractional `startX`/`endX`).
- **`time-grid.ts`** — the Flutter-parity grid constants as named exports
  (`GRID_START_MINUTE = 7*60`, `GRID_END_MINUTE = 21*60`, `DEFAULT_PIXELS_PER_HOUR = 60`,
  `HOURS_COLUMN_WIDTH = 50`, `MIN_TILE_WIDTH = 20`) + the pure math (`minuteToPixel`,
  `eventHeight`, `hourLabels`, `nowIndicatorPosition`).
- These are the **de-risking insurance**: the day/week screen renders through calendar-kit
  (its own internal layout). The agenda used `groupEventsByDay` (not the overlap engine); the
  **home today mini-timeline** (`src/features/home/ui/today-timeline.tsx`, Phase-04 item 4 /
  ADR [022](./decisions/022-home-ia-today-view.md)) is now the **FIRST RENDERING CONSUMER of
  `layoutOverlaps` + `time-grid`** — the salvage payoff ADR 019 named. It is an absolute-positioned
  grid (NOT calendar-kit) placing the displayed day's events via `layoutOverlaps` +
  `minuteToPixel`/`eventHeight` at a **70px/hour** zoom (passed as the existing `pixelsPerHour`
  parameter — the Flutter home zoom is a home concern, NOT a new grid constant; `DEFAULT_PIXELS_PER_HOUR
  = 60` stays the day/week default), with a dynamic hour window from the home `dynamicHourRange`
  selector and a brand-`primary` now-indicator via `nowIndicatorPosition`. Their first **tested**
  consumer remains the spike suite. If calendar-kit is ever dropped (ADR 019 revisit), these + a
  Reanimated grid become the renderer behind the unchanged wrapper. Under the
  `src/features/*/!(ui)/**` 90% glob.

## The domain `CalendarEvent` + the events-source seam

- **`data/types.ts` `CalendarEvent`** exposes `Date` timestamps + a `#RRGGBB` color and is
  **designed against the sync model** — the sync-model fields
  (`allDay`/`teachers`/`tags`/`canceled`/`userCalendarId`) mirror the Flutter
  `calendar_event.toDbMap()` so the sync ship's `calendar_events` table maps onto it with the
  ADR-011/018/021 importer-fidelity posture, **without a shape change** to any consumer. **Now
  persisted** (the sync ship landed — see storage.md "Calendar events store").
- **`data/events.ts` `useCalendarEvents(range): CalendarEvent[]`** is the **single
  events-source seam** — the screen must not know where events come from. **Calendar sync
  LANDED the source swap** (`add-mobile-calendar-sync`, ADR 021): it now reads the synced
  `calendar_events` rows reactively (`useSyncedEvents()` over `useLiveQuery`, row→domain
  mapped) merged with the existing **personal-events read** (`usePersonalEvents()` mapped
  `PersonalEvent → CalendarEvent`), then range-filters the combined set **once** here — same
  signature, same `CalendarEvent` shape, **no consumer change** (the seam absorbed the swap,
  exactly as designed — the swap was this one file). The
  **dense-week fixture is no longer in the default runtime merge** — `denseWeekFixture` stays
  exported from `data/index.ts` **dev/test-only** (the primitive/screen tests + optional
  `__DEV__` seeding; it is the overlap-engine's worst-case test anchor).
- **Hidden-events filter (Phase 05 Ship A — `add-mobile-hidden-events`, ADR 023):** the seam
  was designed to absorb exactly this. `useCalendarEvents` now also reads the hidden set
  (`useHiddenEvents()` from `@/features/hidden-events/data` — a `data → data` cross-feature read,
  the legitimate edge the sync orchestrator + home selectors already use) and **excludes** any
  merged event whose `id` (uid) is in `uidHiddenEvents` OR whose `title` is in `namedHiddenEvents`,
  applied to the **merged** synced+personal list (Flutter `EventsForViewNotifier` parity — a hidden
  *name* also matches a same-titled personal event) **before** the range filter. **No consumer
  change** — same signature, same `CalendarEvent` shape; day/week, agenda, AND home all honor
  hiding. See "Hidden events" below + storage.md "Hidden events store".
- **Calendar-visibility filter (Phase 07 — `add-mobile-user-calendars`, ADR
  [031](./decisions/031-user-calendar-visibility-filter-at-seam.md)):** the same seam ALSO reads
  `useUserCalendars()` (the same legitimate `data → data` edge) and keeps a merged event iff it is
  **personal** (`userCalendarId === undefined`, always shown) OR its `userCalendarId` is in the set of
  currently **visible** calendars — one more `useMemo` clause of the identical shape, on the merged
  list, before the range filter. `visible` is thus a **render-only** flag (not a sync gate, not a
  notification gate). Its load-bearing consequence: a **deleted** calendar drops out of
  `useUserCalendars()`, so its events vanish immediately with **no `calendar_events` purge** — the
  `user_calendars` table is the single source of truth for "what shows" (ADR 031). See "User calendars"
  in features.md.

## The timeline screen — a brand surface (R-3)

- `src/features/calendar/ui/calendar-screen.tsx` (presentational, 70% floor): holds the view
  (day | week) + visible date, computes the range, reads through the sibling `data` sub-barrel
  (B-2), maps `CalendarEvent[] → EventItem[]`, and renders through `@/components/chrome`
  (`CalendarContainer` + `CalendarHeader` + `CalendarBody` with `showNowIndicator` +
  `renderEvent`). The `theme` is built from `@/theme` tokens (now-indicator → brand
  `primary`); `start`/`end` from the 7:00–21:00 time-grid constants; `numberOfDays` = 1 (day)
  / 5 (week, weekends-off default, Flutter parity). **No event-write path** — the only write
  it triggers is the sync orchestrator's `sync()` (pull-to-refresh / retry — see "Calendar
  sync"), staying presentational (it calls the `data/` hook, holds no fetch logic).
- **a11y:** the title is a `ThemedText type="title"` heading; the day/week switch is two
  `accessibilityRole="tab"` controls with translated labels + `accessibilityState.selected` +
  ≥44pt targets; each event tile is an accessible element with a translated label (title +
  time + location); the empty-range state uses a polite live region. Below `MIN_TILE_WIDTH`
  the tile text is hidden (the column is too narrow). The grid tile draws the title as
  `ThemedText type="caption"` (12px/600) over the location as `type="captionSmall"` (11px/400)
  so the two read as a hierarchy. The title carries a **5-line `numberOfLines` cap** — NOT a
  truncation taste but a required iOS fix: an *uncapped* `Text` sets the Fabric line-break
  **container** to `NSLineBreakByClipping` (`RCTTextLayoutManager.mm`) while the paragraph stays
  word-wrapping, so a long *trailing* word is clipped mid-glyph at the right edge and a phantom
  empty line is reserved above the location. Any `numberOfLines > 0` flips iOS onto the
  tail-truncation path (wrap + char-break every line, ellipsise only the last); `ellipsizeMode="clip"`
  must NOT be used — it re-selects the clipping mode. The tile's `overflow:"hidden"` is the
  short-tile backstop so the trailing "…" stays hidden there (Apple/Google week-tile model).
- **Nav-bar actions (backlog Issue 3 — device complaint: the hand-drawn Today/Add glyphs read as
  one glued icon and weren't platform-standard):** Today + Add render as real **SF Symbols on iOS**
  through the app's `expo-symbols` seam (`SymbolView`) — Today = `calendar`, Add = `plus` (Apple's
  bare nav-bar add glyph; `plus.circle` is the inline/list-row idiom, not this one). **No new
  dependency, no ADR** — `expo-symbols` is a plain import already used in three features
  (`school-selection/status-symbol`, `school-selection/school-row`, `calendar-sources/user-calendars`);
  the backlog's "no icon font is wired" diagnosis is **stale** (it predates the expo-symbols adoption).
  **Android uses expo-symbols' Material `today` glyph** through the object-form name mapping because
  `SymbolView` renders blank for a bare string SF name there. Load-bearing rules prose must carry (lint/types can't):
  **(1)** each action is a **44pt (iOS) / 48dp (Android)** target (HIG / Material 3 minimums) with
  **no `hitSlop`** — the frame *is* the target; hitSlop on adjacent bar items overlaps across the
  `gap: Spacing.two` (8px) and steals mis-aimed taps toward the frontmost sibling. The accessible
  name is the translated action (`calendar.todayLabel` / `calendar.addLabel`), never the glyph. On
  Android the create action stays a FAB and Today is the compact header glyph. The Android view
  selector is a 48dp pill backed by `MenuView`, not the universal `Picker`: the latter renders a
  full-width Material text field and crowds out the centered month title. **`calendar`-as-"today"
  legibility is device-verify** (no SF Symbol encodes
  "today" — the full `calendar.*` union is static/day-numberless; `calendar` is the most defensible
  generic, the accessible name carries the true meaning for VoiceOver).
- **All-day events (backlog Issue 2 — a rendering projection keyed on `allDay`, NOT a stored
  timestamp change — ADR 021/D1):** `mapToEventItem` branches on `CalendarEvent.allDay` and maps an
  all-day event to calendar-kit's **date-only** `start:{date}/end:{date}` shape so the library lanes
  it in the **all-day row** above the timed grid (a timed `dateTime` block spanning 24h straddles
  local midnight and paints two day columns — the bug). Two contracts the **installed** calendar-kit
  source pins (`utils/eventUtils.js` `getEventTimes`/`filterEvents`), both load-bearing and prose-only
  (lint/types can't carry them): **(1)** the all-day `end.date` is **inclusive** (`.endOf('day')`) but
  our `endsAt` is the **exclusive** end (ICS), so the last covered day is **`endsAt − 1ms`** (off-by-one,
  else it still spans two days); **(2)** the day is read off **UTC** (`data/day-key.ts` `utcDayKey`, not
  `localDayKey`) — an all-day date is **floating** (May 25 everywhere), so local keying would shift it a
  day for a UTC-negative viewer. The all-day lane renders a **custom brand `AllDayTile`** through
  `<CalendarHeader renderEvent>` (the `PackedAllDayEvent` renderer, distinct from `CalendarBody`'s timed
  `renderEvent`): a **single title line** (the Apple/Google all-day-chip idiom — the lane is ~1 event-row
  tall; location lives in the a11y label + the details screen). **The tile must NOT use `flex`** —
  calendar-kit's event content is an `absoluteFillObject` sized by a **Reanimated animated height**, so a
  `flex:1` child resolves against a height Yoga reads as auto → collapses to a ~1-2px bar with no text
  (device-caught); flowing text with no flex renders like the library's own default all-day tile. The
  a11y label reuses `calendar.event.label` with `calendar.allDay` ("All day"/"Toute la journée") in the
  `{{time}}` slot. The **agenda tile** and the **details `formatEventDateRange`** likewise drop the time
  for an all-day event (`data/format.ts` gained an `allDay` branch — one full date, or a `date – date`
  range for a multi-day all-day event, formatted off a **UTC-day proxy** so `date-fns` prints the floating
  day). `EventDetails` + both `event-details.ts` mappers thread `allDay`. **`AllDayTile` announces on the
  real `allDay` flag, not the lane:** calendar-kit also lanes any *timed* event with `duration ≥ 24h` into
  this row (`eventUtils.js:63`), so a genuine multi-day timed event reaches the tile too — it shows its real
  `formatTimeRange`, never a false "all day" (the timed block still can't paint in this row — inherent
  library laning — but the label stays honest). The mapping also clamps the inclusive end to
  `max(startsAt, endsAt − 1ms)` so a degenerate zero-duration all-day event doesn't invert its span and
  get dropped by the lib's `isValidEventRange`. The suite mock replicates the `duration ≥ 24h` laning rule
  so both branches are provable off-device.
- **Scroll-perf: two visible-window signals, not one (backlog Issues 5 + 6).** calendar-kit fires two
  date callbacks (`src/hooks/useSyncedList.tsx`): **`onChange`** on every visible-column change *during*
  a scroll (immediate), and **`onDateChanged`** only once the scroll **settles** (150ms-debounced). The
  screen keeps two states off them: **`windowStart`** ← `onDateChanged` (the settled anchor — seeds the
  grid feed + the agenda's exact window + the mount position) and **`visibleDate`** ← `onChange` (the
  month-year **title** only). **Issue 6** (title lagged seconds behind the scroll) was the title riding
  `onDateChanged`; it now rides `visibleDate`, so it tracks the visible page promptly. Frequent
  `visibleDate` updates are cheap: the inline `onChange`/`onDateChanged` arrows are wrapped in the lib's
  `useLatestCallback` (`context/ActionsProvider.tsx:20`), so new arrow identities never re-pack the grid,
  and the grid feed (below) is memoized independently of `visibleDate`. **Issue 5** (events lagged on a
  fast multi-week fling) was a **starved buffer**: the old feed range-filtered to `windowStart −7d…+14d`
  (~3wk) — **narrower** than calendar-kit's own internal pack window (`pagesPerSide=2` default
  `CalendarContainer.tsx:116` × `defaultOffset=7` `EventsProvider.tsx` ≈ −2wk/+3wk) — **and** shifted only
  at settle, so the lib's buffer pages had no events fed to them until the fling stopped. The grid now
  feeds a **quarter-quantized window** (`data/event-window.ts` — `quarterStartMs` + `quarterWindow`):
  `useMemo(() => quarterWindow(bucketMs), [bucketMs])` keyed on the quarter's start-ms, so the feed is
  **referentially stable while scrolling within a quarter** (no per-settle refilter/remap, no lib
  `useEffect([events])` re-pack — `EventsProvider.tsx`), the lib windows it to the visible page
  internally, and a **±2-month buffer** (7-month span, `BUFFER_MONTHS` — coupled to `pagesPerSide`, see the
  fast-fling bullet below) keeps the boundary page fed across a quarter cross. This **bounds the prop to ~a quarter of events (it scales)** instead of the whole synced table,
  and stays a JS **projection width** (the read is the coalesced whole-table reactive read — ADR 021
  `harden-mobile-db-seam`), **not** a SQL scope, so the documented O(N²) re-read storm cannot recur. The
  **agenda** keeps its own tight exact-week range (no calendar-kit windowing). The suite mock models three
  triggers (`grid-date-change` = a settled scroll firing onChange then onDateChanged; `grid-visible-change`
  = a mid-scroll onChange only; `grid-cross-quarter` = a settled scroll to a different quarter, proving the
  `onDateChanged → windowStart → bucketMs → gridRange` wiring shifts the feed) so the behavior is provable
  off-device.
- **Fast-fling paint: the events-store anchor is patched to track the scroll live (backlog Issue 5;
  ADR [032](./decisions/032-calendar-kit-vendor-patch-live-anchor.md)).** calendar-kit paints events ONLY
  from an internal store (`context/EventsProvider.tsx`) packed over `anchor ± (defaultOffset=7 ·
  pagesPerSide)` days; mid-fling the list *mounts* upcoming pages (grid lines slide in) but each page reads
  `regularEvents[day]` from that store — beyond the packed radius a page is **mounted-but-eventless**.
  Unpatched, the anchor advances only ~300ms after the scroll FULLY stops: a Reanimated offset reaction
  (`service/CalendarList/index.tsx`) fires `onVisibleColumnChanged` on **every scroll frame**, and each call
  resets the 150ms settle debounce in `hooks/useSyncedList.tsx` (a second trailing 150ms debounce sits in
  `context/VisibleDateProvider.tsx`) — so a sustained fast scroll freezes the anchor at its starting week
  and blanks every page past the radius, however large the radius (`pagesPerSide` only moves the cliff; no
  prop or handle reaches the mechanism — `CalendarKitHandle.setVisibleDate` writes refs, not the store).
  **`patches/@howljs+calendar-kit+2.5.6.patch`** (patch-package, applied on `postinstall`; patches the lib's
  `src/`, which is what Metro runs — the package's `react-native: src/index` field) fixes the mechanism:
  (1) `useSyncedList` advances the store anchor (`notifyDateChanged`) on every visible-COLUMN change, with a
  separate `lastDateChangedUnix` ref preserving the settled `onDateChanged` semantics exactly (the app-visible
  callback contract is unchanged); (2) `VisibleDateProvider`'s trailing debounce becomes a **leading+trailing
  150ms throttle**, so the store re-packs at most every 150ms DURING a fling instead of never.
  `pagesPerSide={GRID_PAGES_PER_SIDE}` (4) stays as runway — ±4-5wk of packed radius covers scroll travel
  within a re-pack tick — and `BUFFER_MONTHS` (event-window.ts, 2) is coupled: the fed prop must exceed
  anchor travel + pack reach past the quarter edge. Cost bound: ≤1 full re-pack per 150ms during a fling,
  each re-rendering every mounted page (the lib's store selectors pass no `isEqual`) — the dense-calendar
  device pass owns that bar (`inbox/2026-06-16-calendar-low-end-android-perf.md`). The quarter feed (above)
  stays load-bearing for prop identity; the Jest suite mocks the lib, so the patch is device/panel-proven,
  not unit-proven.
- A thin route `src/app/(tabs)/calendar.tsx` re-exports the screen through the `ui/`
  sub-barrel (route-structure rule). It is the **Calendar tab** — the middle of the
  three-tab bar (Home · Calendar · Profile, Flutter parity — ADR [025](./decisions/025-calendar-tab-three-tab-ia.md)),
  declared as a `NativeTabs.Trigger name="calendar"` in `app-tabs.tsx`. The route lives
  in the `(tabs)` group, but the URL path is still `/calendar` (groups don't affect the
  path), so `timecalendar-dev://calendar` + the Maestro flow keep working and now also
  select the tab.

## Agenda / planning view

The **third in-place view mode** (day → week → **agenda**), grown in
`src/features/calendar/` on the salvaged primitives + the **unchanged** events-source seam
(the timeline ship deliberately split this out — calendar-kit has no agenda view, so this is
the custom "easy half" ADR 019 anticipated). A **day-grouped list, not a timeline grid** — it
does **not** use calendar-kit (**no new ADR** — D5; the load-bearing call is ADR 019's). The
two real choices (`SectionList`-over-FlashList, `date-fns` display-only) are `design.md`
decisions, not ADR-worthy.

- **`data/agenda.ts` `groupEventsByDay(events): AgendaDay[]`** — the agenda analog of
  `layoutOverlaps`, pure (no React/calendar-kit/`@/db`/`t()`/`date-fns`), **90%-gated**. Sorts
  by `startsAt` (stable `localeCompare` tie-break), buckets by **local** calendar day (local
  Y-M-D, mirroring Flutter `isSameDate` — **not** UTC, so a 23:30-local event lands on its own
  day), ascending. **Deliberate divergence from the Flutter `events_for_planning_view_helper`
  `endsAt`-carry quirk** — we group by each event's own `startsAt` local day (the correct
  grouping); recorded so it is not "fixed" back.
- **`data/format.ts`** — the locale-aware **display-only** date/time formatter over `date-fns`
  (+ `date-fns-tz`), **roadmap item 6 pulled early** (the first real date-formatting need),
  pure + **90%-gated**: `formatDayHeaderParts(day, locale)` (uppercased short weekday + day
  number — Flutter `fullDayToShortDay`) and `formatTimeRange(start, end, locale)`
  (`"HH:mm – HH:mm"`, 24-hour, French-first). Locale comes from the app i18n locale
  (`i18next.language` → `AppLocale`); **a new app locale needs a `date-fns/locale` entry in the
  helper's `LOCALES` map.** Display only — no parsing, no rrule/Temporal/recurrence.
- **`date-fns` + `date-fns-tz` are pure-JS** (`npx expo install`-pinned: `date-fns` v4,
  `date-fns-tz` v3) — autolink nothing, add no `app.config.ts` plugin, **do not bump the EAS
  fingerprint** (ride the OTA lane), work under Jest unchanged. **Not** a chrome-seam / banned
  import — a plain utility, unlike calendar-kit (no swappable rendering surface to localize).
- **`ui/agenda-list.tsx`** (presentational, 70% floor) — a React Native core **`SectionList`**
  (**zero new dep** — D4) of day sections (`renderSectionHeader` = the day header with a
  heading role; `renderItem` = an event tile). Themed from `@/theme` tokens (R-3): a `Radii.large`
  (~15px) radius, a subtle shadow (offset (0,3), 6% black, blur 15 — Flutter planning-tile
  parity), the `#RRGGBB` event color as the tile's **left accent border**, the **now/upcoming
  indicator** a brand-`primary` accent column on the next-upcoming event (the first ending after
  the mount-time clock, read once via `useState(() => Date.now())` so render stays pure).
  **Read-only** — the tile is **not** a touchable (`accessibilityRole="text"`, no `onPress`; the
  tap target lands with event details, a later item — so it is not a dead touchable).
- **`SectionList` over FlashList — recorded revisit trigger:** the data is bounded this ship
  (fixture + personal events over the visible week — a few dozen tiles), so virtualization buys
  nothing and FlashList v2 would be a **fingerprint-bumping native dep** for no gain (R-2). **When
  calendar sync widens the range** to hundreds–thousands of events over a long horizon and
  `SectionList` janks on a low-end device, swap FlashList v2 behind the **unchanged `AgendaList`**
  (the list engine is an internal detail of one file) — owned by the sync ship's perf pass.
- The screen (`ui/calendar-screen.tsx`) widens `view` to `"day" | "week" | "agenda"`, adds a
  third accessible `tab` to the existing `tablist`, and in the agenda branch computes a **bounded
  multi-day window** (the visible week, `AGENDA_DAYS = 7`), reads the **unchanged**
  `useCalendarEvents(range)`, resolves the locale from `i18next.language`, and renders
  `<AgendaList>` instead of the calendar-kit grid. The day/week branches + range logic are
  unchanged. The empty-range polite-live-region state covers the agenda too.
- **i18n/a11y:** new flat keys (`calendar.view.agenda`/`…agendaLabel`,
  `calendar.agenda.event.label`, `calendar.agenda.nowLabel`); the day-header + time strings come
  from the **formatter (locale data), not catalog keys** (D3). Day headers carry a heading role,
  tiles a translated label (title + time + location), the now-indicator a translated status label.
- **Observability ➖ N/A** (read-only — D6; same as the day/week timeline). **CI proves** the
  `groupEventsByDay` + the formatter at 90% and the screen's events→sections→tiles wiring
  (a plain `SectionList`, **no calendar-kit mock needed**); the dense visual correctness + frame
  rate stay the calendar surface's existing on-device pass
  (`inbox/2026-06-16-calendar-visual-brand-review.md`, extended to name the agenda — no new note).

## Calendar sync — the source swap, durable cache, triggers (ADR 021)

Calendar sync **landed** (`add-mobile-calendar-sync`, Phase-04 item 3): the events the
calendar renders now come from `POST /calendars/sync { tokens }` over the durable
`user_calendars` tokens, persisted into the third Drizzle table `calendar_events`
(schema + the full `data/sync/` layer + the transactional drop+replace live in
storage.md "Calendar events store"; the storage/sync decisions are **ADR
[021](./decisions/021-calendar-event-storage-and-sync.md)**).

- **The source swap** is invisible to consumers — `useCalendarEvents(range)` now sources
  `useSyncedEvents()` (reactive `useLiveQuery` over `calendar_events`, row→domain mapped)
  merged with the personal-events read and range-filtered once here; the timeline + agenda
  screens are **unchanged** for the swap (only the pull-to-refresh wiring is new). The fixture
  is dev/test-only now.
- **Sync triggers (design D5):** a fire-and-forget **startup sync** (`useStartupSync()`, a
  once-effect mounted in `_layout.tsx` inside the query provider — it goes through the feature
  `data/` hook, never `@/db` directly, B-3/B-4; silent on failure — an offline launch shows the
  last-good rows), and **pull-to-refresh** on the calendar screen (a `RefreshControl` on the
  agenda `SectionList`, brand-tinted from `@/theme` `primary`, calling `sync()`). The grid view
  (calendar-kit's own Reanimated scroller) is not wrapped for pull-to-refresh — the accessible
  **sync-error + retry** banner (a polite live region + `accessibilityRole="alert"` + a labeled
  retry control) shows across **all** views, so a failed sync is recoverable from any view.
- **Offline-safe by construction:** the drop+replace runs only after a successful fetch, so a
  failed fetch leaves the last-good rows; the durable `calendar_events` reads offline.

## Event details (unified, both kinds; now interactive — the edit half landed)

The view reached by **tapping an event** (`add-mobile-event-details`, Phase-04 item 3; widened by
`add-mobile-event-checklists`, Phase-05 Ship B). It is the **first consumer of ADR 021's verbatim
row** — the rich data the lossy rendering `CalendarEvent` deliberately drops lives in the row, and
this read consumes it. **Phase-04 shipped the read-only VIEW half (synced-only); Phase-05 Ship B
landed the EDIT half** — the interactive checklist (ADR 024) — and **unified the screen for BOTH
event kinds** (synced *and* personal), the surfacing decision **ADR
[024](./decisions/024-event-checklist-storage-and-surfacing.md) / decision 4** (Flutter parity —
both `EventInterface` open the same screen with a checklist). The hide/delete sibling
(`add-mobile-hidden-events`, Ship A) added the synced-only hide/un-hide header action.

- **The unified rich read — `data/event-details.ts`** (90%-gated): a pure **`rowToEventDetails(row):
  EventDetails`** mapper (synced — `kind: "synced"`) — the rich counterpart to the lossy
  `rowToCalendarEvent` — that keeps the fields the rendering projection drops (`groupColor`, the real
  `type` enum, `exportedAt`, the **full** `tags: {name,color,icon}[]` — not name-only), decoding the
  JSON columns **defensively** by **reusing the sync mapper's `decodeJsonArray`/`decodeFields`** (now
  exported from `data/sync/types.ts` — corrupt/legacy → `[]`/`null`/`false`, never throws; ADR
  021/D2). `type` narrows to `EventTypeEnum` with a safe `class` fallback for an unknown verbatim
  value (importer fidelity). **Plus `personalRowToEventDetails(row)` (`kind: "personal"`)** — a
  personal_events row → the same `EventDetails` shape with the sync-only fields at safe defaults
  (`groupColor = color`, `class` type, empty tags/teachers, empty `userCalendarId`). The
  `EventDetails` type gained a **`kind` discriminator** (`"synced" | "personal"`) the screen keys the
  origin-specific header action on. **`getByUid(uid)`** resolves **either** table (calendar_events
  first, else personal_events) — the only `@/db` import site for this read (B-1; reuses `eq`, no new
  operator — R-2). The reactive **`useEventDetails(uid)`** runs **two `useLiveQuery`** reads (synced +
  personal), the synced row winning when present, `loading` clearing only once BOTH resolve (so a
  personal event isn't briefly shown not-found). The rich `EventDetails` is still **separate** from
  the rendering `CalendarEvent` (D3 — the grid/agenda don't need the rich fields).
- **The full date/time formatters — `data/format.ts`** (90%-gated): `formatEventDateRange(start,
  end, locale)` (the title block's full date + `HH:mm – HH:mm` range — Flutter `eventDateTimeText`,
  24-hour per R-3; same-day = one date + both times, cross-day = both full date-times) and
  `formatFullDateTime(date, locale)` (the footer's `exportedAt` full date+time — Flutter
  `fullDateTimeText`). Display-only over the existing `date-fns` + `LOCALES` map — **no new dep**.
  The home ship (Phase-04 item 4) added one more — `formatFullDay(day, locale)` (the today header's
  full localized date — Flutter `fullDayText`, date-fns `PPPP`). With it the date-fns seam covers
  calendar/agenda/details/home, **closing roadmap item 5 (date/time)** — relative-time + ICU remain
  the existing earned-when-needed i18n debt.
- **The details screen — `ui/event-details-screen.tsx`** (presentational, 70% floor): a designed
  brand surface themed from `@/theme` (R-3) — a `ScrollView` with the **title block** (a labeled
  color **swatch** with a translated `accessibilityLabel`, the title as `ThemedText type="title"` =
  heading role, the formatted full date/time), **tag bubbles** (each the tag `color` background +
  the tag `name`; **no icon** — no icon-font dep is wired in the app and R-3 forbids porting
  Flutter's FontAwesome; the glyph is a **recorded parity gap**, the bubble name+color is the
  parity-meaningful surface), **content lines** (a label + value for `location`, the **calendar
  name** when the user has 2+ calendars — resolved via `useUserCalendars()`, `teachers`
  newline-joined, `description` — each only when present), and the **"Updated …" footer**. An
  accessible **not-found state** (`{ event: null, loading: false }` — a stale deep link / a row
  dropped by a sync) renders a translated message in a polite live region — not a crash, not a
  blank (the read-only analog of the school read's `isError`). No icons → the line **label is its
  accessible affordance**.
- **The interactive checklist section (Ship B, the edit half — ADR 024)** is mounted on the screen
  for **BOTH kinds**, keyed on `event.id`: `<EventChecklist eventUid={event.id} />` from the new
  shared `@/features/event-checklists` feature (imported by full `@/` path — a legitimate
  cross-feature `ui→ui` edge; the screen never touches the checklist `@/db` seam, B-1). It is the
  first **write-capable** section on the previously read-only screen — see "Event checklists" in
  [features.md](./features.md) + the `checklist_items` store in [storage.md](./storage.md).
- **Origin-keyed header actions** (Flutter parity, like the body, keyed on `event.kind`): a **synced**
  event keeps the **hide / un-hide** action (Ship A — Masquer is EventKind.Calendar-only); a
  **personal** event gets an **Edit** action that pushes `/personal-event-form?uid=<uid>` (so the
  personal-event create/edit/delete flow stays fully reachable one tap into the unified surface — the
  relocate-don't-drop posture of ADR 022, **superseding ADR 022's** personal→form *tap*). The two are
  mutually exclusive by kind.
- **The tap-through** (ADR 024 / decision 4 — superseding Phase-04's split): the **agenda tile** is a
  `Pressable` (`accessibilityRole="button"` + a translated `…openLabel` + a ≥44pt target) calling a
  screen-provided `onPressEvent(event)`; the **calendar-kit grid** wires `onPressEvent` on
  **`CalendarContainer`** through the chrome seam (the ADR-020 ban holds). **`eventRoute(uid,
  userCalendarId)`** (`data/routes.ts`, the single tap discriminator the grid, agenda, and home all
  call) now returns **`/event-details/<uid>` for BOTH kinds** — a **one-helper flip** (the param is
  retained but no longer discriminates; the details screen resolves the kind from the uid). So a
  **personal event's tap now opens the unified details screen** (with its checklist + the Edit action),
  not the edit form directly. The `/personal-events` **list** row still links to the edit form directly
  (unchanged — that is the list surface, not the calendar tap).
- **The route — `src/app/event-details/[uid].tsx`**: a thin re-export of the feature `ui/` screen
  (route-structure rule), registered as a `<Stack.Screen name="event-details/[uid]">` sibling of
  `(tabs)` with `headerShown: true` (the default accessible back affordance; the screen sets its
  localized title via its own `<Stack.Screen options>`), deep-linkable
  (`timecalendar-dev://event-details/<uid>`).
- **Observability:** the details **read + the not-found** state are still ➖ N/A (a `getByUid` miss is
  a recoverable accessible not-found, a corrupt column degrades safely). The **checklist writes** the
  screen now hosts ARE ✅ wired — a failed checklist write records through `@/firebase`
  `recordError(error, "event-checklists/<action>")` + an accessible failure surface (irreplaceable
  data; the write lives in the `event-checklists` feature, not the screen).
- **CI vs. on-device:** CI proves the synced + personal mappers (rich-field survival, corrupt-JSON
  safe default, null↔undefined, unknown-type fallback, the personal safe-defaults) + the two
  formatters at 90%, the `getByUid` two-table query shape + the `useEventDetails` synced/personal/
  loading/not-found resolution against the mocked `@/db` seam, the screen's row→sections render
  (heading / formatted date / tags / lines / footer / not-found) for **both kinds** + the checklist
  mount + the origin-keyed header actions (hide for synced, Edit→form for personal) + the tap-through
  routing (a press fires `/event-details/<uid>` for both kinds) at the 70% floor. The **real populated
  render** needs a seeded synced event the dev harness lacks, so Maestro asserts **reachability** (a
  deep link to the details route shows the not-found state) and the populated render + the checklist
  add/toggle/reorder/delete round-trip are the on-device manual pass
  (`inbox/2026-06-16-event-details-on-device.md` + `inbox/2026-06-16-event-checklists-on-device.md`).
- **Revisit trigger (recorded, no ADR yet):** if a **second** rich-row consumer wants a *different*
  rich-projection shape, that is when an "event-details rich domain" ADR earns its place (D8).

## Hidden events — hide / un-hide synced events, filtered at the seam (ADR 023)

Hide a synced event by **this instance** (uid) or **by name** (all of the same title), persist the
hidden set durably, filter hidden events out of every view, un-hide from a reachable surface — full
Flutter `hidden_event` parity (Phase 05 Ship A, `add-mobile-hidden-events`). The hide/un-hide store
itself is a **new `src/features/hidden-events/` feature** backed by **MMKV** (not Drizzle — the data
is a single flat two-list blob; **ADR [023](./decisions/023-hidden-events-storage.md)**); the store
+ verified properties live in storage.md "Hidden events store" and features.md "Hidden events". The
calendar feature is the **first consumer**:

- **The filter** is at the single events-source seam (`useCalendarEvents`, above) — applied to the
  **merged** synced+personal list, so day/week + agenda + home all honor hiding with **no consumer
  change**. The seam reads `useHiddenEvents()` by full `@/features/hidden-events/data` path (the
  `data → data` cross-feature edge).
- **The hide ACTION grows the read-only event-details screen** (`ui/event-details-screen.tsx`) — a
  **header action offered ONLY for a synced event** (a non-empty `userCalendarId`; Flutter offers
  "Masquer" only for `EventKind.Calendar`). A not-currently-hidden event opens a **native-default
  `Alert`** (R-3 — no Material dialog port) with the two choices — **hide this event**
  (`hideByUid(event.id)`) and **hide all events of the same name** (`hideByName(event.title)`) — and
  pops back on success; a **currently-hidden** event (its uid or title is in the set — a deep link
  still resolves the row) offers **un-hide** instead (the details screen is never a one-way trap).
  The write goes through `useHideActions()` (the observability-wrapped seam); a failed write surfaces
  an accessible `alert` live region. **This LANDS the event-details "hide-event" deferral** the
  read-only ship recorded.
- **Un-hide is also reachable from a management screen** — `src/features/hidden-events/ui/hidden-events-screen.tsx`
  (a `/hidden-events` Stack sibling of `(tabs)` reached from a Profile link) — required because
  **hide-by-name has no per-event details surface**. It lists the name-hidden titles + the
  uid-hidden events that **still resolve** to a synced event (resolved via `useSyncedEvents()` —
  Flutter parity, a stale uid is not orphaned in the list), each with an un-hide control + an empty
  state. See features.md "Hidden events".
- **Observability (ADR 023 / D5):** a failed hidden-set **write** is a crash-worthy
  local-persistence failure (no server backup) → `@/firebase` `recordError(error,
  "hidden-events/<action>")` + an accessible failure surface; the filter **read** is
  total/infallible (corrupt/absent → empty set, the views render everything). **No new ADR beyond
  023, no dependency, no native/babel/schema change** — the filter, the synced-only gating, and the
  management screen are executions of existing patterns (ADRs 021/014 + the events-source seam
  design + the route-structure rule).

## Observability — split: read/sync-fetch ➖ N/A, local replace-transaction ✅ (ADR 021 / D6)

A **read-only render** and a **sync fetch failure** are **recoverable** — the last-good rows
render and the user can retry — so they are an `isError` UI state and are **NOT** `recordError`'d
(mirroring the school-selection read path). The deliberate exception: a failure of the local
**`replaceAll` transaction** (a SQLite write failure, not a network failure) IS a crash-worthy
local-persistence failure and is recorded through `@/firebase`
`recordError(error, "calendar/sync")` — the only place the calendar feature touches the firebase
seam. The orchestrator distinguishes the two by where the chain throws (a mutation rejection →
`isError` only; a `replaceAll` throw → `recordError` + `isError`).

## What CI proves vs. what's on-device

- **CI proves OUR wiring** (D7): the salvaged primitives + the events-source seam are
  unit-tested at 90% (pure / a mocked `usePersonalEvents`); the screen test renders through
  real theme + i18n with the **calendar-kit grid mocked suite-wide**
  (`jest/setup-calendar-kit.ts` — the mocked `CalendarBody` invokes `renderEvent` per event)
  so the event→tile wiring + the `CalendarEvent`→`EventItem` mapping + theme/label plumbing
  are provable without the Reanimated grid. Same posture as the `@expo/ui` picker (CI proves
  wiring, not the native control).
- **The sync layer** (`data/sync/**`) is unit-tested at 90% — mappers (`dtoToRow`
  **verbatim survival** of groupColor/type/rich-tags/rich-fields + canonical-UTC + null
  handling; `rowToCalendarEvent` round-trip + **corrupt-JSON → safe default** + the lossy
  rendering projection), the repository query shape + the **transactional drop+replace**
  (delete-then-insert inside one `transaction`, chunked, taking rows), the **sync wiring at
  the `customFetch` seam** (success writing **verbatim rows**, no-tokens no-op, fetch-failure
  → `isError` no-record, replace-failure → `recordError`), the reactive hook + the startup
  trigger, and a **restart-simulation** (a fresh repository module reads back a prior
  `replaceAll` through a
  stateful Map-backed `@/db` fake). See storage.md.
- **On-device (manual, inboxed) — CI cannot drive the Reanimated grid, measure on hardware,
  prove on-disk SQLite survival, or drive a real sync:** the dense-overlap visual correctness +
  the **low-end-Android frame-rate bar + Reassure baselines on REAL synced data** (ADR 019's
  exit-criterion gate, real hardware — `inbox/2026-06-16-calendar-low-end-android-perf.md`,
  scoped to dense synced timetables), the **brand visual review**
  (`inbox/2026-06-16-calendar-visual-brand-review.md`), and the **sync on-device proofs** —
  real synced render, offline-after-sync, drop+replace atomicity after a mid-sync kill,
  Crashlytics arrival for a forced `replaceAll` failure (`inbox/2026-06-16-calendar-sync-on-device.md`).
- **Maestro** (`.maestro/calendar.yaml`) deep-links `timecalendar-dev://calendar` and asserts
  the screen renders + reachability. The real synced render isn't Maestro-driven (the dev
  harness seeds no `user_calendars` token + synced events reachable by deep link — recorded in
  the inbox note; no new server-seeding work this ship). Not the dense-overlap packing or frame
  rate.

## Deferred (recorded debt — not built this ship)

- **The agenda/planning list view** — **LANDED** (`add-mobile-calendar-agenda`; see the
  "Agenda / planning view" section above). The `SectionList`→FlashList swap when sync widens the
  range is now **reachable on real synced data** — the live trigger is the sync ship's on-device
  perf pass (`inbox/2026-06-16-calendar-low-end-android-perf.md`); no code change unless it janks.
- **Calendar sync** — **LANDED** (`add-mobile-calendar-sync`, ADR 021; see "Calendar sync"
  above + storage.md "Calendar events store"). `POST /calendars/sync` → the durable
  `calendar_events` table; the `useCalendarEvents` source swapped behind the unchanged seam.
- **Event details** — **LANDED + widened.** The read-only VIEW half landed in
  `add-mobile-event-details` (Phase-04 item 3); the **EDIT half + the unified-both-kinds surface
  LANDED** in `add-mobile-event-checklists` (Phase-05 Ship B / ADR 024 — see "Event details
  (unified…)" above). The agenda/timeline tap target the agenda ship forward-referenced is wired,
  and a personal event's tap now opens the unified details screen too.
- **The hide-event / hidden-events feature** — **LANDED** (`add-mobile-hidden-events`, Phase 05
  Ship A / ADR [023](./decisions/023-hidden-events-storage.md); see "Hidden events" above +
  storage.md / features.md). It writes the hidden state (the MMKV hidden-set store) and filters the
  events-source seam, with the hide action on the event-details screen + a management screen.
- **The checklist sibling feature** — **LANDED** (`add-mobile-event-checklists`, Phase 05 Ship B /
  ADR [024](./decisions/024-event-checklist-storage-and-surfacing.md); see "Event details (unified…)"
  above + the `checklist_items` store in storage.md + "Event checklists" in features.md). The 4th
  Drizzle table (`checklist_items`, importer-fidelity verbatim, hard-delete-not-soft) + the
  interactive checklist on the unified details screen for both event kinds.
- **The home today mini-grid** — **LANDED** (`add-mobile-home`, Phase-04 item 4 / ADR
  [022](./decisions/022-home-ia-today-view.md); see features.md "Home / today view"). It is the
  salvaged overlap engine's **first rendering consumer** (`src/features/home/ui/today-timeline.tsx`),
  and the Home tab is now the today view (the standalone personal-events list relocated to
  `/personal-events`). **Roadmap item 5 (date/time) closed** with the `formatFullDay` helper.
- **Cancelled-event visual treatment** — the `canceled` flag is decoded into the domain
  (`CalendarEvent.canceled` + the rich `EventDetails.canceled`, both derived defensively from
  `fields.canceled`) and is part of the verbatim sync model, but **no surface renders it yet** (no
  strikethrough / badge / dimming on the grid/agenda tiles, the home today view, or the details
  screen). Flutter visually marks cancelled classes. A **future-feature gap, not drift** — the
  data-model field is deliberately complete; the actual treatment is an R-3 platform visual decision
  (badge vs. strikethrough vs. dimming) best made as a small dedicated UI ship across the surfaces.
  **Trigger:** the first ship that designs the cancelled treatment (likely alongside per-calendar
  visibility, since both touch how cancelled/hidden events appear).
- **Weekends-toggle / persisted view preference**, incremental/delta sync, per-calendar visibility
  filtering, an offline write queue, edit/delete of synced events — later Phase-04+ items.
