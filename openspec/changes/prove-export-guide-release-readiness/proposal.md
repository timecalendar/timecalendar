## Why

The native export-guide contract, data layer, and journey are implemented, but the shipped path is
not yet exercised across the real test server, release-configuration binaries, and protected deep
links. TIM-520 closes that integration gap with reproducible exact-head evidence while keeping live
catalogue activation, store delivery, and production environments outside the repository change.

## What Changes

- Add test/E2E-only FR and EN export-guide fixtures for all four initial providers, listed exact and
  unknown-provider mappings, safe/missing/unsafe Connect data, and a controlled broken image.
- Add a dedicated cross-platform Maestro export-guide proof suite and extend the harness so it can
  run that suite without growing or changing the three-journey daily smoke pack.
- Add an exact-SHA, manually dispatched CI proof path that builds release-configuration development
  variants against the real NestJS/Postgres/static-asset boundary on Android and iOS and retains a
  machine-readable evidence summary.
- Add focused production-identity release-build checks which prove direct manual, QR, and iCal
  links fail closed and that the development completion seed is unavailable.
- Add a versioned evidence record and a `(HUMAN: ...)` physical-device procedure for the named
  iPhone, iPad, and low-end Android accessibility matrix. Unexecuted axes remain explicitly
  unverified; repository merge does not manufacture or claim physical-device results.
- Update the Architecture Book testing guidance, the E2E runbook, and changelog for the separate
  exact-head proof lane and evidence contract.

## Capabilities

### New Capabilities

- `export-guide-release-proof`: Defines deterministic integrated fixtures, exact-head release-build
  and deep-link proof, evidence provenance, and the named physical-device result matrix.

### Modified Capabilities

- `mobile-e2e`: Adds an explicitly selected export-guide proof suite and manual exact-SHA workflow
  without changing the daily smoke inventory or its informational cadence.

## Impact

- Affected code: `server/src/e2e/`, test-only seed data, `ci/e2e-server.sh`,
  `mobile/.maestro/`, `mobile/e2e/`, focused mobile guard tests, migration evidence documentation,
  and Architecture Book testing/current-state documentation.
- Sensitive surface: `.github/workflows/` is expected to change for the manually dispatched proof
  lane and receives focused structure tests and reviewer scrutiny.
- No OpenAPI or generated-client change, database migration, dependency, native/store configuration,
  Firebase configuration, deployment infrastructure, Flutter, web behavior, live flag/catalogue
  activation, production/preproduction mutation, or device/store installation is included.
