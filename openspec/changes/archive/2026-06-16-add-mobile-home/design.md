## Context

Phase 04 item 4 is the **HOME / today landing view** — the surface a TimeCalendar user opens to.
The whole calendar stack is already landed and *behind seams*:

- **Events source** — `useCalendarEvents(range): CalendarEvent[]` (`calendar/data/events.ts`)
  merges synced `calendar_events` (reactive `useLiveQuery`) + personal events, range-filters once.
  The home view reuses it for a "today/displayed-day" range. No source change.
- **Salvaged overlap engine** — `layoutOverlaps<T extends Interval>` (`calendar/data/overlap-layout.ts`)
  and the time-grid math (`minuteToPixel`, `eventHeight`, `hourLabels`, `nowIndicatorPosition`,
  the grid constants) in `calendar/data/time-grid.ts`. **Pure, 90%-gated, owned regardless of the
  renderer (ADR 019).** ADR 019 + calendar.md name the home today-grid as the engine's **first
  rendering consumer** — that is this ship. The day/week grid uses calendar-kit's own internal
  layout; the agenda uses `groupEventsByDay`; the today mini-timeline is the one surface that
  renders through `layoutOverlaps` directly.
- **Sync** — `useSyncCalendars()` (`calendar/data/sync/`) owns `{ sync, isSyncing, isError, reset }`
  over `POST /calendars/sync`; pull-to-refresh and the error/retry banner reuse it verbatim.
- **Tap-through** — the calendar screen's origin-keyed `handlePressEvent(uid, userCalendarId)`:
  synced (`userCalendarId` set) → `/event-details/<uid>`, personal (`undefined`) → `/personal-event-form?uid=<uid>`.
- **Formatting** — `format.ts` locale-aware date-fns helpers (`formatTimeRange`, `formatDayHeaderParts`,
  `formatEventDateRange`, `formatFullDateTime`) over a `LOCALES` map.

The **Flutter `home` module** (read from source) is the parity reference:
- `home_header` — "TimeCalendar" + an event-count line ("N cours …" / "Pas de cours à venir").
- `today_header` — the displayed day's full date.
- `horizontal_events` → `horizontal_event_item` — a horizontal scroller of the day's event cards.
- `today_events` — the overlap-layout mini-timeline for the displayed day: `EventForUI.listFromEvents`
  (= our `layoutOverlaps`) at **70px/hour**, **50px** hours column, **dynamic hour range** =
  min(events.startHour) .. max(events.endHour)+1, **fallback 8–18** when empty, a now-indicator
  (only when the displayed day is today).
- The displayed day is **NOT always today**: `home_events_provider`'s `dayDisplayedOnHomePageProvider`
  picks **today** if there is an event after midnight-today, else the **day of the next future
  event**, else today. The header/scroller/timeline all key off that displayed day. This is the
  "what's next" behavior, and it is the load-bearing selector to port correctly.

The current Home tab (`(tabs)/index.tsx`) renders `PersonalEventsList` — a Phase-2 placeholder.

## Goals / Non-Goals

**Goals:**
- The Home tab is the today/next-up view: header + upcoming scroller + today mini-timeline,
  merging synced + personal events, at Flutter parity.
- The today mini-timeline is the **first rendering consumer of `layoutOverlaps` + `time-grid`**
  (the salvage payoff), with **no new layout logic** beyond two/three pure selectors.
- Pull-to-refresh, tap→details, and formatting reuse the landed seams — minimal new surface.
- The personal-event create/edit/delete flow stays fully reachable (relocated, not dropped).
- Close roadmap item 5 (date/time): one tiny `formatFullDay` helper on the existing seam.

