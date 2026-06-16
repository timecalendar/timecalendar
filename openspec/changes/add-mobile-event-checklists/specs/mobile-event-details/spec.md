## MODIFIED Requirements

### Requirement: The event-details screen renders both synced and personal events behind one read seam

The event-details screen SHALL render BOTH a synced event (a `calendar_events` row) AND a personal
event (a `personal_events` row) behind one widened read (`useEventDetails(uid)` / `getByUid(uid)`
resolving either kind for the uid). The read SHALL return a discriminated result tagging the event
kind (`"synced"` / `"personal"`); the personal branch SHALL fill the fields a personal event lacks
with safe defaults (group color = color, empty tags/teachers, empty `userCalendarId`). The screen
SHALL render the shared title block, formatted date/time, content lines, and footer for both kinds.
This widens the previously synced-only details surface (which built `EventDetails` only from a
`calendar_events` row) so that personal events also have a details surface (Flutter parity — both
`EventInterface` open the same screen).

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
