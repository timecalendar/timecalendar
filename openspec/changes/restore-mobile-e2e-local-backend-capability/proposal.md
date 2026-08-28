## Why

The native Android and iOS E2E jobs build the development app identity and bake the seeded server's local URL, but omit the independent backend-environment capability. Because missing capability values intentionally fail closed to production, both release-config binaries ignore that local URL and cannot complete the seeded calendar import that gates B10.

## What Changes

- Supply `BACKEND_ENVIRONMENT_CAPABILITY=development` to every Android and iOS native E2E prebuild and release-bundle compilation alongside `APP_VARIANT=development` and the platform-correct local `EXPO_PUBLIC_API_URL`.
- Strengthen the focused workflow structure proof so each platform's prebuild and release-build steps must retain the complete three-part development backend contract.
- Update native E2E testing guidance to name the capability as a required build input and record exact-head Android and iOS CI as the terminal proof.
- Preserve the production fail-closed default, current endpoint allowlist, native identities, flow order/retry policy, local server lifecycle, and failure artifacts.
- Exclude application UI or runtime selector changes, API/generated-client changes, server/schema changes, deploy or store configuration, legacy Flutter, and any rerun of an unchanged terminal failure.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: Require both platform release-config development builds to compile an explicit development backend capability with their development identity and platform-local seeded-server URL, backed by focused workflow structure proof and exact-head native CI evidence.

## Impact

- Sensitive CI surface: `.github/workflows/ci-mobile-e2e.yml`.
- Focused proof and documentation: `mobile/e2e/test_ci_mobile_e2e.sh`, `mobile/e2e/README.md`, `docs/mobile/architecture-book/testing.md`, and `docs/agent-dev-environment.md`.
- No OpenAPI contract/generated client, migration, native/store config, deployment, infrastructure, or Flutter surface changes.
