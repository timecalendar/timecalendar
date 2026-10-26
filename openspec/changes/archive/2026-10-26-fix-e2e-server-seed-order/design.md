## Context

`ci/e2e-server.sh` is the single owner of the e2e server lifecycle (spec `e2e-server-lifecycle`), shared by the mobile Maestro harness and the legacy Flutter harness. Its compose mode ran `up --wait server` and then `compose run --rm server npm run db:init`. Native mode (iOS, Docker-less macOS) already runs `db:init` and then starts `node dist/main`. That ordering used to be harmless because no server component read the database at boot. Since #392, `ExportGuideBootstrapService` publishes the catalogue snapshot from the `school` table in `onApplicationBootstrap`, and `ExportGuideCatalogueStore` loads it once. A boot against an empty schema leaves an empty snapshot for the life of the process.

The feature-flag provider (`DatabaseFeatureFlagProvider`) reads the `feature_flag` table and falls back to the caller's default, which is `false` for `export-guides-v1`. `seed-database.ts` loads every `./**/fixtures/*.yml` through `typeorm-fixtures-cli`, so dropping in a YAML fixture is enough to seed the flag.

## Goals / Non-Goals

**Goals:**
- In compose mode, `up` produces a server that booted against a migrated and seeded schema.
- The seeded state enables every feature flag the mobile onboarding journey needs (`export-guides-v1`).
- Both causes are guarded by gates that run on ordinary pushes, not only by the nightly native lane.

**Non-Goals:**
- Changing `ExportGuideBootstrapService` or `ExportGuideCatalogueStore` (no retry and no lazy reload). Production migrates before boot. Making the server tolerate a pre-migration boot would add runtime behavior only to cover a harness bug.
- Any mobile, UI, Maestro-flow, or OpenAPI change.
- Changing native-mode ordering (already correct).

## Decisions

### D1: Seed-then-serve in compose mode

`up_compose` runs these steps in order:
1. `compose up --wait postgres redis`
2. `compose run --rm $build_flag server npm run db:init`
3. `compose up --wait server`

`$build_flag` is `--build` locally and empty when `E2E_SERVER_IMAGE` is set. It goes on the first command that needs the server image, which is now the `run`. The later `up` reuses that image, so it gets no `--build`.

Alternatives considered:
- *Make the bootstrap retry or reload lazily.* Rejected (see Non-Goals): it changes production behavior to fix a test harness.
- *Leave the order and restart the server after seeding (`compose restart server`).* Rejected: it boots twice, and a boot against an unseeded schema stays possible in between.
- *Rely on `compose run`'s implicit `depends_on` start for Postgres and Redis.* Rejected in favour of the explicit `up --wait postgres redis`. The order is then readable in the script and does not depend on compose's run-dependency semantics.

### D2: Feature-flag fixture is loaded in every environment, not test-only

The fixture is a plain YAML file under `modules/feature-flag/fixtures/`, so dev `db:init` enables `export-guides-v1` too. This is deliberate: without the flag, the mobile app cannot finish onboarding against a local dev server. The test-only `NODE_ENV === "test"` branch in `seed-database.ts` exists for date-relative E2E calendar data. A static flag row does not need it.

### D3: Encode both causes as gates (R-1)

- `ci/test-e2e-server.sh` puts a fake `docker` on `PATH`, records each invocation, runs `ci/e2e-server.sh up` with and without `E2E_SERVER_IMAGE`, and asserts three things: the `db:init` run comes strictly before `up --wait … server`, `--build` appears only on the `db:init` run and only when no image is set, and the base file's `nginx` is never named. The proof is pure shell, following `ci/test-git-hooks.sh`, and runs as a job in `ci-build-deploy.yml`, which runs on every push. This puts it on the PR path, unlike the nightly lane.
- `feature-flag.fixtures.test.ts` loads the YAML with `typeorm-fixtures-cli`'s `Loader` (the same library `seed-database.ts` uses, with no new dependency) and asserts that an item exists with `key === EXPORT_GUIDE_FEATURE_FLAG` and `enabled: true`. If the flag key is renamed, the test fails.

### D4: No Architecture Book rule change

`docs/mobile/architecture-book/testing.md` only says that `ci/e2e-server.sh` owns boot, seed, and teardown, and points to the `e2e-server-lifecycle` spec. It does not describe the order. The spec delta carries the ordering requirement, so no Book rule file changes. The CHANGELOG entry records the rewritten harness docs (`app/integration_test/README.md`, `docs/agent-dev-environment.md`).

## Risks / Trade-offs

- `docker compose run --build` needs Compose v2.13 or later. GitHub `ubuntu-latest` and current Docker Desktop ship newer versions, and CI never takes that path because `E2E_SERVER_IMAGE` is set. → Acceptable.
- Enabling `export-guides-v1` in dev seeds hides the flag-off path from local manual testing. → The flag-off 503 is covered by `export-guide-v1.controller.test.ts`.
- The fake-docker proof checks command order, not real compose behavior. → The nightly lane (green dispatch on this branch) is the end-to-end proof.
