# Spec Delta

## ADDED Requirements

### Requirement: An Activity item announces what it shows

Each Activity item SHALL be one accessible element whose name is its kind label with the event
title, then its time when known, then each spoken change line for a changed event, in visual order.
New and changed items SHALL be activatable and open the event's details; cancelled items SHALL be
static. Item test identifiers SHALL stay `activity-<kind>-<uid>`.

#### Scenario: A changed item reads its changes

- **WHEN** a changed item with a moved time renders
- **THEN** its accessible name contains the kind label with the title, the time, and the spoken
  change line, and activating it opens the event's details

#### Scenario: A cancelled item is static

- **WHEN** a cancelled item renders
- **THEN** it exposes its composed name without the button role and does not navigate
