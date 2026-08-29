## ADDED Requirements

### Requirement: Committed server E2E entrypoint
The server SHALL provide a committed Jest E2E configuration at the path referenced by `npm run test:e2e`, and that configuration SHALL discover only explicitly named E2E specs outside the ordinary `server/src` unit/integration test root.

#### Scenario: Exact package command resolves the harness
- **WHEN** a developer runs `cd server && npm run test:e2e -- --runInBand`
- **THEN** Jest resolves the committed configuration without a missing-config error and discovers at least one E2E spec

#### Scenario: Unit discovery remains independent
- **WHEN** the ordinary `cd server && npm test` command runs
- **THEN** it retains its existing package-level Jest configuration, worker-isolated database setup, and `server/src` test discovery without rediscovering the E2E namespace

### Requirement: Meaningful Nest HTTP smoke
The server E2E suite SHALL execute at least one assertion against production Nest HTTP behavior and MUST fail normally when no matching tests or a contract assertion fails; it SHALL NOT use `--passWithNoTests` or an equivalent empty-suite escape hatch.

#### Scenario: Liveness wire contract is exercised
- **WHEN** the E2E smoke initializes the liveness controller in a Nest HTTP application and requests `GET /health/live`
- **THEN** it asserts HTTP 200 and the stable `{ "status": "ok" }` response before closing the application

#### Scenario: Smoke remains dependency-free
- **WHEN** the liveness E2E spec runs without Firebase credentials, Postgres schema setup, Redis, or queue workers
- **THEN** the assertion completes using only the dependency-free liveness controller and the Nest HTTP test stack

### Requirement: Server E2E CI enforcement
The existing server CI test job SHALL invoke the package-owned E2E command against the exact commit under test, separately from the ordinary server Jest suite.

#### Scenario: Missing harness fails CI
- **WHEN** the committed E2E config is missing, its discovery pattern finds zero tests, or the HTTP assertion fails
- **THEN** the server CI job fails at a clearly identified E2E step

#### Scenario: Shared device-E2E lifecycle is unchanged
- **WHEN** the server Jest E2E smoke is added to CI
- **THEN** `ci/e2e-server.sh` remains the unchanged owner of Nest/Postgres/Redis boot, seed, logs, and teardown for mobile Maestro and legacy Flutter E2E
