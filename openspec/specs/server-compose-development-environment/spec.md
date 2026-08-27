# server-compose-development-environment Specification

## Purpose
TBD - created by archiving change isolate-server-compose-stacks. Update Purpose after archive.
## Requirements
### Requirement: Worktree-scoped Compose identity

The repository SHALL provide a local server Compose entrypoint that selects a stable,
human-readable project name for the current checkout when `COMPOSE_PROJECT_NAME` is unset,
while honoring an explicit `COMPOSE_PROJECT_NAME` override. The main checkout SHALL retain
the historical `server` project name, and worktree-derived names SHALL be valid Compose
project names and include a collision-resistant checkout-path component.

#### Scenario: Two worktrees resolve independently

- **WHEN** the entrypoint resolves the Compose model from two different git worktree roots
- **THEN** the models have distinct project names and therefore distinct default container,
  network, and named-volume names

#### Scenario: Main checkout retains the existing project

- **WHEN** the entrypoint runs from the repository's main checkout with no explicit project
  override
- **THEN** it selects `server`, preserving the existing single-checkout container and volume
  identity

#### Scenario: Explicit project override wins

- **WHEN** `COMPOSE_PROJECT_NAME` is set to a valid project name
- **THEN** the entrypoint uses that exact name instead of deriving one

### Requirement: Overrideable published ports with coherent defaults

The Compose model SHALL accept `TIMECALENDAR_TLS_PORT`,
`TIMECALENDAR_POSTGRES_PORT`, and `TIMECALENDAR_REDIS_PORT` overrides for the nginx,
Postgres, and Redis host-side ports. When unset, the ports SHALL remain `1443`, `37291`,
and `37292`, respectively.

#### Scenario: Default single-checkout ports

- **WHEN** the Compose model is resolved without port overrides
- **THEN** nginx publishes `1443:443`, Postgres publishes `37291:5432`, and Redis publishes
  `37292:6379`

#### Scenario: Worktree selects unoccupied ports

- **WHEN** all three port variables are set to alternate valid host ports
- **THEN** the resolved model publishes those host ports without changing the container
  ports or service-to-service addresses

### Requirement: Dependency-only local startup

The documented local contract SHALL provide an explicit command that starts only Postgres
and Redis through the worktree-scoped entrypoint, without creating or starting nginx. It
SHALL document matching `DATABASE_URL` and `REDIS_URL` values when non-default ports are
selected.

#### Scenario: Generation proceeds without nginx

- **WHEN** a contributor needs to run OpenAPI generation or server tests while the TLS host
  port is occupied
- **THEN** they can start only `postgres redis`, supply connection URLs matching any selected
  host-port overrides, and run the server command without touching nginx

### Requirement: Selected configuration is diagnosable

The local Compose entrypoint and setup diagnostics SHALL identify the selected project name
and effective host ports. Setup reachability checks SHALL use the effective TLS port and
SHALL keep the default URLs documented as `https://api.timecalendar.host:1443` and the
backend on `http://localhost:3005` when no overrides are set.

#### Scenario: Contributor inspects ownership before startup

- **WHEN** the contributor resolves the Compose config or runs setup diagnostics
- **THEN** the output names the project and effective TLS, Postgres, and Redis host ports
  without requiring any Docker service mutation

### Requirement: Static isolation verification

The repository SHALL define a config-level verification procedure that uses resolved Docker
Compose models to prove distinct project, container, network, named-volume, and port values.
The procedure MUST NOT stop, restart, remove, or otherwise alter existing Docker resources.

#### Scenario: Verify two models without touching the daemon

- **WHEN** the verification is run for two worktree roots with different alternate ports
- **THEN** it compares their `docker compose config` output, confirms all scoped names and
  published ports differ as intended, and performs no lifecycle command

