# Spec Delta

## ADDED Requirements

### Requirement: An Activity item announces what it shows

Each Activity item SHALL be one accessible element whose name is one translated phrase naming its
kind with the event title (for example "Changed event {title}"), then its time when known, then
each spoken change line for a changed event, in visual order. The name SHALL carry no hint. New and
changed items SHALL be activatable, open the event's details, and carry the hint "Opens event
details" as their accessibility hint; cancelled items SHALL be static and carry no hint. Item test
identifiers SHALL stay `activity-<kind>-<uid>`.

#### Scenario: A changed item reads its changes

- **WHEN** a changed item with a moved time renders
- **THEN** its accessible name is the changed-event phrase with the title, the time, and the
  spoken change line, its hint is "Opens event details", and activating it opens the event's
  details

#### Scenario: A cancelled item is static

- **WHEN** a cancelled item renders
- **THEN** it exposes the cancelled-event phrase with the title and the time, without the button
  role or a hint, and does not navigate
