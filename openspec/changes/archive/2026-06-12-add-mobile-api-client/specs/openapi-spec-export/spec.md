# openapi-spec-export

## ADDED Requirements

### Requirement: Server emits its OpenAPI spec to a committed file
The server SHALL provide a script that builds the OpenAPI document from the application module graph and writes it to `openapi/openapi.json`, without starting an HTTP listener. The script SHALL use the same `DocumentBuilder` configuration as the runtime Swagger setup, via a shared function, so the emitted spec and the served `/api-json` document cannot diverge.

#### Scenario: Generating the spec locally
- **WHEN** a developer runs the spec-emit npm script with the local docker-compose services (Postgres/Redis) running
- **THEN** `openapi/openapi.json` is written (pretty-printed) reflecting the current controllers/DTOs, and the process exits 0 without binding a port

#### Scenario: Runtime Swagger unchanged
- **WHEN** the server runs normally
- **THEN** `/api` (Swagger UI) and `/api-json` keep serving the same document as before, built by the shared configuration

### Requirement: Spec emission avoids runtime side effects
The emit script SHALL run under the test environment profile (`NODE_ENV=test`), so it targets the local test database/Redis and queue processing stays disabled (`ENABLE_QUEUE=false`). It SHALL NOT run migrations, enqueue jobs, or mutate non-test infrastructure.

#### Scenario: No queue or production-state interaction
- **WHEN** the emit script runs
- **THEN** it connects only to the test-profile services, processes no queue jobs, and leaves no persistent state behind beyond the written spec file

### Requirement: CI fails when the committed spec drifts from the server code
Server CI SHALL regenerate the spec and fail if the result differs from the committed `openapi/openapi.json`.

#### Scenario: API change without regenerated spec
- **WHEN** a commit changes a controller or DTO but does not update `openapi/openapi.json`
- **THEN** the CI drift check fails, and its output names the command to regenerate the spec

#### Scenario: Spec in sync
- **WHEN** the committed spec matches what the server code produces
- **THEN** the drift check passes
