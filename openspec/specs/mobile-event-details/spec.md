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

### Requirement: Not-found state for a missing event

The details screen SHALL render an accessible not-found message when its uid resolves to no
`calendar_events` row, rather than crashing or showing a blank screen.

#### Scenario: Stale or dropped event

- **WHEN** the details screen is opened for a uid with no matching row
- **THEN** it shows a translated not-found message in a polite live region (no crash, no blank screen,
  no `recordError`)

### Requirement: Tap-through from the timeline and agenda views

The day/week timeline grid and the agenda list SHALL make their event tiles tappable, opening the
unified event-details screen for BOTH a synced calendar event AND a personal event. The agenda tile
SHALL be an accessible touchable (role + translated label + ≥44pt/48dp target), and the grid SHALL wire
the calendar-kit `onPressEvent` through the chrome seam. Routing SHALL no longer be origin-keyed at the
tap: both a synced event (it carries a `userCalendarId`) and a personal event (no `userCalendarId`) open
`event-details/<uid>` — the single tap-routing discriminator now returns the details route for both
kinds. The personal-event edit/delete flow stays reachable one tap deeper, via the **Edit** header
action on the unified details screen (not directly from the tile).

#### Scenario: Agenda tile is a touchable

- **WHEN** the agenda list renders an event tile
- **THEN** the tile is an accessible touchable (role + translated label including a view-details hint +
  ≥44pt/48dp target) — no longer a non-touchable `text` node

#### Scenario: Tapping a synced event opens details

- **WHEN** a synced calendar event tile (in the grid or the agenda) is tapped
- **THEN** the app navigates to the unified details route for that event's uid

#### Scenario: Tapping a personal event opens details

- **WHEN** a personal event tile (in the grid or the agenda) is tapped
- **THEN** the app navigates to the unified details route for that event's uid (NOT directly to the
  personal-event form — the form is reached from the details screen's Edit action)

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

The event-details READ surface SHALL NOT record to Crashlytics, because it has no crash-worthy
write/throw path (a `getByUid` miss is a recoverable not-found state and a corrupt column degrades
safely). Any WRITE the screen triggers — the hide / un-hide visibility action — SHALL carry its own
observability posture owned by the `mobile-hidden-events` capability (a failed write is recorded through
`@/firebase` `recordError`).

#### Scenario: The read surface has no write path to record

- **WHEN** the event-details read surface (rich read, formatters, render, not-found) is reviewed for
  observability
- **THEN** it has no crash-worthy throw of its own (a not-found uid is a recoverable accessible state,
  mirroring the day/week timeline and the agenda read path)

#### Scenario: The hide action's observability is owned by hidden-events

- **WHEN** the hide / un-hide action on the screen writes the hidden set
- **THEN** its failure is recorded through `@/firebase` `recordError` per the `mobile-hidden-events`
  capability (the screen does not silently swallow a hide-write failure)

### Requirement: The event-details screen renders both synced and personal events behind one read seam

The event-details screen SHALL render BOTH a synced event (a `calendar_events` row) AND a personal
event (a `personal_events` row) behind one widened read (`useEventDetails(uid)` / `getByUid(uid)`
resolving either kind for the uid). The read SHALL return a discriminated result tagging the event
kind (`"synced"` / `"personal"`); the personal branch SHALL fill the fields a personal event lacks
with safe defaults (group color = color, empty tags/teachers, empty `userCalendarId`). The screen
SHALL render the shared title block, formatted date/time, content lines, and footer for both kinds.
This widens the previously synced-only details surface (which built `EventDetails` only from a
`calendar_events` row) so that personal events also have a details surface (Flutter parity — both
`EventInterface` open the same screen). The title block (labeled color swatch + heading + formatted
full date/time), the tag bubbles, the content lines (location / calendar name with 2+ calendars /
teachers / description — each only when present), the "updated" footer, and the `@/theme`-derived
theming (R-3) of the prior synced-only requirement are preserved here for both kinds.

#### Scenario: A synced event renders its rich details

- **WHEN** the details screen is opened for a synced event's uid
- **THEN** the rich `calendar_events` row is read and the title / date / tags / lines / footer render
  (the existing read-only behavior is preserved)

#### Scenario: A personal event renders its details

- **WHEN** the details screen is opened for a personal event's uid
- **THEN** the `personal_events` row is read and the title / date / location / description render,
  with the personal-event safe defaults for the sync-only fields

#### Scenario: A not-found uid still renders the accessible not-found state

- **WHEN** the uid resolves to neither a synced nor a personal event
- **THEN** the accessible not-found state renders (not a crash or a blank)

### Requirement: The event-details screen surfaces an interactive checklist for both event kinds

The event-details screen SHALL render the interactive checklist section (the `event-checklists`
feature's component) for BOTH event kinds, keyed on the event uid. This lands the "edit half" of event
details that Phase 04 deferred: the checklist is the first interactive (write-capable) section on the
previously read-only details screen.

#### Scenario: The checklist renders for a synced event

- **WHEN** the details screen renders a synced event
- **THEN** the checklist section appears below the event details, joined on the event uid

#### Scenario: The checklist renders for a personal event

- **WHEN** the details screen renders a personal event
- **THEN** the checklist section appears, joined on the personal event's uid

### Requirement: The event-details header actions are origin-keyed — hide/un-hide for synced, Edit for personal

The event-details screen SHALL show origin-keyed header actions. For a SYNCED event it SHALL keep the
hide / un-hide action (Phase 05 Ship A). For a PERSONAL event it SHALL show an **Edit** action that
navigates to the personal-event edit form (`/personal-event-form?uid=<uid>`), so the personal-event
edit/delete flow stays fully reachable from the unified details surface (relocated one tap, not
dropped). The two header actions SHALL be mutually exclusive by kind.

#### Scenario: A synced event offers hide/un-hide

- **WHEN** the details screen renders a synced event
- **THEN** the header offers the hide / un-hide action (and no Edit action)

#### Scenario: A personal event offers Edit

- **WHEN** the details screen renders a personal event
- **THEN** the header offers an Edit action that opens the personal-event edit form (and no
  hide/un-hide action)

#### Scenario: Edit reaches the form

- **WHEN** the user taps Edit on a personal event's details
- **THEN** the personal-event edit form opens for that uid (create/edit/delete of the event itself
  stays reachable)

