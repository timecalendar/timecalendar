# mobile-e2e — delta

## ADDED Requirements

### Requirement: Real-round-trip Maestro flow

The mobile app SHALL have at least one Maestro flow that proves the app ↔ server contract end to end: the app performs a real `GET /schools` against the harness-managed NestJS instance and seeded data renders on screen. Flows live in `mobile/.maestro/` and are shared across platforms.

#### Scenario: Seeded schools render through the generated client

- **WHEN** the Maestro flow launches the development-variant app and opens the `timecalendar-dev://schools` deep link with the harness server running
- **THEN** the schools screen fetches via the generated Orval hook through `customFetch`, and the flow asserts a seeded school's name is visible — failing if the endpoint, its DTO, the generated client, or the QueryClient wiring is broken

### Requirement: Single-command local e2e run

The repository SHALL provide one command that boots the server stack, runs the Maestro flows against the connected simulator/emulator, reports pass/fail, and tears the stack down — including on failure — with a `--keep-up` debugging escape hatch matching the Flutter harness's UX.

#### Scenario: One command runs the whole loop

- **WHEN** `mobile/e2e/run_e2e.sh` is run with a booted iOS simulator or Android emulator and an installed e2e build
- **THEN** it brings the server stack up via the shared lifecycle, runs `maestro test` on the flows, exits with Maestro's pass/fail status, and tears the stack down on success and failure alike

#### Scenario: --keep-up leaves the stack for debugging

- **WHEN** the wrapper is run with `--keep-up`
- **THEN** the server stack stays up after the run and the command reports how to inspect logs and tear down manually

### Requirement: E2E builds reach the local server

The `development` app variant SHALL be able to reach a server on the host machine over plain HTTP — Android cleartext traffic and iOS local-networking ATS exceptions are enabled for that variant only, and the e2e build bakes the platform-correct base URL (`http://10.0.2.2:3005` on Android, `http://localhost:3005` on iOS) via `EXPO_PUBLIC_API_URL`.

#### Scenario: A release-config dev-variant build calls the harness server

- **WHEN** a release-configuration build of the `development` variant runs on an emulator/simulator while the harness server listens on host port 3005
- **THEN** the app's HTTP request reaches the server (not blocked by Android cleartext policy or iOS ATS) without Metro running

#### Scenario: The production variant carries no exceptions

- **WHEN** the app is built with `APP_VARIANT` unset or `production`
- **THEN** no cleartext or local-networking exception is present in the native config

### Requirement: CI runs Maestro on both platforms

CI SHALL run the Maestro flows on an Android emulator (Linux runner) and an iOS simulator (macOS runner) on every push, using binaries built on the runners — no Metro, no EAS.

#### Scenario: Android e2e in CI

- **WHEN** the `e2e-mobile-android` job runs
- **THEN** it loads the `build-server` image artifact into the shared lifecycle, builds a release APK via `expo prebuild` + Gradle, installs it on a hardware-accelerated emulator, runs the Maestro flows, and fails the job on any flow failure

#### Scenario: iOS e2e in CI

- **WHEN** the `e2e-mobile-ios` job runs on a macOS runner
- **THEN** it provisions Postgres/Redis natively (macOS runners have no Docker), boots the server via the shared lifecycle's native mode, builds a Release simulator app via `expo prebuild` + xcodebuild, installs it with `simctl`, runs the Maestro flows, and fails the job on any flow failure

#### Scenario: Failures leave evidence

- **WHEN** a Maestro flow fails in CI
- **THEN** Maestro's debug output (screenshots/logs) and the server logs are uploaded as workflow artifacts
