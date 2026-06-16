## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Read-only event-details screen for synced calendar events

**Reason**: Superseded by the ADDED requirement "The event-details screen renders both synced and
personal events behind one read seam" (plus the interactive-checklist and origin-keyed-header-actions
requirements). The details surface is no longer **read-only** (the checklist is the first interactive,
write-capable section) and no longer **synced-only** (it renders personal events too). The rendering
this requirement described — the title block, tag bubbles, content lines, "updated" footer, and
`@/theme` theming — is carried forward verbatim by the new both-kinds requirement for both event kinds,
so nothing is lost; only the false "read-only / synced-only" framing is dropped.

### Requirement: Edit, delete, hide, and checklist are deferred

**Reason**: No longer true. Hide-event landed in Phase 05 Ship A (the `mobile-hidden-events`
capability), and the **checklist** and personal-event **Edit** (the previously-deferred "edit half")
land in this change (Ship B) — the interactive checklist section and the origin-keyed Edit header action
on the unified details screen. With all of edit/hide/checklist now shipped (personal delete stays
reachable through the relocated Edit form), the "deferred" requirement is false and is removed.
