## ADDED Requirements

### Requirement: Candidate-bound real-route capacity harness
The Activity capacity gate SHALL provide a local-only HTTP harness that boots the production calendar-log module, exercises `POST /v1/calendar-logs/search` through Nest routing, global DTO validation, the production service/repository/mapper path, and JSON serialization, and reports measurements bound to a full candidate commit SHA.

#### Scenario: Harness uses a valid validation container
- **WHEN** `createActivityCapacityHttpApp` constructs the capacity application
- **THEN** global application configuration receives the selected Activity harness root module as class-validator's container and the Nest application as the HTTP configuration target

#### Scenario: Validated route request completes
- **WHEN** the factory-created application receives a valid Activity search body for seeded synthetic calendars
- **THEN** the request survives DTO validation, returns the real route's successful response shape, and does not terminate the process during validator resolution

#### Scenario: Candidate identity is mandatory
- **WHEN** the HTTP measurement command is invoked without a lowercase 40-character commit SHA
- **THEN** it fails before producing measurement output rather than emitting evidence that can be relabelled for another candidate

### Requirement: Full-scale HTTP evidence remains local and aggregate-only
The Activity HTTP capacity harness MUST accept only explicit local database and loopback HTTP targets and SHALL emit only candidate identity, measurement policy, cohort/page keys, aggregate distributions, response byte counts, and aggregate concurrency health.

#### Scenario: Non-local targets fail closed
- **WHEN** either the supplied database URL or the route base URL resolves to a non-local host
- **THEN** the harness refuses the target before connecting or issuing route traffic

#### Scenario: Full-scale policy completes against synthetic PostgreSQL
- **WHEN** the documented HTTP command runs against the isolated deterministic fixture database with 25 recorded samples and 3 discarded warm-ups
- **THEN** it completes every configured cohort and page measurement, reports the exact candidate SHA, and reports all concurrent requests completed without route errors

#### Scenario: Evidence contains no row-level data
- **WHEN** the harness emits stdout or progress/error text
- **THEN** no request or response body, calendar token, calendar/user/event/log identifier, cursor, credential, or configuration content is included

### Requirement: Factory-path regression coverage
A server regression test SHALL construct the HTTP harness through `createActivityCapacityHttpApp`, perform a DTO-validated request through the real Activity route against worker-isolated PostgreSQL, and fail if the application proxy is substituted for the selected root module as class-validator's container.

#### Scenario: Fake bootstrap cannot satisfy the regression
- **WHEN** a test exercises only a compiled testing module, `createTestApp`, or a fake route/module
- **THEN** that test does not satisfy the factory-path regression requirement

#### Scenario: Known container mutation is detected
- **WHEN** the harness bootstrap is changed from the selected Activity root module back to `configureMainApp(app, app)`
- **THEN** the regression fails on the first validated real-route request
