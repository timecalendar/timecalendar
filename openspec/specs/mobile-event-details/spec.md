# mobile-event-details Specification

## Purpose
TBD - created by archiving change add-mobile-event-details. Update Purpose after archive.
## Requirements
### Requirement: Rich event-details read over the verbatim row, 90%-gated

The calendar feature `data/` sublayer SHALL own the first consumer of the verbatim `calendar_events`
row (ADR 021): a `getByUid(uid)` read returning the single matching row mapped to a **rich**
`EventDetails` domain type, plus a pure `rowToEventDetails(row)` mapper. The rich type SHALL carry the
fields the lossy rendering `CalendarEvent` drops — `groupColor`, `type`, `exportedAt`, and the **full**
tags as `{ name; color; icon }` (not name-only) — alongside `title`, `color`, `startsAt`/`endsAt`
(`Date`), `location`, `description`, `teachers`, `canceled`, and `userCalendarId`. The mapper SHALL be
pure (no `db`), decode the JSON columns defensively (a corrupt/legacy/unparseable value degrades to a
safe default `[]`/`null` rather than throwing the read), and be unit-tested to the 90% logic threshold.
`getByUid` SHALL import the backend only through the `@/db` seam (B-1) and reuse the already-exported
`eq` operator (no new operator).

#### Scenario: Rich fields survive the read

- **WHEN** a stored `calendar_events` row is mapped to `EventDetails`
- **THEN** the result carries `groupColor`, `type`, `exportedAt` (as a `Date`), and the full
  `tags: { name; color; icon }[]` — the fields the lossy `rowToCalendarEvent` projection drops

#### Scenario: Corrupt JSON column degrades safely

- **WHEN** a row's `tags` / `teachers` / `fields` JSON column holds a corrupt or non-conforming value
- **THEN** the mapper yields a safe default (`[]` / `null` / `false`) for that field and does not throw

#### Scenario: getByUid returns the single row or null

- **WHEN** `getByUid(uid)` is called
- **THEN** it queries `calendar_events` by `uid` through the `@/db` seam and returns the mapped
  `EventDetails` for the matching row, or `null` when no row matches

#### Scenario: The mapper is pure and gated

- **WHEN** `rowToEventDetails` is unit-tested
- **THEN** it runs without a backend, maps every field including null↔undefined, and clears the 90%
  logic gate

### Requirement: Reactive event-details hook with loading and not-found states

The calendar feature `data/` sublayer SHALL expose a reactive `useEventDetails(uid)` hook over the
seam's `useLiveQuery` that resolves the rich `EventDetails` for a uid, re-rendering if a sync replaces
the row while the screen is open, and surfacing a not-found result (no matching row) distinctly from a
loading state.

#### Scenario: Resolves a present event

- **WHEN** `useEventDetails(uid)` is read for a uid present in `calendar_events`
- **THEN** it yields the rich `EventDetails` for that row

#### Scenario: Surfaces not-found

