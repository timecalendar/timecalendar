# e2e-smoke-harness — delta

## MODIFIED Requirements

### Requirement: Single-command E2E orchestration

The repository SHALL provide one command that brings up the NestJS backend and
its Postgres database, runs the Flutter end-to-end test against it, reports
pass/fail, and tears the environment down — including on failure. The server
stack is managed by the shared e2e server lifecycle (`ci/e2e-server.sh`), not
by the harness script itself; `run_e2e.sh` owns only the Flutter-specific half
(device resolution, per-flow `flutter test` execution, result reporting).

#### Scenario: The harness boots, tests, and tears down

- **WHEN** `app/integration_test/run_e2e.sh` is run with an Android device or emulator available
- **THEN** it brings up Postgres, Redis, and the backend as compose-managed services via the shared lifecycle (healthcheck-gated, seeded), runs the Flutter `integration_test` flows, exits with the tests' pass/fail status, and tears the stack down afterwards via the shared lifecycle

#### Scenario: The harness fails fast when no device is available

- **WHEN** `run_e2e.sh` is run on a host with no Android device or emulator
- **THEN** the backend and database still come up and seed successfully via the shared lifecycle, and the script exits non-zero with a message directing the user to the harness README and the CI job, then tears the environment down

### Requirement: Backend boots without a real Firebase credential

The backend SHALL be startable by the harness without a production Firebase
service-account credential, since `config/firebase.ts` loads that credential at
import time. The dummy credential is provisioned by the shared e2e server
lifecycle, not by `run_e2e.sh` itself.

#### Scenario: The backend starts with the harness credential

- **WHEN** the shared lifecycle starts the backend
- **THEN** a dummy service-account key generated at runtime by `ci/generate-dummy-firebase-key.sh` (never committed; an existing developer key left untouched) satisfies the import-time credential read and `firebase-admin` initialization, the server boots, and the schools endpoint — which makes no Firebase call — serves requests
