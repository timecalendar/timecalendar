## ADDED Requirements

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
