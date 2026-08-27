## Why

Every checkout runs the local Compose file from a directory named `server`, so Docker
Compose assigns every worktree the same `server` project and reuses its containers,
network, and named volumes. The fixed host ports (`1443`, `37291`, and `37292`) add a
second collision point, preventing concurrent worktrees and making an unrelated orphaned
listener block routine generation and test setup.

## What Changes

- Add one repository-owned Compose entrypoint that derives a stable, inspectable project
  name from the checkout when `COMPOSE_PROJECT_NAME` is not explicitly supplied, then
  forwards all arguments to Docker Compose.
- Parameterize the nginx, Postgres, and Redis published host ports while retaining `1443`,
  `37291`, and `37292` as the single-checkout defaults.
- Document a Postgres/Redis-only startup command for server generation and tests, including
  the matching `DATABASE_URL` and `REDIS_URL` when ports are overridden.
- Make setup output and failure diagnostics identify the selected Compose project and host
  ports, and keep the documented default TLS/backend URLs coherent.
- Add static resolved-model checks for distinct projects, project-scoped named volumes,
  port overrides, and the Postgres/Redis-only service selection. Verification must not
  stop, restart, or otherwise disturb existing Docker services.
- Preserve direct `server/docker-compose.yml` consumption by CI and the
  `docker-compose.e2e.yml` overlay without changing deployment behavior.

## Capabilities

### New Capabilities

- `server-compose-development-environment`: Worktree-isolated local Compose identity,
  overrideable published ports, dependency-only startup, and inspectable diagnostics.

### Modified Capabilities

- `e2e-server-lifecycle`: Preserve the established Compose overlay lifecycle while the
  shared base Compose model gains local project and port configuration.
- `openapi-spec-export`: Define the supported Postgres/Redis-only prerequisite command and
  matching connection environment for local spec generation.

## Impact

- Expected implementation surfaces: `server/docker-compose.yml`, a small wrapper under
  `bin/`, `bin/setup-dev.sh`, `README.md`, `docs/agent-dev-environment.md`, and focused
  static/config verification.
- `server/docker-compose.e2e.yml` and `ci/e2e-server.sh` remain compatible consumers; CI's
  direct Compose invocation retains the current default project/ports and provides the CI
  compatibility proof.
- No API, generated-client, database-schema, migration, application, or deployment behavior
  changes. No new runtime dependency is required.
- Sensitive surfaces: `ci/certificates/` remains a read-only nginx bind-mount source and
  its contents are not modified or exposed. `.github/workflows/ci-build-deploy.yml` remains
  unchanged even though it consumes the Compose file. The OpenAPI contract/generated
  clients, migrations, native/store config, `terraform/`, `k8s/`, and legacy `app/` are
  explicitly out of scope.
- Operational constraint: implementation and verification must not stop/restart Docker,
  kill the orphaned `1443` proxy, or manipulate any existing shared-host container.
