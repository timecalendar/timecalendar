## ADDED Requirements

### Requirement: Single-command E2E orchestration

The repository SHALL provide one command that brings up the NestJS backend and
its Postgres database, runs the Flutter end-to-end test against it, reports
pass/fail, and tears the environment down — including on failure.

#### Scenario: The harness boots, tests, and tears down

- **WHEN** `app/integration_test/run_e2e.sh` is run with an Android device or emulator available
- **THEN** it starts Postgres (and Redis) via `server/docker-compose.yml`, seeds the database, starts the backend, runs the Flutter `integration_test`, exits with the test's pass/fail status, and stops the backend and containers afterwards

#### Scenario: The harness fails fast when no device is available

- **WHEN** `run_e2e.sh` is run on a host with no Android device or emulator
- **THEN** the backend and database still come up and seed successfully, and the script exits non-zero with a message directing the user to the harness README and the CI job, then tears the environment down

### Requirement: Deterministic seeded backend state

The harness SHALL start each run from a known, reproducible database state,
using the isolated `timecalendar_test` database so it never modifies a
developer's development database.

#### Scenario: Each run starts from the seeded fixtures

- **WHEN** the harness seeds the database
- **THEN** it drops and re-creates the `timecalendar_test` schema, runs all migrations, and loads the fixture schools, so that `GET /schools` returns exactly the seeded set on every run regardless of prior runs

### Requirement: Happy-path integration test against the live backend

The app SHALL have one `integration_test` that exercises a real backend call
end to end against the harness-managed backend.

#### Scenario: The app loads seeded schools from the backend

- **WHEN** the Flutter `integration_test` runs against the harness backend with `MAIN_API_URL` pointed at it
- **THEN** the app launches, reaches the school-selection screen, performs a real `GET /schools` request, and the two seeded schools render — failing the test if the endpoint, its DTO, or the generated API client is broken

### Requirement: Backend boots without a real Firebase credential

The backend SHALL be startable by the harness without a production Firebase
service-account credential, since `config/firebase.ts` loads that credential at
import time.

#### Scenario: The backend starts with the harness credential

- **WHEN** the harness starts the backend
- **THEN** a dummy service-account key generated at runtime by `run_e2e.sh` (never committed) satisfies the import-time credential read and `firebase-admin` initialization, the server boots, and the schools endpoint — which makes no Firebase call — serves requests

### Requirement: CI executes the E2E smoke test

CI SHALL run the end-to-end smoke test on an Android emulator so the
app ↔ backend contract is verified automatically.

#### Scenario: The CI job runs the harness on an emulator

- **WHEN** the CI workflow runs
- **THEN** a `test-e2e` job boots the backend and database, runs the Flutter `integration_test` on a hardware-accelerated Android emulator, and reports the result

### Requirement: Harness documentation for extension

The harness SHALL be documented so further end-to-end flows can be added
without re-deriving the setup.

#### Scenario: A contributor reads the harness README

- **WHEN** a contributor opens `app/integration_test/README.md`
- **THEN** it explains how to run the harness, its prerequisites, the backend/database/credential and `--dart-define` wiring, the loading-spinner pump pattern, and how to add a new flow