**Non-Goals:**
- No week-paging / no multi-day on home (that is the `/calendar` screen's job).
- No new persistence, no schema, no sync change, no new dependency, no native change.
- No weekends toggle / persisted view preference / per-calendar visibility (later items).
- No edit of synced events / hide-event / checklist (their own ships).
- No `@howljs/calendar-kit` on home — the today grid is the custom overlap engine by design.

## Decisions

### D1 — IA: the Home tab becomes the today view; the standalone personal-events list relocates to `/personal-events` (reachable from Profile)

**Decision.** `(tabs)/index.tsx` renders the new `HomeScreen` (today view). The standalone
`PersonalEventsList` is **moved to a `/personal-events` Stack route** (a `<Stack.Screen>` sibling
of `(tabs)`, exactly like `/calendar`, `/settings`), reachable from a Profile-tab entry link. The
`PersonalEventsList` component, its Add action, the `/personal-event-form` create/edit route, and
the `usePersonalEvents` reactive read are **all unchanged** — only the entry point moves. Personal
events also keep rendering *inside* the home today view (already merged in `useCalendarEvents`,
routed to their edit form on tap).

**Why.** The Flutter home shows the displayed-day's merged events, not a flat personal-events CRUD
list; the home tab is the wrong home for a CRUD list. But the personal-event create flow is a real,
shipped feature (Phase-2 Feature B) — silently dropping its entry point would be a regression. The
two-tab IA (Home, Profile) already routes secondary surfaces (`/calendar`, `/settings`, onboarding)
as Stack siblings reached from Profile; `/personal-events` joins them. The personal events are not
lost from view — they surface within the today timeline merged with classes (Flutter parity: both
EventKinds render together).

**Alternatives rejected.** (a) Keep `PersonalEventsList` as the home tab and add the today view as a
new route — inverts the Flutter IA and leaves the payoff surface unreachable from the landing tab.
(b) Compose both on home (today view + a personal-events sub-list) — duplicates the personal events
(they already render in the timeline) and bloats the landing surface (R-2). (c) Drop the standalone
list, rely only on the timeline tap-to-edit — removes the **create** affordance (you can only edit
an existing event from a tile), a real regression. (d) Add a third "Personal events" tab — speculative
IA expansion from a sample of one; the Profile-reached Stack route matches the established pattern.

### D2 — Is the IA change ADR-worthy? Yes — a small ADR (the Home-tab content + the personal-events relocation)

**Decision.** Record the IA decision as **ADR 022** (next free number) — "Home tab is the today
view; the standalone personal-events list relocates to a Profile-reached route." Update `features.md`
(new Home section + the Personal-events relocation note) and the changelog.

**Why.** R-4 triage: the decision **changes an established, shipped surface** (the Home tab's content
since Phase 2, recorded in `features.md`) and **fixes the app's primary IA** (what the landing tab is)
— which every later Phase-04+ surface inherits and which is costly to reverse (it moves a feature's
entry point). That clears the load-bearing bar. The *rendering* of the today view (composition of
landed primitives) is **not** ADR-worthy — it executes ADRs 019/021/014 + the route-structure rule,
no new reversible pattern. So the ADR is narrowly the IA call, not the screen.

### D3 — `home/` is its own feature folder, not an extension of `calendar/`

**Decision.** A new `src/features/home/` (`data/` selectors + `ui/` screen), following the layered
module pattern (ADR 014). It consumes the calendar feature's `data` sub-barrel by its full `@/`
path (`@/features/calendar/data` — a cross-feature data read, the legitimate consumer pattern the
sync orchestrator already uses to read `user_calendars`).

**Why.** Home is the **landing surface composing calendar + personal events** — it is not a calendar
*view mode* (day/week/agenda are in-place modes of the calendar screen). It has its own axis: "what
day to show, and the upcoming-events digest." Folding it into `calendar/` would conflate the calendar
viewer with the home digest and make `calendar/`'s name no longer describe its contents. A separate
`home/` feature keeps each feature's name honest and its `data/` layer focused (the new selectors are
home-specific, not calendar-viewer logic). Cross-feature `data → data` reads via the full `@/` path
are an established, lint-allowed edge (the sync orchestrator reads `calendar-sources/data/user-calendars`).

**Alternatives rejected.** Extend `calendar/ui/` with a `home-screen.tsx` — the screen would import
the selectors from `calendar/data`, mixing home digest logic into the calendar viewer's data layer.

### D4 — The new pure logic lives in `home/data/`, 90%-gated; everything else is composition

**Decision.** Three pure functions in `home/data/selectors.ts` (no React, no `@/db`, no `t()`):
- `displayedDay(events: CalendarEvent[], now: Date): Date` — local midnight of the displayed day.
  Flutter `dayDisplayedOnHomePageProvider` parity: if any event ends after `now` **today** → today;
  else the local day of the **first event starting after `now`**; else today (empty). (We key
  "today has something left" on `endsAt > now` so a class in progress counts, refining the Flutter
  `startsAt.isAfter(today)` which keyed on the day boundary — recorded so it isn't "fixed" back.)
- `eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[]` — events whose `startsAt`
  falls on `day`'s local calendar day (reusing the agenda's local-Y-M-D bucketing semantics),
  sorted by start (stable id tie-break, mirroring `groupEventsByDay`/`layoutOverlaps`).
