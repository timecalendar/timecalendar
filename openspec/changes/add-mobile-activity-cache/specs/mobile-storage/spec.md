## MODIFIED Requirements

### Requirement: Owned storage seams expose complete backend reset operations

`@/db` SHALL expose one reset operation that deletes all rows from `activity_logs`,
`activity_state`, `checklist_items`, `calendar_events`, `user_calendars`, and `personal_events` in
one synchronous SQLite transaction, deleting the derived Activity cache and the other rebuildable
caches before the identity and local-event tables. `@/storage` SHALL expose narrow
reset/journal/classification operations without leaking the raw MMKV instance. Feature/UI code SHALL
invoke the environment reset orchestrator rather than clearing either storage backend directly.

#### Scenario: SQLite reset is complete and atomic

- **WHEN** all six tables contain rows and the database reset succeeds
- **THEN** all six are empty after one synchronous transaction commits

#### Scenario: Activity read state does not survive an environment switch

- **WHEN** the database reset succeeds with an Activity read watermark, unread count, and older-page
  cursor stored
- **THEN** the Activity state row is gone
- **AND** a subsequent Activity state read returns the documented defaults

#### Scenario: SQLite reset throws atomically

- **WHEN** a delete fails inside the database transaction
- **THEN** the transaction throws without presenting a successful partial database reset to the
  orchestrator
- **AND** the environment reset journal remains for recovery

## ADDED Requirements

### Requirement: The `@/db` seam exposes the ordering and comparison operators feature repositories need

The `@/db` seam SHALL re-export the query operators feature `data/` layers build queries with, and
feature code SHALL NOT import `drizzle-orm` directly. The re-exported set SHALL include descending
ordering, less-than comparison, and set-exclusion, which the incremental Activity cache needs for
newest-first reads, retention pruning, and removed-calendar eviction. The seam SHALL re-export only
operators a consumer actually needs, not the whole library.

#### Scenario: A repository builds a descending, pruning, excluding query through the seam

- **WHEN** a feature repository orders rows newest first, deletes rows before a cutoff timestamp, or
  deletes rows outside a set of identifiers
- **THEN** it imports those operators from `@/db`
- **AND** it does not import `drizzle-orm` or `drizzle-orm/sqlite-core` directly

#### Scenario: Lint rejects a direct database-library import in feature code

- **WHEN** feature code imports a query operator from `drizzle-orm` instead of `@/db`
- **THEN** lint fails
</content>
