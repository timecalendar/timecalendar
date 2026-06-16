# mobile-calendar-agenda Specification

## Purpose
TBD - created by archiving change add-mobile-calendar-agenda. Update Purpose after archive.
## Requirements
### Requirement: Pure day-grouping helper, 90%-gated

The calendar feature `data/` sublayer SHALL own a pure function that groups a flat list of
`CalendarEvent`s into per-calendar-day buckets (mirroring the Flutter
`events_for_planning_view_helper` / `EventsByDay`). Each bucket SHALL be `{ day: Date; events:
CalendarEvent[] }`, buckets SHALL be ordered ascending by day, and events SHALL be sorted by start
time. It SHALL be unit-tested to the 90% logic threshold and SHALL import no React, no calendar-kit,
no `@/db`, and no translation function.

#### Scenario: Events bucket by local calendar day

- **WHEN** events spanning several calendar days are grouped
- **THEN** each day yields one bucket `{ day, events }` containing only the events whose `startsAt`
  falls on that local calendar day, and the buckets are ordered ascending by day

#### Scenario: Events within a day are sorted by start time

- **WHEN** a day's bucket is built from events given in arbitrary order
- **THEN** that bucket's events are sorted ascending by `startsAt` (stable on ties)

#### Scenario: Late-evening local event lands on its own day

- **WHEN** an event starts late in the local evening (e.g. 23:30 local)
- **THEN** it is bucketed on its local calendar day (grouping uses local Y-M-D, not UTC)

#### Scenario: Empty input

- **WHEN** an empty event list is grouped
- **THEN** the result is an empty list of buckets

#### Scenario: The helper is pure

- **WHEN** the helper is unit-tested
- **THEN** it runs without rendering, without a backend, and without a clock, and clears the 90%
  logic gate

### Requirement: Locale-aware display-only date/time formatter, 90%-gated

The calendar feature `data/` sublayer SHALL own a pure, locale-aware date/time formatter over
`date-fns` exposing the agenda's day-header parts (an uppercased short weekday abbreviation + the
day-of-month) and an event time range (`HH:mm – HH:mm`). It SHALL format only (no parsing, no
recurrence/rrule, no Temporal), resolve its locale from the app's i18n locale (FR/EN), and be
unit-tested to the 90% logic threshold.

#### Scenario: Day-header parts are locale-aware

- **WHEN** a day is formatted for the header in French and in English
- **THEN** the short weekday abbreviation reflects the requested locale (e.g. French "LUN" vs.
  English "MON") and the day-of-month is the calendar day number

#### Scenario: Event time range

- **WHEN** an event's start and end are formatted as a range
- **THEN** the result is `HH:mm – HH:mm` (24-hour, zero-padded)

#### Scenario: Display only, pure

- **WHEN** the formatter is unit-tested
- **THEN** it formats `Date` inputs without parsing strings, without recurrence expansion, and clears
  the 90% logic gate

### Requirement: date-fns dependency is pure-JS with no native footprint

The mobile app SHALL add `date-fns` (and `date-fns-tz`) as the display-only date/time formatting
dependency. They SHALL be pure-JS: they SHALL NOT add native code, an `app.config.ts` config plugin,
or bump the EAS runtime fingerprint.

#### Scenario: date-fns is declared and pure-JS

- **WHEN** `mobile/package.json` is inspected
- **THEN** it declares `date-fns` (and `date-fns-tz`) at the `expo install`-aligned version and the
  lockfile is consistent
- **AND** no new `app.config.ts` `plugins` entry is added for them
- **AND** the change adds no native module that would change the EAS fingerprint (they ride the OTA
  lane)

### Requirement: Agenda is a third in-place view mode of the calendar screen

The calendar screen SHALL offer an agenda/planning view as a third view mode alongside day and week,
switched in place (matching the Flutter view-type switch). Selecting the agenda view SHALL render the
day-grouped list instead of the day/week grid, over a bounded multi-day range, reading from the
unchanged events-source seam. The agenda SHALL NOT add a new route, a new dependency on the
calendar-kit grid, or a change to the events-source seam.

#### Scenario: A third view switch control exists

- **WHEN** the calendar screen renders
- **THEN** the view switch offers day, week, and agenda controls, each accessible (role + translated
  label + selected state + ≥44pt/48dp target)

#### Scenario: Selecting agenda renders the list

- **WHEN** the agenda view is selected
- **THEN** the screen renders the day-grouped agenda list (not the calendar-kit grid) for a bounded
  multi-day window

#### Scenario: Agenda reads the unchanged events-source seam

- **WHEN** the agenda view computes its events
- **THEN** it reads through `useCalendarEvents(range)` (the same seam the day/week views use) with no
  change to the hook signature, the `CalendarEvent` shape, or the seam's source