- **WHEN** `useEventDetails(uid)` is read for a uid with no matching row (a stale deep link, or an
  event dropped by a sync's drop+replace)
- **THEN** it yields a not-found result the screen can render as an accessible message (not a throw,
  not a silent blank)

### Requirement: Full date/time formatters, display-only, 90%-gated

The calendar feature `data/` sublayer's date/time formatter SHALL gain two display-only, locale-aware
functions over the existing `date-fns` dependency: an event date+time range (the full date plus the
`HH:mm – HH:mm` range — Flutter `eventDateTimeText`) and a full date-time for the "updated" footer
(Flutter `fullDateTimeText`). They SHALL format only (no parsing, no recurrence), resolve their locale
from the app's i18n locale (FR/EN), use 24-hour time (R-3, matching the agenda formatter), add no new
dependency, and be unit-tested to the 90% logic threshold.

#### Scenario: Event date range is full and locale-aware

- **WHEN** an event's start and end are formatted for the title block in French and English
- **THEN** the result includes the full date (locale-appropriate) and the `HH:mm – HH:mm` time range

#### Scenario: Footer full date-time

- **WHEN** an `exportedAt` timestamp is formatted for the footer
- **THEN** the result is the full date plus the time (locale-aware, 24-hour)

#### Scenario: Display only, pure, no new dep

- **WHEN** the new formatters are unit-tested
- **THEN** they format `Date` inputs without parsing strings or recurrence, clear the 90% gate, and add
  no new dependency to `mobile/package.json`

### Requirement: Read-only event-details screen for synced calendar events

The calendar feature `ui/` sublayer SHALL provide a presentational, **read-only** event-details screen
for synced calendar events, themed from `@/theme` tokens (R-3), rendering a calendar event's full info:
a title block (a labeled color swatch + the title + the formatted full date/time), tag bubbles (each
the tag's name and color, only when tags exist), content lines (an icon-or-label + text for location,
the calendar name when the user has 2+ calendars, teachers, and description — each only when present),
and an "updated" footer. The screen SHALL have **no edit, delete, hide, or checklist** affordance and
no write path of any kind.

#### Scenario: Title block

- **WHEN** the details screen renders an event
- **THEN** it shows a labeled color swatch (the event color, accessibly named — not a silent node), the
  title as a heading, and the formatted full date/time range

#### Scenario: Tags render when present

- **WHEN** the event has tags
- **THEN** each tag renders as a bubble showing its name on its color; when the event has no tags, no
  tag section renders

#### Scenario: Content lines render only present fields

- **WHEN** the event has a location, a description, teachers, and (with 2+ user calendars) a calendar
  name
- **THEN** each renders as a content line (an icon-or-label + text); a field that is absent or empty
  renders no line; teachers render newline-joined

#### Scenario: Updated footer

- **WHEN** the details screen renders
- **THEN** a footer shows the "updated" label plus the formatted `exportedAt` full date/time

#### Scenario: Read-only, no write affordance

- **WHEN** the details screen is used
- **THEN** it offers no edit, delete, hide, or checklist control and triggers no write — back
  navigation is the only action

#### Scenario: Theme from tokens

- **WHEN** the details surface renders
- **THEN** its colors (surfaces, text) derive from `@/theme` tokens (R-3); the tag bubble background is
  the tag's own color and the swatch is the event color

### Requirement: Not-found state for a missing event

The details screen SHALL render an accessible not-found message when its uid resolves to no
`calendar_events` row, rather than crashing or showing a blank screen.

#### Scenario: Stale or dropped event

- **WHEN** the details screen is opened for a uid with no matching row
- **THEN** it shows a translated not-found message in a polite live region (no crash, no blank screen,
  no `recordError`)

### Requirement: Tap-through from the timeline and agenda views

The day/week timeline grid and the agenda list SHALL make their event tiles tappable, opening the
details screen for a synced calendar event and the existing personal-event form for a personal event.
The agenda tile SHALL become an accessible touchable (role + translated label + ≥44pt/48dp target), and
the grid SHALL wire the calendar-kit `onPressEvent` through the chrome seam. Routing SHALL be keyed on
the event origin: a synced event (it carries a `userCalendarId`) opens `event-details/<uid>`; a personal
event (no `userCalendarId`) opens `personal-event-form?uid=<uid>` (the existing edit route).

#### Scenario: Agenda tile is a touchable

- **WHEN** the agenda list renders an event tile
- **THEN** the tile is an accessible touchable (role + translated label including a view-details hint +
  ≥44pt/48dp target) — no longer a non-touchable `text` node

#### Scenario: Tapping a synced event opens details

- **WHEN** a synced calendar event tile (in the grid or the agenda) is tapped
- **THEN** the app navigates to the read-only details route for that event's uid

#### Scenario: Tapping a personal event opens its form

- **WHEN** a personal event tile is tapped
- **THEN** the app navigates to the existing personal-event form route for that uid (NOT the read-only
  details screen)

#### Scenario: Grid uses the chrome seam

- **WHEN** the calendar-kit grid wires event presses
- **THEN** it passes `onPressEvent` through the `@/components/chrome` seam (the screen never imports
  `@howljs/calendar-kit` directly — the calendar-kit ban still holds)

### Requirement: Deep-linkable details route, thin entrypoint

The details screen SHALL be reachable as a dynamic route `event-details/[uid]` — a thin re-export of
the feature `ui/` screen (route-structure rule), registered as a `Stack` sibling of `(tabs)`, with the
uid as a route param resolved through `getByUid`/`useEventDetails`. It SHALL be deep-linkable
(`timecalendar-dev://event-details/<uid>`).

#### Scenario: Thin route over the feature ui

- **WHEN** the route file is inspected
- **THEN** `src/app/event-details/[uid].tsx` is a one-line re-export of the screen through the feature
  `ui/` sub-barrel, and the screen + its colocated test live under `src/features/calendar/ui/`

#### Scenario: Registered and deep-linkable

- **WHEN** the root layout is inspected
- **THEN** the `event-details/[uid]` route is registered as a `<Stack.Screen>` sibling of `(tabs)` and
  resolves a deep link `timecalendar-dev://event-details/<uid>`

### Requirement: Event-details internationalization and accessibility

Every user-facing string the details screen adds SHALL be translated (FR + EN, no hardcoded strings),
with date strings supplied by the locale-aware formatter (locale data, not catalog copy). The title,
content lines, color swatch, tag bubbles, the not-found message, and the tap targets SHALL be
accessible.

#### Scenario: FR/EN parity for added keys

- **WHEN** the i18n catalogs are typechecked
- **THEN** every new event-details key (the screen title, content/section labels, the "updated" prefix,
  the not-found message, the tap a11y label) exists in both `en.json` and `fr.json` (bidirectional
  `tsc` parity)
- **AND** no user-facing string is hardcoded (date strings come from the formatter)

#### Scenario: Accessible title, swatch, lines, and tags

- **WHEN** the details screen renders
- **THEN** the title carries a heading role, the color swatch is accessibly labeled (not a silent
  node), each content line conveys its text to assistive tech with any icon treated as decorative, and
  tag bubbles expose their names

### Requirement: Event-details wiring proven in CI, populated render on-device

The change MUST prove the rich mapper, the `getByUid` read shape, the new formatters, the screen's
row→sections rendering (including the not-found state), and the tap-through routing by Jest, and MUST
record the real populated details render on both platforms as part of the calendar surface's on-device
manual pass (the dev harness seeds no synced event reachable by deep link).

#### Scenario: Screen and tap wiring proven without seeded data

- **WHEN** the screen test renders the details screen for a fixture rich event and presses a tile
- **THEN** the title, formatted date, tags, content lines, and footer render with translated/formatted
  text (not raw keys), the not-found state renders for a missing uid, and a tile press fires the router
  push with the origin-correct route (details for a synced event, the form for a personal event)

#### Scenario: Maestro asserts reachability

- **WHEN** the Maestro calendar flow exercises the tap target / a deep link to the details route
- **THEN** the details route is reachable (the screen mounts; with no seeded synced event it shows the
  screen chrome / the not-found state) — the real populated render is the on-device manual pass

#### Scenario: Populated render folded into the calendar on-device pass

- **WHEN** the change is reviewed for the performance and native-correctness DoD axes
- **THEN** the details screen (title block, tags with color, content lines, footer, the back
  affordance) on real synced data is covered by the calendar surface's existing inboxed on-device pass

### Requirement: Event-details observability is N/A for this read-only surface

The change SHALL mark the Observability DoD axis N/A with a recorded reason and SHALL NOT import
`@react-native-firebase/*` directly anywhere it adds, because this read-only details surface has no
crash-worthy write/throw path (a `getByUid` miss is a recoverable not-found state, a corrupt column
degrades safely).

#### Scenario: No write path to record

- **WHEN** the change is reviewed for the Observability DoD axis
- **THEN** it is marked N/A because the surface only reads and renders (a not-found uid is a recoverable
  accessible state, not an exception — mirroring the day/week timeline and the agenda read path)

### Requirement: Edit, delete, hide, and checklist are deferred

The change SHALL NOT add edit, delete, hide-event, or checklist capabilities to the details screen.
These are state-writing features deferred to their own ships, recorded so the roadmap tracks them.

#### Scenario: No interactive write surface this ship

- **WHEN** the details screen is reviewed
- **THEN** it has no header overflow menu and no edit/delete/hide/checklist control; the hide-event and
  checklist features are recorded as deferred (their own future ships)

