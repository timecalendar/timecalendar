## ADDED Requirements

### Requirement: Dependency-free server liveness signal
The server SHALL expose `GET /health/live` as an unauthenticated process-liveness endpoint that returns HTTP 200 from process-local code without querying or requiring Postgres, Redis, Firestore, S3, queues, or any other external service. The existing `GET /health` endpoint SHALL retain its database-backed health behavior unchanged.

#### Scenario: Liveness responds without database wiring
- **WHEN** the liveness controller is mounted in an application with no database module or database provider
- **THEN** `GET /health/live` returns HTTP 200 with a stable healthy response

#### Scenario: Readiness health remains database-backed
- **WHEN** `GET /health` is requested after this change
- **THEN** the existing `SharedHealthModule` handler performs the same TypeORM database ping and returns its existing response semantics

### Requirement: Operational health routes stay outside the public contract
The server SHALL exclude `GET /health/live` from Swagger generation and SHALL continue excluding `GET /health`, so introducing liveness does not change `openapi/openapi.json` or generated API clients.

#### Scenario: OpenAPI document is regenerated
- **WHEN** the server OpenAPI generator runs after the liveness controller is registered
- **THEN** neither `/health` nor `/health/live` appears in the document and the committed `openapi/openapi.json` remains byte-identical

### Requirement: Node owns the container process lifecycle
The production server image SHALL declare an exec-form command that invokes `node dist/main` directly, making Node PID 1 so Docker and Kubernetes termination signals reach the process and its registered Nest shutdown hooks.

#### Scenario: Image command is inspected
- **WHEN** the built server image configuration is inspected
- **THEN** its command is the exec-form array `["node", "dist/main"]` with no shell or npm wrapper

#### Scenario: Running process receives termination
- **WHEN** the built image is started and Docker sends `SIGTERM`
- **THEN** PID 1 is `node`, the server exits within the 30-second grace window, and Docker does not force a `SIGKILL` exit

### Requirement: Built-image runtime proof runs in CI
Server CI SHALL test the already-built image artifact for command shape, process ownership, startup, liveness serving, and graceful termination rather than relying only on Dockerfile source inspection.

#### Scenario: Valid image passes the runtime proof
- **WHEN** CI runs the focused container-runtime proof against the image built for the commit
- **THEN** the image starts with the test environment, serves `GET /health/live` with HTTP 200, reports Node as PID 1, and stops without exit 137

#### Scenario: Wrapper process regresses PID 1
- **WHEN** an image command introduces a shell, npm, or another wrapper ahead of Node
- **THEN** the focused container-runtime proof fails before the image can be promoted
