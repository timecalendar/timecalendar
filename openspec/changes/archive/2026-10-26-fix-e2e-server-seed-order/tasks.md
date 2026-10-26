## 1. Compose-mode seed-then-serve order

- [x] 1.1 In `ci/e2e-server.sh` `up_compose`, replace the `up --wait server` → `run db:init` sequence with this order:
  1. `compose up --wait postgres redis`
  2. `compose run --rm $build_flag server npm run db:init` (keep the `SC2086` disable comment on the line that word-splits `build_flag`)
  3. `compose up --wait server`, with no build flag

  Keep the comment that says why `server` is named explicitly (no nginx). Update the inline comments and the script header (Usage/Modes) so they state the seed-then-serve order and why it matters: the server reads the DB at bootstrap. Native mode stays unchanged.
- [x] 1.2 In `server/docker-compose.e2e.yml`, rewrite the healthcheck comment ("the schema is empty until the one-shot seed runs…") to describe the current state: the schema is migrated and seeded before the server starts, and `/health` pings the DB connection.
- [x] 1.3 `bash -n ci/e2e-server.sh` and `shellcheck ci/e2e-server.sh` are clean.

## 2. Seed the export-guide feature flag

- [x] 2.1 Add `server/src/modules/feature-flag/fixtures/feature-flag.fixtures.yml` with `entity: FeatureFlag` and one item, `exportGuidesV1`: `key: export-guides-v1`, `name`, `description`, `enabled: true`. Follow `school/fixtures/school.fixtures.yml` for the format.
- [x] 2.2 Add `server/src/modules/feature-flag/fixtures/feature-flag.fixtures.test.ts`. It loads the YAML with `typeorm-fixtures-cli`'s `Loader` (no new dependency, since `seed-database.ts` already uses it), then asserts that an item has `key === EXPORT_GUIDE_FEATURE_FLAG` (imported from `export-guide.service.ts`) and `enabled === true`. Use a path relative to the test file (`__dirname`), not to the cwd.

## 2b. Serve export-guide assets on the client's first-party origin

- [x] 2b.1 In `server/src/config/environments/test.ts`, set `S3_PUBLIC_BUCKET_CLIENT_URL` to `https://timecalendar-dev-public.fra1.digitaloceanspaces.com` (same as `development.ts`) and rewrite its comment to the current reason (design D4). Leave `EXPORT_GUIDE_ASSET_ORIGINS` in `mobile/` unchanged.
- [x] 2b.2 Add `server/src/config/environments/test-env.test.ts`, asserting that the test and development `S3_PUBLIC_BUCKET_CLIENT_URL` are equal, with a test name that says why.
- [x] 2b.3 `grep -rn "127.0.0.1" server/src server/test` shows no test that depends on the loopback asset origin.
- [x] 2b.4 Amend the `e2e-smoke-flows` onboarding requirement: a school-logo load may resolve DNS; the flow's outcome depends only on the placeholder fallback.

## 3. Ordering gate (R-1)

- [x] 3.1 Add an executable `ci/test-e2e-server.sh`, a pure-shell proof in the style of `ci/test-git-hooks.sh`. It works like this:
  - Put a fake `docker` first on `PATH` that appends each argv line to a log file and exits 0.
  - Run `ci/e2e-server.sh up` twice, once with `E2E_SERVER_IMAGE` unset and once set.
  - Assert the following:
    - the `run --rm … server npm run db:init` line comes strictly before the `up --wait … server` line
    - `postgres redis` are brought up before the `db:init` run
    - `--build` appears only on the `db:init` run, and only when the image is unset
    - `nginx` is never named
  - Clean up: if `server/config/serviceAccountKey.json` did not exist before the test, delete the dummy key it generated. Leave an existing key untouched.
- [x] 3.2 Confirm the gate catches the bug: temporarily revert 1.1 locally and check that `ci/test-e2e-server.sh` fails, then restore.
- [x] 3.3 Wire it into `.github/workflows/ci-build-deploy.yml` as a new pure-shell job (`test-e2e-server`, "Test e2e server lifecycle"), next to `test-hooks`, with no Node setup.

## 4. Architecture Book / docs

- [x] 4.1 Confirm `docs/mobile/architecture-book/testing.md` needs no edit. It delegates the lifecycle to the `e2e-server-lifecycle` spec and documents no boot order, so it gets no CHANGELOG entry (design D5). If the implementer finds any Book or `docs/` text that describes the order as up-then-seed, rewrite it to the current state and add a CHANGELOG entry.

## 5. Verification

- [x] 5.1 `./mobile/e2e/test_ci_mobile_e2e.sh` and `./mobile/e2e/test_run_e2e.sh` pass.
- [x] 5.2 `./ci/test-e2e-server.sh` passes.
- [x] 5.3 In `server/`: `npm run lint` is clean for touched files, and `npx jest src/config src/modules/export-guide src/modules/school src/modules/feature-flag` passes. If the suite needs backing services, start them with `bin/server-compose.sh up -d postgres redis`.
- [ ] 5.4 Optional, if Docker is available locally: `ci/e2e-server.sh up`, then `curl localhost:3005/schools` returns the seeded list and `curl localhost:3005/v1/export-guides` (with the headers the endpoint needs) does not return 503, then `ci/e2e-server.sh down`. Never build Android locally.
- [ ] 5.5 CI proof: a green `gh workflow run ci-mobile-e2e.yml -f ref=fix/mobile-nightly-e2e` on both platforms. The conductor triggers this after the push, not the implementer.
