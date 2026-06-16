## ADDED Requirements

### Requirement: A personal-event tap opens the unified event-details screen; create/edit/delete stays reachable

A tap on a personal event (in the day/week timeline, the agenda, or the home today view) SHALL open
the unified event-details screen (`/event-details/<uid>`) — the same destination as a synced event —
instead of routing straight to the personal-event edit form. This is a one-helper change to the single
tap-routing discriminator (`eventRoute(uid, userCalendarId)`), which now returns `/event-details/<uid>`
for both kinds. The personal-event **create** affordance SHALL remain the `/personal-events` list's Add
action (unchanged), and **edit/delete** SHALL remain fully reachable via an **Edit** header action on
the unified details screen (which opens `/personal-event-form?uid=<uid>`). The personal-event form, its
`/personal-event-form` route, and the `usePersonalEvents` read SHALL be unchanged (only the entry point
moves one tap, mirroring the Home-IA relocation).

#### Scenario: A personal event tap opens the details screen

- **WHEN** the user taps a personal event in any calendar view or the home today view
- **THEN** the unified event-details screen opens for that uid (showing the event details + its
  checklist + an Edit action), not the edit form directly

#### Scenario: Edit/delete is reachable via the details screen

- **WHEN** the user taps Edit on a personal event's details screen
- **THEN** the personal-event edit form opens for that uid, with its existing edit and delete controls
  intact

#### Scenario: The form route is unchanged and still deep-linkable

- **WHEN** `/personal-event-form?uid=<uid>` is reached (via the Edit action or a deep link)
- **THEN** the existing create/edit/delete form renders unchanged

#### Scenario: Create is reached from the personal-events list

- **WHEN** the user opens the `/personal-events` list and taps Add
- **THEN** the blank create form opens (unchanged — create did not move)
