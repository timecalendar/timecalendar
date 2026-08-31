## MODIFIED Requirements

### Requirement: Database migrations applied at startup by a migration runner
The app SHALL apply an ordered, committed migration bundle to the local database at startup via a migration runner built on Drizzle's `expo-sqlite` migrator. The runner SHALL be idempotent, SHALL record migration failures through the `@/firebase` observability seam, and SHALL reject after recording so the readiness coordinator remains startup-blocking. No database-backed feature reader, startup side effect, importer prerequisite, or route SHALL mount until the migration promise commits successfully. The committed bundle MAY be empty; feature schemas and migrations remain owned by their features.

#### Scenario: Runner commits before readers and routes
- **WHEN** the app launches
- **THEN** the migration runner applies and commits the bundled migrations before the Phase 09 prerequisite or any database read
- **AND** no navigation route mounts while it is pending

#### Scenario: Empty bundle is a valid green run
- **WHEN** the committed migration bundle contains no new migration
- **THEN** the runner resolves successfully without changing user data
- **AND** startup proceeds to the next prerequisite

#### Scenario: Migration failure is observable and blocking
- **WHEN** applying a migration fails at startup
- **THEN** the error is recorded through `@/firebase` and rethrown to readiness
- **AND** the app exposes Retry without continuing against an unknown schema
