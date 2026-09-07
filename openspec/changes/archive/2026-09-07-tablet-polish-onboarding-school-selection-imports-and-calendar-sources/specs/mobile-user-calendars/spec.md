## ADDED Requirements

### Requirement: Calendar management uses semantic measured lanes
The user-calendar management screen SHALL align its collection and states to a measured standard
lane, and the rename dialog SHALL bound its inner content with a measured readable lane, without
changing calendar-source behavior or modal presentation.

#### Scenario: Calendar collection is centered on a tablet
- **WHEN** user calendars are presented at tablet width
- **THEN** populated, loading, and empty collection content share the standard lane
- **AND** visibility, overflow, rename, delete, and add behavior remain unchanged

#### Scenario: Rename content is readable in its existing modal
- **WHEN** the rename dialog is presented at tablet width
- **THEN** the card is centered within a readable lane inside the current modal owner
- **AND** focus isolation, validation, pending, retry, cancel, and save behavior remain unchanged
