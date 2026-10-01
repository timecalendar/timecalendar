## ADDED Requirements

### Requirement: T09 timeline activation preserves unified details authority

An owned-timeline tile SHALL activate its original event UID through the screen-owned `eventRoute` helper and existing unified event-details route. The timeline presentation SHALL NOT carry rich descriptions, full tags, hide/edit authority, or a captured details row. The details read SHALL resolve current storage state by UID: synced events remain read-only apart from the existing hide/unhide action and personal events retain the existing Edit action.

#### Scenario: Synced class opens read-only details

- **WHEN** the student taps a valid synced class tile
- **THEN** the original synced UID opens the unified event-details screen and its current rich row is read from local storage
- **AND** no personal Edit action is exposed

#### Scenario: Personal tile preserves editing

- **WHEN** the student taps a valid personal-event tile
- **THEN** the original personal UID opens the same event-details screen
- **AND** the existing Edit action still reaches the personal-event form

#### Scenario: Removed event does not use stale tile content as details

- **WHEN** an activated event no longer resolves from either local table
- **THEN** the existing accessible not-found outcome renders
- **AND** the tile's captured title, location, or kind is not substituted for current details state
