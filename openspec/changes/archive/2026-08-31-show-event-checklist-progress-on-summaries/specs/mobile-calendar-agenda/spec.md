## ADDED Requirements

### Requirement: Agenda rows surface checklist progress

Agenda SHALL receive the same screen-level UID-keyed checklist progress map as the timeline and SHALL show the shared inline completed/total representation on every row with nonzero progress. Synced and personal events SHALL resolve by the same event UID, zero-item rows SHALL remain unchanged, and each nonzero row SHALL compose the localized progress phrase into its existing accessible label.

#### Scenario: Synced and personal Agenda rows show progress

- **WHEN** an Agenda section contains synced and personal events with checklist items
- **THEN** both rows show the correct partial or all-complete completed/total state from their UIDs
- **AND** each row's accessible label includes the localized progress phrase

#### Scenario: Agenda hides zero progress

- **WHEN** an Agenda event has no checklist rows
- **THEN** the row renders no progress indicator and announces no checklist-progress phrase

#### Scenario: Reactive mutation updates an existing Agenda row

- **WHEN** checklist data changes while Agenda remains mounted
- **THEN** the affected row updates from the shared progress map without reopening Agenda
