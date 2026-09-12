## MODIFIED Requirements

### Requirement: Tap-through from the timeline and agenda views

At the T01 milestone, the existing agenda list SHALL keep its event tiles tappable and SHALL open the unified event-details screen for both synced and personal events. Agenda tiles SHALL remain accessible touchables with translated view-details labels and platform minimum targets. The owned day/week shell SHALL expose no event tiles or event activation until the owned timed-event slice lands. Routing SHALL remain identity-based: both event kinds open `event-details/<uid>`, and personal-event edit/delete remains one tap deeper through the details screen.

#### Scenario: Agenda tile remains a touchable

- **WHEN** the agenda list renders an event tile
- **THEN** the tile is an accessible touchable with a translated label, view-details hint, and platform minimum target

#### Scenario: Tapping a synced agenda event opens details

- **WHEN** a synced event tile in Agenda is tapped
- **THEN** the app navigates to the unified event-details route for that event's uid

#### Scenario: Tapping a personal agenda event opens details

- **WHEN** a personal event tile in Agenda is tapped
- **THEN** the app navigates to the unified event-details route for that event's uid
- **AND** editing remains available from the details screen rather than directly from the tile

#### Scenario: Owned shell does not expose unavailable event activation

- **WHEN** the T01 day/week shell renders
- **THEN** it presents no event tiles, stale activation callback, or silent event press target

#### Scenario: Details return preserves Calendar usability

- **WHEN** the student returns from a fabricated event's details screen
- **THEN** Calendar remains usable and Agenda can be reached again
