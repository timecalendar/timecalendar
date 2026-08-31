## Why

Native Android and iOS E2E builds currently compile the development app identity and platform-local API URL without the independent development backend capability. Because missing capability fails closed to production, fresh storage selects the production backend and the seeded dev-import flow cannot reach the CI server.

## What Changes

- Give both native E2E jobs an explicit `development` backend capability for every Expo-config evaluation involved in prebuild and release compilation.
- Extend the deterministic E2E workflow regression gate to prove both jobs retain the capability and resolve development app config while production remains fail-closed.
- Update the mobile testing architecture reference and Architecture Book changelog to record the complete release-config E2E build contract.
- Require exact-head Android and iOS native E2E proof that seeded dev-import succeeds through each platform-local server URL.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: Require release-config native E2E builds to compile with the explicit development backend capability as well as the development identity and platform-local URL.

## Impact

- Affected areas: `.github/workflows/ci-mobile-e2e.yml`, `mobile/e2e/test_ci_mobile_e2e.sh`, `docs/mobile/architecture-book/testing.md`, and `docs/mobile/architecture-book/CHANGELOG.md`.
- Sensitive surface: `.github/workflows/ci-mobile-e2e.yml` changes CI/native build configuration. Review must confirm the capability is scoped only to the development E2E jobs and cannot weaken the production dev-import boundary.
- No product onboarding behavior, `mobile/app.config.ts` default, production/preview profile, API/OpenAPI contract, generated client, dependency, database schema/migration, deployment configuration, Firebase file, secret, or legacy Flutter change is expected.
