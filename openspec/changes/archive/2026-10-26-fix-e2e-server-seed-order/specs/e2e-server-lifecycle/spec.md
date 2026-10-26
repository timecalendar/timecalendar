## MODIFIED Requirements

### Requirement: Compose-owned server lifecycle

The repository SHALL provide one shared script (`ci/e2e-server.sh`) that manages the e2e server stack (NestJS, Postgres, and Redis) with Docker Compose as the lifecycle owner. A compose overlay SHALL define the server as a service with a `/health` healthcheck and healthy-dependency ordering. Boot SHALL be `up --wait`, teardown SHALL be `down`, and logs SHALL come from `compose logs`. No hand-rolled process-group management, readiness polling, or log-file juggling.

The server process SHALL NOT start before `timecalendar_test` has been dropped, migrated, and seeded. Server components read the database during application bootstrap (for example, the export-guide catalogue snapshot), so a boot against an empty schema leaves state that seeding afterwards cannot repair. The compose order SHALL be:

1. Bring up Postgres and Redis healthy.
2. Run the one-shot `db:init`.
3. `up --wait` the server.

An emulator-free gate that runs on ordinary pushes SHALL enforce this order.

#### Scenario: up boots a healthy, seeded stack

- **WHEN** `ci/e2e-server.sh up` is run on a host with Docker
- **THEN** it ensures a Firebase dummy key exists, brings up Postgres and Redis with `docker compose up --wait`, and seeds `timecalendar_test` with a one-shot `compose run` of `db:init`
- **AND** only then brings up the server with `docker compose up --wait`, which reports it healthy through `/health`
- **AND** exits 0 with the API serving on host port 3005

#### Scenario: The server never boots against an unseeded schema

- **WHEN** the compose-mode `up` sequence is recorded, with or without `E2E_SERVER_IMAGE`
- **THEN** the `db:init` run comes strictly before the `up --wait` that starts the `server` service
- **AND** the image build flag (`--build`) appears only when `E2E_SERVER_IMAGE` is unset, on the first command that needs the server image

#### Scenario: down removes everything it started

- **WHEN** `ci/e2e-server.sh down` is run
- **THEN** the compose stack is stopped and removed, with no orphan server process possible by construction

#### Scenario: server logs are retrievable after a failure

- **WHEN** a test run fails and `ci/e2e-server.sh logs` is run (or the stack is still up via a keep-up flag)
- **THEN** the server's logs are printed from the compose service, with no log temp-files to locate

## ADDED Requirements

### Requirement: Seeded state enables the mobile onboarding journey

The fixture set loaded by `db:init` SHALL enable every database feature flag that gates an endpoint the mobile onboarding journey calls. At minimum, `export-guides-v1` (`EXPORT_GUIDE_FEATURE_FLAG`) SHALL be enabled, so that `GET /v1/export-guides` serves the guide instead of the flag-off 503. The fixture SHALL be environment-neutral, so a development `db:init` enables it as well. A server unit test SHALL assert that the fixture enables the flag under the same constant the service evaluates.

The test environment SHALL set `S3_PUBLIC_BUCKET_CLIENT_URL` to the exact first-party asset origin the dev-variant mobile client compiles (the dev bucket, `https://timecalendar-dev-public.fra1.digitaloceanspaces.com`, equal to the development value), so that every export-guide image URL the e2e backend serves passes the client's origin allow-list. The mobile allow-list SHALL NOT gain a test-only origin. A server unit test SHALL assert that the test and development values are equal.

#### Scenario: The export guide is served on a freshly seeded stack

- **WHEN** `ci/e2e-server.sh up` (either mode) has completed
- **THEN** `GET /v1/export-guides` responds with the guide (not 503), and the server does not log `Flag not found: export-guides-v1`

#### Scenario: Renaming the flag without the fixture fails a unit test

- **WHEN** `EXPORT_GUIDE_FEATURE_FLAG` no longer matches an enabled item in `feature-flag.fixtures.yml`
- **THEN** the server unit test for the fixture fails

#### Scenario: The export guide parses on the dev-variant client

- **WHEN** the e2e backend (test environment) serves `GET /v1/export-guides` to the dev-variant mobile client
- **THEN** every image URL in the catalogue uses the dev bucket origin, the client parser accepts the mandatory `generic` provider, and onboarding shows the guide instead of "We couldn't load the export guide"
- **AND** a test-env asset origin that diverges from the development one fails the server unit test
