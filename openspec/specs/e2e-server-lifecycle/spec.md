# e2e-server-lifecycle Specification

## Purpose
TBD - created by archiving change add-mobile-test-harness. Update Purpose after archive.
## Requirements
### Requirement: Compose-owned server lifecycle

The repository SHALL provide one shared script (`ci/e2e-server.sh`) that manages the e2e server stack — NestJS + Postgres + Redis — with Docker Compose as the lifecycle owner: a compose overlay defines the server as a service with a `/health` healthcheck and healthy-dependency ordering, so boot is `up --wait`, teardown is `down`, and logs are `compose logs`. No hand-rolled process-group management, readiness polling, or log-file juggling.

#### Scenario: up boots a healthy, seeded stack

- **WHEN** `ci/e2e-server.sh up` is run on a host with Docker
- **THEN** it ensures a Firebase dummy key exists, brings up Postgres, Redis, and the server with `docker compose up --wait` (the server reported healthy via `/health`), seeds `timecalendar_test` via a one-shot `compose run` of `db:init`, and exits 0 with the API serving on host port 3005

#### Scenario: down removes everything it started

- **WHEN** `ci/e2e-server.sh down` is run
- **THEN** the compose stack is stopped and removed, with no orphan server process possible by construction

#### Scenario: server logs are retrievable after a failure

- **WHEN** a test run fails and `ci/e2e-server.sh logs` is run (or the stack is still up via a keep-up flag)
- **THEN** the server's logs are printed from the compose service — no log temp-files to locate

### Requirement: Image-or-build seam for the server

The lifecycle SHALL build the server image from source by default (layer-cached) and SHALL accept a prebuilt image override (`E2E_SERVER_IMAGE`), so CI reuses the `build-server` artifact instead of rebuilding.

#### Scenario: Local runs build from source

- **WHEN** `up` runs with no `E2E_SERVER_IMAGE` set
- **THEN** compose builds the server image from `server/` (cached layers making repeat runs fast) and uses it

#### Scenario: CI injects the already-built image

- **WHEN** `up` runs with `E2E_SERVER_IMAGE` pointing at the loaded `build-server` artifact image
- **THEN** compose uses that image without building

### Requirement: Native mode for Docker-less hosts

The lifecycle SHALL support a `--native` mode for hosts without Docker (GitHub macOS runners): service provisioning (Postgres/Redis) is the caller's responsibility, while seeding, dummy-key generation, server boot from source, and `/health` readiness remain single-sourced in the script. Only provisioning may differ between modes.

#### Scenario: Native mode boots the same seeded server

- **WHEN** `ci/e2e-server.sh up --native` runs with Postgres and Redis already reachable on the standard ports
- **THEN** the script seeds `timecalendar_test`, ensures the dummy key, starts the server from source as a background process recorded in a pid file, waits on `/health`, and serves on the same port 3005 with the same env as compose mode

#### Scenario: Native down kills the recorded process

- **WHEN** `ci/e2e-server.sh down --native` runs after a native `up`
- **THEN** the pid-file process is terminated; on ephemeral CI runners teardown is best-effort by design

### Requirement: Deterministic seeded state, isolated test database

Every `up` SHALL start from a known state: the `timecalendar_test` database is dropped, migrated, and seeded with the fixture set, never touching a developer's development database.

#### Scenario: Repeat runs are reproducible

- **WHEN** `up` is run twice in a row
- **THEN** both runs end with `GET /schools` returning exactly the seeded fixture set, regardless of what previous runs wrote

### Requirement: Boots without a real Firebase credential

The lifecycle SHALL satisfy the server's import-time service-account read with a generated throwaway key (`ci/generate-dummy-firebase-key.sh`), never committed, in both compose and native modes.

#### Scenario: The dummy key is generated when absent

- **WHEN** `up` runs and no `server/config/serviceAccountKey.json` exists
- **THEN** the shared generator creates a throwaway key (an existing developer key is left untouched) and the server boots with it

