## Why

Phase 04 ("Calendar core", roadmap step 2) lists **day / week / agenda** as the calendar
rendering surface, and the exit criterion requires all three to render real timetables. The
day/week timeline just landed (`add-mobile-calendar-timeline`, ADR
[019](../../../.claude/rules/mobile/decisions/019-calendar-rendering-adopt-calendar-kit.md)/[020](../../../.claude/rules/mobile/decisions/020-calendar-kit-seam.md)),
which **deliberately split the agenda/planning view out as this follow-up** — calendar-kit
has **no agenda view** (it is a timeline/grid calendar only), so the agenda is the custom
"easy half" built on the **salvaged primitives + the events-source seam the timeline ship
already landed**. This change ships it, completing the rendering surface.

## What Changes

This change adds the **agenda/planning view as a third view mode of the existing calendar
screen** (day → week → **agenda**), grown in place in `src/features/calendar/`. It is a
**day-grouped list, not a timeline grid**, so it does **not** use calendar-kit (the whole
reason it is custom). It renders from the **unchanged `useCalendarEvents(range)` seam**
(fixture + personal-events-fed now; calendar sync fills it later behind the same seam — no
seam change here).

- A pure **day-grouping helper** `src/features/calendar/data/agenda.ts` —
  `groupEventsByDay(events): AgendaDay[]` mirroring the Flutter
  `events_for_planning_view_helper` / `EventsByDay`: sort by start time, bucket into
  per-calendar-day groups (each `{ day: Date; events: CalendarEvent[] }`), sorted ascending.
  Pure (no React, no calendar-kit, no `@/db`, no `t()`), **90%-gated** — the agenda analog of
  `layoutOverlaps`. (Design D2.)
- A small **display-only date/time formatting helper** `src/features/calendar/data/format.ts`
  over **`date-fns` + `date-fns-tz`** (the new dep, `npx expo install`-pinned, **pure-JS**),
  exposing `formatDayHeaderParts(day, locale)` (the short weekday abbreviation + day-of-month,
  e.g. "LUN" / "15" — Flutter `fullDayToShortDay`) and `formatTimeRange(start, end, locale)`
  (e.g. "09:00 – 13:00" — Flutter `eventPlanningDateTimeText`), **locale-aware** (FR/EN). This
  is **roadmap item 6 pulled early** because the agenda is the first real date-formatting need
  (the roadmap explicitly allows it). **Display only — no rrule/Temporal/recurrence.** (Design
  D3.)
- Extend **`src/features/calendar/ui/calendar-screen.tsx`** to a **3-way day/week/agenda view
  switch** (in-place, matching Flutter's view-type switching — Design D1): when `view ==="agenda"`,
  render the agenda list instead of the calendar-kit grid; the range widens to a bounded
  multi-day window (the visible week) so the list has content. The day/week branches are
  unchanged.
- A presentational **agenda list** `src/features/calendar/ui/agenda-list.tsx` — a React Native
  **`SectionList`** (zero new dep — Design D4) of day-grouped events: each day a section with a
  header (weekday abbreviation + number), each event an accessible tile (radius ~15px, subtle
  shadow, brand-themed) showing title + time + location, tinted by the event `#RRGGBB` color. A
  **now/upcoming indicator** (a brand-`primary` line/dot) marks the current position, exposed
  accessibly. Sorted by start time. Read-only (no event-details tap target yet — that is item 3).
- FR + EN flat i18n keys (the agenda view label + a11y labels; the day-header/time strings come
  from the locale-aware formatter, not catalog keys — Design D3).
- Jest/component proofs: the day-grouping helper + the date formatter at 90%; the screen/agenda
  list at the 70% floor. Maestro: extend `.maestro/calendar.yaml` to switch to the agenda view
  and assert a rendered day header + a fixture event (fixture-backed render + reachability —
  sync isn't built).
- Architecture Book updates: `calendar.md` (the agenda view + day-grouping/formatting helpers,
  the SectionList + date-fns choices, what CI proves), `features.md` (the agenda entry), the
  `architecture-changelog.md` entry. **No new ADR** — ADR 019 already decided "build the agenda
  on the salvaged primitives"; the SectionList-over-FlashList and date-fns-display-only calls
  are recorded in `design.md` as decisions, not ADR-worthy reversible-pattern choices (Design
  D5).

## Capabilities

### New Capabilities
- `mobile-calendar-agenda`: the agenda/planning view — a day-grouped `SectionList` of events
  as a third view mode of the calendar screen, the pure day-grouping helper, the locale-aware
  display-only date/time formatter (`date-fns`), the now/upcoming indicator, and its
  i18n/a11y/CI-proof posture. Renders from the unchanged events-source seam.

### Modified Capabilities
<!-- None at the spec level. The timeline ship's `mobile-calendar-timeline` capability is
     extended at the implementation level (the screen gains a third view branch), but no
     existing spec REQUIREMENT changes its behavior — the day/week requirements, the seam,
     the salvaged primitives, and the calendar-kit ban all stand unchanged. This is an
     additive third view. -->

## Impact

- **Dependencies:** `+ date-fns` and `+ date-fns-tz` (`npx expo install`-pinned) in
  `mobile/package.json` — **pure-JS** (autolinks nothing, no `app.config.ts` plugin, **no EAS
  fingerprint bump**, rides the OTA lane); lockfile regenerated. **No FlashList / no native dep**
  (Design D4). `SectionList` is React Native core (zero dep).
- **New code:** `src/features/calendar/data/{agenda.ts,format.ts}` (+ tests) and
  `src/features/calendar/ui/agenda-list.tsx` (+ test); the `data/` and `ui/` sub-barrels gain
  exports.
- **Modified code:** `src/features/calendar/ui/calendar-screen.tsx` (3-way switch + agenda
  branch + the widened range for agenda); `src/features/calendar/data/index.ts` (re-export the
  new helpers).
- **i18n:** new flat keys in `en.json` + `fr.json` (tsc-typed parity, both directions).
- **Tests:** colocated Jest (day-grouping + formatter at 90%; screen/agenda list at the 70%
  floor); the extended Maestro calendar flow.
- **Docs:** `calendar.md`, `features.md`, `architecture-changelog.md`. No ADR, no
  `decisions/README.md` change.
- **No native change, no schema, no route change** (the agenda is a view mode of the existing
  `/calendar` route). Observability ➖ N/A (read-only — Design D6).
