## ADDED Requirements

### Requirement: The Home tab renders the today / next-up view

The Home tab (`src/app/(tabs)/index.tsx`) SHALL render the home today view (`HomeScreen` from
`@/features/home/ui`) instead of the standalone personal-events list. The view SHALL merge synced
calendar events and personal events via the unchanged `useCalendarEvents` events-source seam — it
SHALL NOT add a second events source.

#### Scenario: Home tab shows the today view

- **WHEN** the Home tab is opened
- **THEN** the home today view renders (a header, the day's upcoming scroller when non-empty, and
  the today mini-timeline), sourced from `useCalendarEvents`

#### Scenario: Personal and synced events both appear

- **WHEN** the merged event set for the displayed day contains both a personal event and a synced
  calendar event
- **THEN** both render in the upcoming scroller and the today timeline

### Requirement: The displayed day follows the next-up selector

The home view SHALL display the day chosen by a pure `displayedDay(events, now)` selector: **today**
if any event ends after `now` on today's local calendar day; else the local calendar day of the
**first event starting after `now`**; else **today** when there are no future events.

#### Scenario: An event remains today

- **WHEN** an event of today's calendar day ends after `now` (including an in-progress event)
- **THEN** `displayedDay` returns local midnight of today

#### Scenario: The next event is on a future day

- **WHEN** today's remaining events have all ended but a future event exists
- **THEN** `displayedDay` returns local midnight of that next future event's day

#### Scenario: No future events

- **WHEN** the merged event set is empty (or all events are in the past)
- **THEN** `displayedDay` returns local midnight of today

### Requirement: The header shows the app name, the displayed-day date, and an event count

The home header SHALL show the app name as a heading, the displayed day's full localized date (via a
`formatFullDay(day, locale)` date-fns helper), and a translated, pluralized count line of the
displayed day's events — with a distinct translated empty state when the displayed day has no events.

#### Scenario: Non-empty day count

- **WHEN** the displayed day has N events (N ≥ 1)
- **THEN** the header shows the localized count line (i18next plural `_one`/`_other`) and the full
  localized date of the displayed day

#### Scenario: Empty day

- **WHEN** the displayed day has no events
- **THEN** the header shows the translated empty state copy

### Requirement: The upcoming scroller lists the displayed day's events as tappable cards

The home view SHALL render a horizontal scroller of the displayed day's events (`eventsForDay`
selector, sorted by start), each card showing the event color accent, title, time range (via
`formatTimeRange`), and location. Each card SHALL be a touchable that routes via the origin-keyed
handler: a synced event (carrying a `userCalendarId`) to the read-only event-details route, a
personal event to its edit form route.

#### Scenario: Tapping a synced event card

- **WHEN** a card for a synced calendar event is tapped
- **THEN** the app navigates to `/event-details/<uid>`

#### Scenario: Tapping a personal event card

- **WHEN** a card for a personal event (no `userCalendarId`) is tapped
- **THEN** the app navigates to the personal-event edit form for that uid

#### Scenario: Empty day hides the scroller

- **WHEN** the displayed day has no events
- **THEN** no upcoming scroller renders (the empty state is the header line)

### Requirement: The today mini-timeline renders on the salvaged overlap engine

The home today timeline SHALL position the displayed day's events using the salvaged
`layoutOverlaps` engine for horizontal column packing and the salvaged `time-grid` math
(`minuteToPixel`, `eventHeight`, `hourLabels`) for vertical placement. The vertical zoom SHALL be
the Flutter-parity ~70px/hour passed as `pixelsPerHour`. The visible hour window SHALL be the
dynamic range from `dynamicHourRange(events)` (min start hour .. max end hour + 1; fallback 8–18
when empty). The timeline SHALL NOT use `@howljs/calendar-kit`.

#### Scenario: Overlapping events are packed into columns

- **WHEN** the displayed day has overlapping events
- **THEN** they are laid out via `layoutOverlaps` into non-overlapping fractional columns and
  positioned by the time-grid math

#### Scenario: Dynamic hour window

- **WHEN** the displayed day has events spanning 9:00–17:30
- **THEN** the timeline's hour window covers at least 9..18 (min start hour .. max end hour + 1)

#### Scenario: Empty day fallback window

- **WHEN** the displayed day has no events
- **THEN** the timeline uses the 8–18 fallback window

#### Scenario: Tapping a timeline tile

- **WHEN** a timeline event tile is tapped
- **THEN** it routes via the same origin-keyed handler as the scroller cards

### Requirement: The now-indicator shows only when the displayed day is today

The today timeline SHALL render a now-indicator (positioned via `nowIndicatorPosition`, tinted with
the brand `primary` token) only when the displayed day is today and the current time falls within
the visible hour window.

#### Scenario: Today within the window

- **WHEN** the displayed day is today and the current time is inside the hour window
- **THEN** the now-indicator renders at the time-grid position with a translated status label

#### Scenario: A future displayed day

- **WHEN** the displayed day is not today
- **THEN** no now-indicator renders

### Requirement: Pull-to-refresh and the sync error/retry surface reuse the sync orchestrator

The home view SHALL trigger `useSyncCalendars().sync()` on pull-to-refresh and SHALL show an
accessible sync-error banner with a retry control when the orchestrator reports `isError` — reusing
the landed sync orchestrator. The home view SHALL NOT add its own fetch logic or its own
`@/firebase` call.

#### Scenario: Pull-to-refresh runs a sync

- **WHEN** the user pulls to refresh on the home view
- **THEN** `sync()` runs and the refreshing state reflects `isSyncing`

#### Scenario: A failed sync is recoverable

- **WHEN** a sync fails (`isError`)
- **THEN** an accessible error banner with a retry control renders and the last-good events still
  display

### Requirement: The standalone personal-events list relocates to a reachable route

The standalone personal-events list (with its create/edit/delete flow) SHALL remain fully reachable
via a `/personal-events` Stack route reached from a Profile-tab entry link. The `PersonalEventsList`
component, the `/personal-event-form` create/edit route, and the reactive `usePersonalEvents` read
SHALL be unchanged — only the entry point moves off the Home tab.

#### Scenario: Personal events reachable from Profile

- **WHEN** the Profile-tab "Personal events" entry is opened
- **THEN** the personal-events list renders with its Add control and rows, unchanged

#### Scenario: Create flow preserved

- **WHEN** the Add control on the relocated list is used
- **THEN** the blank personal-event create form opens as before

### Requirement: Accessibility, i18n, and theming conform to the Definition of Done

All home user-facing strings SHALL be translated (FR + EN, flat typed keys; date/time values come
from the formatter, not catalog keys). The header app-name and day-section header SHALL carry
heading roles; cards, timeline tiles, and the retry control SHALL be touchables with translated
labels + hints and ≥44pt/48dp targets; the now-indicator and empty-day state SHALL carry accessible
status/live-region semantics. The surface SHALL be themed from `@/theme` tokens (R-3 — no Flutter
Material port; the now-indicator rides the brand `primary`).

#### Scenario: Lint and type gates pass

- **WHEN** `npm run lint` and `npx tsc --noEmit` run in `mobile/`
- **THEN** no hardcoded strings, no a11y-on-touchable violations, no feature-boundary violations,
  and no type errors are reported (FR/EN key parity holds at compile time)

#### Scenario: Coverage gate holds

- **WHEN** `npm test -- --coverage` runs
- **THEN** the new `home/data/` selectors clear the 90% logic gate and the `home/ui/` screen clears
  the 70% global floor
