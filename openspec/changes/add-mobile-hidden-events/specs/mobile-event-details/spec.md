## MODIFIED Requirements

### Requirement: Read-only event-details screen for synced calendar events

The calendar feature `ui/` sublayer SHALL provide a presentational event-details screen for synced
calendar events, themed from `@/theme` tokens (R-3), rendering a calendar event's full info: a title
block (a labeled color swatch + the title + the formatted full date/time), tag bubbles (each the tag's
name and color, only when tags exist), content lines (an icon-or-label + text for location, the
calendar name when the user has 2+ calendars, teachers, and description — each only when present), and
an "updated" footer. The screen SHALL remain read-only with respect to the event's CONTENT (no edit,
delete, or checklist affordance and no content write path). The screen MAY offer a **hide / un-hide
action** for a synced event (a header overflow menu — the hidden-events capability), which is a
visibility write, not a content edit; see `mobile-hidden-events`.

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

#### Scenario: No content-edit affordance

- **WHEN** the details screen is used
- **THEN** it offers no edit, delete, or checklist control and triggers no content write — the only
  write it may trigger is a hide / un-hide visibility action (the hidden-events capability), and back
  navigation is otherwise the only action

#### Scenario: Theme from tokens

- **WHEN** the details surface renders
- **THEN** its colors (surfaces, text) derive from `@/theme` tokens (R-3); the tag bubble background is
  the tag's own color and the swatch is the event color

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

### Requirement: Edit, delete, hide, and checklist are deferred

The change SHALL NOT add edit, delete, or checklist capabilities to the details screen. **Hide-event is
no longer deferred — it lands via the `mobile-hidden-events` capability** (a header overflow menu
offered only for synced events). Edit, delete, and checklist remain state-writing features deferred to
their own ships, recorded so the roadmap tracks them.

#### Scenario: No edit/delete/checklist write surface

- **WHEN** the details screen is reviewed
- **THEN** it has no edit, delete, or checklist control; the only write surface is the hide / un-hide
  action (the hidden-events capability), and edit/delete/checklist remain recorded as deferred
