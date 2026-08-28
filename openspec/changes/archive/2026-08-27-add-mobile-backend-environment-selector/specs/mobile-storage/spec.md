## ADDED Requirements

### Requirement: Owned storage seams expose complete backend reset operations

`@/db` SHALL expose one reset operation that deletes all rows from `checklist_items`, `calendar_events`, `user_calendars`, and `personal_events` in one synchronous SQLite transaction. `@/storage` SHALL expose narrow reset/journal/classification operations without leaking the raw MMKV instance. Feature/UI code SHALL invoke the environment reset orchestrator rather than clearing either storage backend directly.

#### Scenario: SQLite reset is complete and atomic

- **WHEN** all four tables contain rows and the database reset succeeds
- **THEN** all four are empty after one synchronous transaction commits

#### Scenario: SQLite reset throws atomically

- **WHEN** a delete fails inside the database transaction
- **THEN** the transaction throws without presenting a successful partial database reset to the orchestrator
- **AND** the environment reset journal remains for recovery

### Requirement: MMKV keys have reviewed environment classification

Every known MMKV key SHALL be classified as environment-independent, reset-control, or backend-bound. Theme, language, display-timezone, and Changelog acknowledgement SHALL be environment-independent. Selected environment and the temporary reset journal SHALL be reset-control values. School/group identity, hidden-event identifiers, notification preferences/registration state, remembered feedback e-mail, the TanStack persisted-query record, and unclassified future keys SHALL be backend-bound. Reset SHALL remove backend-bound values and preserve only explicitly justified survivors.

#### Scenario: Classification drives reset

- **WHEN** reset runs with every known key populated
- **THEN** every backend-bound value is absent and every documented global UI preference is unchanged
- **AND** target selection is retained only after successful completion

#### Scenario: New key requires classification

- **WHEN** a persisted application key is added without a reviewed classification
- **THEN** the classification coverage test fails rather than silently allowing it to survive

### Requirement: Reset journal reads are total and startup-blocking

The reset journal parser SHALL validate a versioned current/target environment record and never throw on absent or malformed input. A valid journal SHALL block normal startup until idempotent recovery completes. Malformed journal input SHALL fail safely to a recovery state that cannot mount backend consumers or select a non-production URL.

#### Scenario: Valid journal resumes recovery

- **WHEN** startup finds a valid incomplete reset journal
- **THEN** it reruns reset participants before any backend consumer mounts

#### Scenario: Malformed journal cannot bypass safety

- **WHEN** startup finds malformed journal content
- **THEN** no non-production environment is activated and normal backend work does not resume with uncertain state