#### Scenario: No new route

- **WHEN** the agenda is reached
- **THEN** it is a view mode of the existing `/calendar` route (no new `src/app/` route is added)

### Requirement: Agenda list renders day-grouped events as a brand surface

The calendar feature `ui/` sublayer SHALL provide a presentational agenda list — a React Native
`SectionList` of day-grouped events — as a designed brand surface themed from `@/theme` tokens (R-3).
Each day SHALL render a header (the formatted weekday abbreviation + day number); each event SHALL
render a tile showing its title, its formatted time range, and its location (when present), tinted by
its `#RRGGBB` color, with a rounded radius and a subtle shadow (Flutter planning-tile parity). A
now/upcoming indicator (brand `primary`) SHALL mark the current position. The list SHALL be read-only.

#### Scenario: Day sections with headers

- **WHEN** the agenda list renders day-grouped events
- **THEN** each day is a section with a header showing the formatted short weekday + day-of-month, and
  empty days produce no section

#### Scenario: Event tiles show title, time, and location

- **WHEN** a day section renders its events
- **THEN** each event tile shows the title, the formatted `HH:mm – HH:mm` time range, and the location
  when present, tinted by the event `#RRGGBB` color, with a rounded radius and a subtle shadow

#### Scenario: Now/upcoming indicator

- **WHEN** the agenda renders and the current time falls within the displayed range
- **THEN** a now/upcoming indicator in the brand `primary` marks the current position

#### Scenario: Theme comes from tokens

- **WHEN** the agenda surface renders
- **THEN** its colors (surfaces, text, the now-indicator) derive from `@/theme` tokens (R-3)

#### Scenario: Read-only, no write path

- **WHEN** the agenda is used
- **THEN** it only reads and renders events (no create/edit/delete; no event-details tap-through this
  ship — the tile is not a dead touchable)

#### Scenario: List engine is the zero-dep SectionList

- **WHEN** the agenda list is implemented
- **THEN** it uses the React Native core `SectionList` (no FlashList / no native list dependency this
  ship)

### Requirement: Agenda internationalization and accessibility

Every user-facing string the agenda adds SHALL be translated (FR + EN, no hardcoded strings), with
day-header and time strings supplied by the locale-aware formatter (locale data, not catalog copy).
The agenda view control, day headers, event tiles, and the now-indicator SHALL be accessible.

#### Scenario: FR/EN parity for added keys

- **WHEN** the i18n catalogs are typechecked
- **THEN** every new agenda key (the view label + a11y labels) exists in both `en.json` and `fr.json`
  (bidirectional `tsc` parity)
- **AND** no user-facing string is hardcoded

#### Scenario: Accessible day headers, tiles, and indicator

- **WHEN** the agenda renders
- **THEN** day headers carry a heading role, each event tile is an accessible element with a translated
  label (title + time + location), and the now/upcoming indicator is accessibly labeled or exposed as a
  status (not a silent decorative node)

### Requirement: Agenda wiring proven in CI, perf/visual on-device

The change MUST prove the day-grouping helper, the date formatter, and the screen's
events→sections→tiles wiring by Jest (the agenda list renders a plain `SectionList`, needing no
calendar-kit grid), and MUST record the agenda's visual correctness on both platforms as part of the
calendar surface's existing on-device manual pass.

#### Scenario: Screen wiring is proven without the real grid

- **WHEN** the calendar screen test selects the agenda view
- **THEN** a fixture event's day header and tile render with translated/formatted text (not raw keys),
  and localized text is asserted

#### Scenario: Maestro asserts the agenda renders

- **WHEN** the Maestro calendar flow switches to the agenda view
- **THEN** a day header and a committed fixture event are visible (reachable with no seeded backend,
  since sync is not built)

#### Scenario: Agenda visual review folded into the calendar on-device pass

- **WHEN** the change is reviewed for the performance and native-correctness DoD axes
- **THEN** the agenda view (day headers, tiles, shadow, now-indicator) is covered by the calendar
  surface's existing inboxed on-device perf + brand-visual pass (no separate inbox note for a bounded
  list)

### Requirement: Agenda observability is N/A for this read-only surface

This read-only agenda surface has no crash-worthy write/throw path, so the Observability DoD axis MUST
be marked N/A with a recorded reason, and the app SHALL NOT import `@react-native-firebase/*` directly
anywhere it adds.

#### Scenario: No write path to record

- **WHEN** the change is reviewed for the Observability DoD axis
- **THEN** it is marked N/A because the surface only reads and renders (mirroring the day/week timeline
  and the school-selection read path)

