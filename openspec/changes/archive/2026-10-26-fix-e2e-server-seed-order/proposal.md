## Why

The nightly native Maestro lane (`.github/workflows/ci-mobile-e2e.yml`) has failed on every non-skipped run since 2026-09-13; the last full green was dispatch 34393363774 on 2026-09-09. The export-guide feature (#392, 0200d3b8) caused it, and it has three independent causes in the shared e2e server harness. The app is correct in all three. The harness hands it a server that has not been seeded:

1. **Compose mode (Android, and the Flutter harness):** `ci/e2e-server.sh up_compose` boots the server with `compose up --wait server` *before* it runs `db:init`. `ExportGuideBootstrapService.onApplicationBootstrap` reads the `school` table while the schema is still empty. It gets Postgres `42P01` and returns without loading anything, so `ExportGuideCatalogueStore` keeps an empty snapshot for the life of the process. After that, every `GET /schools` throws `Export-guide snapshot unavailable`, the app shows "Could not load schools", and the flow fails on `Assert "My Gaming Academia" is visible`.
2. **Both platforms:** `GET /v1/export-guides` is behind the `export-guides-v1` feature flag. The flag defaults to `false`, which returns 503. No fixture seeds the flag, so the onboarding export guide never loads ("We couldn't load the export guide") and the flow fails on `Assert id: onboarding-connect-continue is visible`.
3. **Both platforms:** `server/src/config/environments/test.ts` sets `S3_PUBLIC_BUCKET_CLIENT_URL` to `https://127.0.0.1`, so every export-guide image URL in the catalogue uses that origin. The dev-variant mobile parser accepts images only on the exact first-party origin it compiles (`EXPORT_GUIDE_ASSET_ORIGINS`, the dev bucket), as both `mobile-export-guide-data` and `server-export-guide-catalogue` require. It rejects the mandatory `generic` provider (`invalid_generic`), so the guide still shows "We couldn't load the export guide" with the flag on.

Production runs migrations before boot, so the bootstrap behaves correctly there. The bug is the harness boot order plus a missing fixture.

## What Changes

- `ci/e2e-server.sh` compose mode runs in seed-then-serve order. It brings up Postgres and Redis, runs the one-shot `db:init` (with `--build` on the local build path), and only then runs `compose up --wait server`. This matches native mode, which already seeds before boot. The script header documents the boot order.
- The healthcheck comment in `server/docker-compose.e2e.yml` changes to say the schema is seeded before the server starts.
- New fixture `server/src/modules/feature-flag/fixtures/feature-flag.fixtures.yml` enables `export-guides-v1`. Every `db:init` loads it (test and dev), because the mobile app needs the guide to finish onboarding.
- `test.ts` sets `S3_PUBLIC_BUCKET_CLIENT_URL` to the dev bucket origin `https://timecalendar-dev-public.fra1.digitaloceanspaces.com`, the same value as `development.ts` and the origin the dev-variant client compiles. The mobile allow-list is unchanged.
- Regression gates (R-1): an emulator-free fake-`docker` proof `ci/test-e2e-server.sh` (wired into `ci-build-deploy.yml`) checks the compose order and the build-flag placement. A server unit test checks that the feature-flag fixture enables `EXPORT_GUIDE_FEATURE_FLAG`. A server unit test (`test-env.test.ts`) checks that the test-env asset origin equals the development one.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `e2e-server-lifecycle`: in compose mode `up` seeds before the server process starts, with an enforced ordering proof. The seeded state includes every feature flag the mobile onboarding journey needs, and the test environment serves export-guide assets on the client's first-party origin.
- `e2e-smoke-flows`: the Flutter onboarding flow tolerates a school-logo load that needs DNS; its outcome depends only on the placeholder fallback.

## Impact

- `ci/e2e-server.sh`, `server/docker-compose.e2e.yml`, new `ci/test-e2e-server.sh`, `.github/workflows/ci-build-deploy.yml` (one new pure-shell job).
- `server/src/modules/feature-flag/fixtures/` (new YAML fixture plus its unit test). Dev `db:init` now enables `export-guides-v1` too.
- `server/src/config/environments/test.ts` (asset origin) plus `test-env.test.ts`. Seeded school logo URLs in the test env point at the dev bucket instead of an unreachable loopback.
- No change to server runtime behavior, mobile app, UI, Maestro flows, OpenAPI, migrations, or production configuration. Native mode keeps its current order.
