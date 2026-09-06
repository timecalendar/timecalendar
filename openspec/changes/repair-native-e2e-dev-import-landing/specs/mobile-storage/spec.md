## ADDED Requirements

### Requirement: Storage-dependent startup work can join the active migration attempt

The mobile migration runner SHALL expose one shared in-flight attempt per JavaScript process while Drizzle migration work is active. Concurrent callers SHALL receive settlement from that same attempt and MUST NOT run overlapping migrations against the owned SQLite handle. After the active attempt settles, a later invocation MAY run the idempotent migration runner again.

#### Scenario: Concurrent callers share one migration

- **WHEN** root startup starts `runMigrations()` and a storage-dependent cold route calls it before the first attempt settles
- **THEN** both callers await the same active attempt and Drizzle `migrate()` is invoked exactly once for that overlap

#### Scenario: A later migration call remains idempotent

- **WHEN** the active migration attempt has settled and a later caller invokes `runMigrations()`
- **THEN** the runner may invoke Drizzle again and the committed migration tracking leaves the already-migrated schema unchanged

#### Scenario: Shared migration failure remains observable

- **WHEN** the shared active migration attempt rejects
- **THEN** the failure is recorded once through the existing `@/firebase` observability seam and all joining callers settle under the runner's existing non-throwing contract
