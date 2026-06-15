## ADDED Requirements

### Requirement: Worker-isolated test databases
The server test suite SHALL isolate state by giving each test worker its own Postgres database via nest-shared's `SharedDatabaseModule` test utilities, rather than sharing a single `timecalendar_test` database.

#### Scenario: Each worker owns a database
- **WHEN** the test suite runs across multiple workers
- **THEN** `SharedDatabaseModule.setupTestDatabase()` provisions a database named `${db}_test_${JEST_WORKER_ID}` for each worker, isolated from the others

#### Scenario: Per-test cleanup
- **WHEN** a test completes
- **THEN** the per-worker database is reset via `SharedDatabaseModule.clearTestDatabase()` (truncating the worker's tables) so the next test starts clean

#### Scenario: Test user can create databases
- **WHEN** the test harness provisions worker databases
- **THEN** the configured Postgres role has the `CREATEDB` privilege (in local dev and CI), and `bin/init-postgres.sql` no longer pre-creates a static `timecalendar_test` database

### Requirement: Parallel test execution
The server test suite SHALL run in parallel using Jest's default runner; the custom serial runner SHALL be removed.

#### Scenario: Serial runner is gone
- **WHEN** the Jest configuration is inspected after the migration
- **THEN** there is no custom `runner` entry (e.g. `test-utils/test-runner.ts`), the file is deleted, and tests execute across multiple workers without cross-test interference

### Requirement: Factories use the shared test DataSource
Test data factories SHALL persist through nest-shared's shared test `DataSource` (`SharedDatabaseModule.getTestDataSource()`), replacing the custom factory-to-app-DataSource wiring.

#### Scenario: Factory persists to the worker database
- **WHEN** a Fishery factory creates and saves an entity in a test
- **THEN** it writes through `SharedDatabaseModule.getTestDataSource()` to the current worker's database, and the custom `factory-builder` / `typeorm-test-module` wiring is removed

### Requirement: Test schema built from entities
The test database schema SHALL be built by TypeORM `synchronize` from entity metadata (nest-shared's model), and the trade-off that the Jest suite no longer exercises migrations SHALL be covered by the migration-running e2e path.

#### Scenario: Schema is synchronized for tests
- **WHEN** a worker database is set up
- **THEN** its schema is created via `synchronize` from the entities, with no migration run in the Jest lifecycle

#### Scenario: Migration health stays covered elsewhere
- **WHEN** migration correctness needs verification
- **THEN** it is exercised by the e2e server path (`ci/e2e-server.sh`) and production boot (`RUN_MIGRATIONS=true`), which run the real migration chain against a real database — not by the Jest unit/integration suite