- `dynamicHourRange(events: CalendarEvent[]): { startHour: number; endHour: number }` — Flutter
  `today_events` parity: `startHour = min(e.startsAt.getHours())`, `endHour = max(e.endsAt.getHours()) + 1`;
  empty → `{ 8, 18 }`. Clamped to `[0, 24]`. Feeds `time-grid`'s `startMinute`/`endMinute`.

The today timeline then **places** the day's events via `layoutOverlaps(eventsForDay(...))` and
positions each tile with `minuteToPixel`/`eventHeight` (the salvaged math) at a **70px/hour** zoom
(Flutter `hourHeight = 70`, passed as `pixelsPerHour`), `hourLabels(start, end)` for the hours
column, and `nowIndicatorPosition(now, …)` for the now line (shown only when displayed day is today).

**Why.** These selectors are the *only* genuinely new logic (real edge cases: empty, in-progress,
all-past, next-day, cross-hour spans) — they earn the 90% gate. The layout, the pixel math, the
overlap packing, the formatting, the data read, the sync, the routing are all **landed seams reused
as-is** (the salvage payoff). The 70px/hour is passed as the existing `pixelsPerHour` parameter —
no new constant in `time-grid` (the Flutter home zoom is a home concern, not a grid constant; the
grid's `DEFAULT_PIXELS_PER_HOUR = 60` stays the day/week default). `MIN_TILE_WIDTH` text-hiding is
reused for narrow overlap columns.

### D5 — The today timeline is a custom Reanimated-free absolute-positioned grid (NOT calendar-kit)

**Decision.** `home/ui/today-timeline.tsx` renders a plain `View` with absolutely-positioned hour
lines + labels + event tiles computed from the salvaged math — exactly the Flutter `today_events`
`Stack`/`Positioned` shape, in RN `position: "absolute"`. It does **not** use `@howljs/calendar-kit`.

**Why.** This is precisely the salvage purpose ADR 019 named ("the home today-grid reuses the overlap
engine"). calendar-kit is the *paged day/week* renderer; a single fixed-day mini-timeline with a
dynamic hour window doesn't need its gesture/paging/scroll-sync machinery, and using it here would
fight its day-paging model. The custom grid is a few dozen absolutely-positioned views (bounded — one
day) — no virtualization, no Reanimated needed; the existing primitives already do all the math. This
also de-risks: it is the first proof the salvaged engine renders correctly end-to-end (its tested
consumer to date is the unit suite).

### D6 — The upcoming scroller is a horizontal core `FlatList`/`ScrollView` of the displayed-day's events

**Decision.** `home/ui/upcoming-scroller.tsx` — a horizontal RN-core list (`FlatList horizontal` or a
`ScrollView`) of the displayed-day's events as cards (color accent + title + time via `formatTimeRange`
+ location), each a `Pressable` routing through the screen's origin-keyed handler. Empty day → render
nothing (the empty state lives in the header line). Zero new dependency.

**Why.** Flutter `horizontal_events` is a plain horizontal `ListView`; the data is one day (a few
events), so a core horizontal list suffices (no FlashList — same R-2 reasoning as the agenda's
SectionList-over-FlashList; recorded revisit if a day ever has hundreds of events). Cards reuse
`formatTimeRange` and the origin-keyed routing — no new logic.

### D7 — `format.ts` gains `formatFullDay(day, locale)`; this closes roadmap item 5

**Decision.** Add `formatFullDay(day: Date, locale: AppLocale): string` to `calendar/data/format.ts`
(the today header's full date — Flutter `fullDayText`), display-only over the existing `LOCALES` map
(date-fns `PPPP` or `EEEE d MMMM`, locale-resolved). The home header's event-count line ("N events"
/ empty) is an **i18n catalog string with a count** (i18next plural), not a formatter concern.

**Why.** `format.ts` is the established locale-aware display-only seam (agenda + details consumers).
Home needs exactly one new format (the header date); everything else (event times) reuses
`formatTimeRange`. With this, the **roadmap item 5 (date/time) is fully closed** — the date-fns
helper covers every formatting need across calendar/agenda/details/home; no separate date/time ship
remains. **Nothing remains for item 5** except the long-standing *deferred* relative-time ("in 30 min")
and ICU MessageFormat, which the i18n rules already record as earned-when-needed debt (home does not
need relative time — it shows absolute times like Flutter).

### D8 — Observability: ➖ N/A for home itself; the sync error path reuses item 2's split

**Decision.** Home performs **no write** of its own — the only write it triggers is `useSyncCalendars().sync()`
(pull-to-refresh), whose observability split already landed (ADR 021/D6: a fetch failure is a
recoverable `isError`, NOT recorded; a `replaceAll` SQLite-transaction throw IS `recordError`'d, inside
the sync layer). The selectors are pure and total (empty → fallbacks, never throw). So home adds **no
new `@/firebase` call** — it reuses the sync error banner + retry. Observability axis: **➖ N/A** (home's
own surface has no crash-worthy throw; the sync write's observability is owned by item 2).

### D9 — i18n / a11y posture (DoD)

- **i18n:** new flat FR+EN keys for the header app-name reuse (`app.name` exists) + the count line
  (`home.header.count` plural `_one`/`_other` + `home.header.empty`), the section header
  (`home.today.title`), the empty-day state, the "Add personal event" label, and every a11y label
  (upcoming card, timeline tile, now-indicator status, refresh). The day-header date + event times
  come from the **formatter (locale data), not catalog keys** (D7, same as agenda D3).
- **a11y:** the header app-name is a `ThemedText type="title"` (heading role via the ThemedText
  contract); the day section header carries `accessibilityRole="header"`; each upcoming card and each
  timeline tile is a `Pressable` with `accessibilityRole="button"` + a translated label (title + time
  + location) + a ≥44pt/48dp target + a view-details/edit hint; the now-indicator carries a translated
  status label; the empty-day state uses a polite live region; the pull-to-refresh carries a translated
  label; the timeline grid is navigable (tiles as discrete touchables, hour labels `text`). Below
  `MIN_TILE_WIDTH` the tile text hides (narrow overlap columns), label retained.
- **theming (R-3):** a designed brand surface from `@/theme` tokens — the now-indicator rides
  `primary`, tiles use the `#RRGGBB` event color, the surface uses `background`/`backgroundElement`.
  No Flutter Material port (R-3). The Flutter `#ff91b1` now-line literal is **not** ported — the brand
  `primary` is the now-indicator color (matching the agenda + day/week now-indicator).

## Risks / Trade-offs

- [The today timeline is the first real render of the salvaged overlap engine — a layout bug would
  show here, not in the unit suite] → The pure engine is already 90%-tested (5-way clusters, thirds,
  freed-column reuse); the screen test asserts the events→placed→positioned wiring; the dense visual
  correctness is added to the existing calendar on-device visual review note (no new inbox note).
- [`displayedDay` "next day with events" semantics are subtle (in-progress vs. all-past vs. empty)] →
  Ported precisely from the Flutter provider with the one recorded refinement (`endsAt > now`), and
  90%-gated against each branch.
- [IA change moves a shipped feature's entry point — a user/Maestro flow that deep-linked the personal
  list via the home tab breaks] → The personal-events Maestro flow already deep-links
  `/personal-event-form` and the list by its own route concerns; the list relocates to a stable
  `/personal-events` route + a Profile entry. The `personal-events.yaml` Maestro flow is updated to
  reach the list via its new route. No deep-link to the bare home-tab-list existed.
- [Home reads the whole merged event set then range-filters to one day client-side] → The merged set
  is already the bounded synced+personal set the calendar reads; filtering to one displayed day is a
  cheap `useMemo`. No new query.
- [Maestro can't prove the populated today render — the dev harness seeds no synced events] → Same
  posture as the calendar/agenda/details ships: `home.yaml` asserts the home tab renders (header +
  empty state) + pull-to-refresh reachability; the populated render + dense overlap + frame rate stay
  the on-device visual pass. Local Maestro is worth running because home is a runtime-heavy surface
  (it renders the overlap grid).

## Migration Plan

Additive + one IA move. Rollback is a plain revert: `(tabs)/index.tsx` goes back to `PersonalEventsList`,
the `home/` folder + `/personal-events` route + the Profile link are deleted, `formatFullDay` removed.
No schema, no data, no native, no dependency — nothing to roll back beyond source.

## Open Questions

None. The displayed-day semantics, the engine reuse, the IA relocation, the ADR call, and the
item-5 closure are all resolved above.
