## ADDED Requirements

### Requirement: T09 timed tiles show summary checklist progress once

The Calendar timeline SHALL request checklist progress only for the original UIDs present in the complete filtered three-page presentation, using one normalized scoped live read. A supported tile with non-zero progress SHALL show the existing explicit completed/total visual. Its composed event accessibility label SHALL include the localized checklist phrase exactly once; the visual progress primitive SHALL remain excluded from the accessibility tree. Filtered, unsupported, stale-generation, and zero-item events SHALL contribute no progress node.

#### Scenario: Populated tile shows current progress

- **WHEN** a visible timed tile has a checklist with one of two items complete
- **THEN** the tile shows the existing one-of-two progress presentation and updates reactively after a checklist mutation
- **AND** no navigation or event-model replacement is required for the update

#### Scenario: Accessibility label includes progress once

- **WHEN** assistive technology focuses a timed tile with checklist progress
- **THEN** the tile's single composed label includes the localized completed-of-total phrase once
- **AND** the progress visual exposes no duplicate semantic node

#### Scenario: Progress query follows complete filtered identity set

- **WHEN** a hidden, cancelled, invisible-source, unsupported, or stale-generation event leaves the presentation
- **THEN** its UID is absent from the normalized progress query set and the next tile model
- **AND** an event with zero checklist rows renders no progress indicator
