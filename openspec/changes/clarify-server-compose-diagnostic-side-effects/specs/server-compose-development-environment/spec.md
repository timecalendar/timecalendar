## MODIFIED Requirements

### Requirement: Selected configuration is diagnosable

The local Compose entrypoint and setup diagnostics SHALL identify the selected project name and effective host ports, and setup diagnostics SHALL distinguish a TLS certificate fault from an unreachable proxy rather than reporting one opaque failure for both. Setup reachability checks SHALL use the effective TLS port and SHALL keep the default URLs documented as `https://api.timecalendar.host:1443` and the backend on `http://localhost:3005` when no overrides are set. A diagnostic that invokes Docker Compose SHALL NOT create, start, stop, restart, remove, or otherwise mutate any Docker resource, but the entrypoint MAY provision or renew the checkout-local, gitignored TLS pair before invoking Compose.

#### Scenario: Contributor inspects ownership before startup

- **WHEN** the contributor resolves the Compose config or runs setup diagnostics
- **THEN** the output names the project and effective TLS, Postgres, and Redis host ports without
  creating, starting, stopping, restarting, removing, or otherwise mutating any Docker resource
- **AND** a Compose-backed diagnostic may provision or renew
  `ci/certificates/cert.pem` and `ci/certificates/key.pem` in the current checkout

#### Scenario: Config-only diagnostics never provision or mutate

- **WHEN** the contributor requests the Compose project name or the setup script's
  configuration-only output
- **THEN** the command prints the selected identity and ports and writes no file, generates no
  certificate material, and contacts no service

#### Scenario: A certificate fault names itself

- **WHEN** the reachability check fails because the served certificate cannot be verified
  against the local certificate
- **THEN** the diagnostics identify the certificate as the cause and name the nginx restart and
  re-trust steps, instead of attributing the failure to DNS, nginx, or a stopped stack

### Requirement: Unreachable TLS proxy is attributed to the nginx container

Setup diagnostics SHALL distinguish a stack that was never started from an nginx service that
started and failed, whenever the TLS reachability check does not answer. When the nginx service
has a container, the diagnostics SHALL report that container's state, so a restart loop is named
as one. When it has no container, the diagnostics SHALL keep directing the reader to start the
stack. The check MUST NOT create, start, stop, restart, remove, or otherwise mutate any Docker
resource; its Compose-backed state query MAY provision or renew the checkout-local, gitignored TLS
pair before invoking Compose. The check MUST NOT require a tool the repository does not already
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
