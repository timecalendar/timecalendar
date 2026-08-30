## MODIFIED Requirements

### Requirement: Owned storage seams expose complete backend reset operations

`@/db` SHALL expose one reset operation that deletes all rows from `activity_logs`, `activity_state`, `checklist_items`, `calendar_events`, `user_calendars`, and `personal_events` in one synchronous SQLite transaction. The two Activity tables are backend-bound rebuildable data and SHALL be cleared alongside calendar events and user calendars — the environment-switch reset SHALL use this same operation rather than a second table list. `@/storage` SHALL expose narrow reset/journal/classification operations without leaking the raw MMKV instance. Feature/UI code SHALL invoke the environment reset orchestrator rather than clearing either storage backend directly.

#### Scenario: SQLite reset is complete and atomic

- **WHEN** all six tables contain rows and the database reset succeeds
- **THEN** all six are empty after one synchronous transaction commits

#### Scenario: SQLite reset throws atomically

- **WHEN** a delete fails inside the database transaction
- **THEN** the transaction throws without presenting a successful partial database reset to the orchestrator
- **AND** the environment reset journal remains for recovery

#### Scenario: An environment switch clears cached Activity history

- **WHEN** the student confirms a backend environment switch
- **THEN** `activity_logs` and `activity_state` are empty on the target environment
- **AND** no Activity history or read state from the previous environment remains on the device
