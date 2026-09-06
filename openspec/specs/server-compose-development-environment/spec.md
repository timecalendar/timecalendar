# server-compose-development-environment Specification

## Purpose
Define the local server Compose contract for worktree-isolated resources, overrideable host
ports, dependency-only startup, and non-mutating configuration diagnostics.
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

### Requirement: Host gateway reachability for the local TLS proxy

The local Compose model SHALL give the nginx service a `host.docker.internal` mapping to the
container network's host gateway, so the vhost upstreams in `server/nginx.conf` resolve on
Docker Engine as well as on Docker Desktop. The mapping SHALL be unconditional rather than
platform-selected, SHALL apply to nginx only, and SHALL survive published-port overrides,
worktree project scoping, and the E2E overlay. The static verification procedure SHALL assert
the mapping on the resolved Compose model, and MUST NOT start, stop, or otherwise mutate any
Docker resource to do so.

#### Scenario: nginx starts on Docker Engine

- **WHEN** the local Compose stack is started from a Linux host whose Docker runtime injects no
  `host.docker.internal` alias
- **THEN** the nginx container resolves its configured upstreams at startup, completes
  configuration, and stays running instead of entering a restart loop

#### Scenario: Resolved model carries the mapping

- **WHEN** the Compose model is resolved with default ports, with overridden ports, and with the
  E2E overlay layered on the base file
- **THEN** every resolved model maps `host.docker.internal` to the host gateway on the nginx
  service, whichever textual form the Compose version renders it in

#### Scenario: Only nginx receives the mapping

- **WHEN** the resolved model is inspected for the Postgres, Redis, and E2E server services
- **THEN** none of them declares a `host.docker.internal` mapping, because each reaches its
  peers by Compose service name

#### Scenario: E2E startup is unaffected

- **WHEN** the E2E lifecycle brings the stack up by naming the `server` service
- **THEN** Compose starts only that service and its healthy dependencies, nginx is never
  started, and the overlay's resolved service set is unchanged

### Requirement: Unreachable TLS proxy is attributed to the nginx container

Setup diagnostics SHALL distinguish a stack that was never started from an nginx service that
started and failed, whenever the TLS reachability check does not answer. When the nginx service
has a container, the diagnostics SHALL report that container's state, so a restart loop is named
as one. When it has no container, the diagnostics SHALL keep directing the reader to start the
stack. The check MUST be non-mutating, MUST NOT require a tool the repository does not already
depend on, and MUST NOT abort the remaining diagnostics when the Docker daemon is unavailable.

#### Scenario: nginx is restarting

- **WHEN** the TLS reachability check fails while the nginx service has a container that is
  restarting
- **THEN** the diagnostics report the nginx container's state rather than asking whether the
  stack is up

#### Scenario: The stack was never started

- **WHEN** the TLS reachability check fails and the nginx service has no container
- **THEN** the diagnostics keep the existing prompt to start the stack with the worktree-scoped
  entrypoint

#### Scenario: Docker is unavailable

- **WHEN** the TLS reachability check fails and the Docker daemon cannot be queried at all
- **THEN** the diagnostics degrade to the stack-not-started prompt and the remaining checks still
  run to completion

