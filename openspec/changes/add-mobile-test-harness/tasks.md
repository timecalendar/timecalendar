# Tasks — add-mobile-test-harness

## 1. Jest + RNTL harness (D1)

- [x] 1.1 Add `jest-expo`, `jest`, `@testing-library/react-native` (+ types) to `mobile/` devDependencies; create `jest.config.js` on the `jest-expo` preset; add `"test": "jest --ci"` script
- [x] 1.2 Write a smoke component test proving the harness transforms RN/Expo modules (e.g. render a template component), run `npm test` green
- [x] 1.3 Verify `npx tsc --noEmit` and `npm run lint` stay clean with the new test files (Jest globals/types, lint env for tests)

## 2. Schools round-trip surface (D2)

- [x] 2.1 Read the seed fixtures (`server/src/scripts/seed-database.ts`) and record the exact seeded school names for assertions — fixtures live in `server/src/modules/school/fixtures/school.fixtures.yml`: **"My Gaming Academia"** (`mygamingacademia`) and **"Université Gustave Eiffel"** (`univeiffel`), both `visible: true`. Recorded in `mobile/src/components/schools-screen.test.tsx`.
- [x] 2.2 Create the schools screen: render `useSchoolControllerFindSchools()` results (loading / error / list states), template-quality, file-level `TODO(i18n-step-6)` disable for any literal strings — used the `GET /schools` **query** hook (`useSchoolControllerFindSchools`), not `useSchoolControllerSearchSchools` which is the `POST /schools/search` mutation (no on-mount fetch/loading state). Screen lives in `mobile/src/components/schools-screen.tsx`; `mobile/src/app/schools.tsx` is a thin re-export entrypoint (Expo Router bundles **every** file under `src/app/` as a route — a colocated route test poisons the Metro bundle — and the `routes-not-importable` lint forbids importing a route from elsewhere, so route screens must be thin entrypoints over a tested `@/components` module).
- [x] 2.3 Component test for the schools screen (`mobile/src/components/schools-screen.test.tsx`): `jest.mock` of `src/api/mutator`, real generated hook + QueryClient, asserts seeded-shape data renders (spec: mobile-test-harness)
- [x] 2.4 Verify the deep link `timecalendar-dev://schools` opens the screen on the dev variant (manual, simulator or emulator) — **verified on the iOS simulator** (iPhone 17 Pro, dev-client + Metro). **Caught a real defect:** a sibling route under the root `NativeTabs` layout is *not* reachable by deep link (only declared `NativeTabs.Trigger` routes are; `/explore` navigated, `/schools` did not). Fixed by restructuring to a root `Stack` (`src/app/_layout.tsx`) with the tabs in a `(tabs)` group (`src/app/(tabs)/{_layout,index,explore}.tsx`) and `schools` as a stack route. After the fix the deep link opens the screen; the live loading→error transition through the real query layer was observed (error, not seeded data, because there's no local seeded server yet — PR 3/5 / asserted by PR 4's Maestro flow).

## 3. Shared compose-first server lifecycle (D3)

- [x] 3.1 Create `server/docker-compose.e2e.yml` overlay: `server` service (`build: server/`, `image: ${E2E_SERVER_IMAGE:-timecalendar-server-e2e}`), `NODE_ENV=test`, port 3005, dummy-key mount, `/health` healthcheck (verify curl exists in `node:24`; fallback `node -e "fetch(...)"`), `depends_on` postgres/redis `service_healthy` — used the `node -e fetch(...)` healthcheck (node:24 ships global fetch; no curl dependency). The service env overrides `DATABASE_HOST=postgres`/`DATABASE_PORT=5432`/`REDIS_URL=redis://redis:6379` — the test-env defaults (localhost:37291/127.0.0.1:37292) target *host* ports and only fit native mode.
- [x] 3.2 Create `ci/e2e-server.sh` with `up` / `down` / `logs`: key generation via `ci/generate-dummy-firebase-key.sh`, `docker compose up --wait --build`, one-shot seed `compose run --rm server npm run db:init`, `compose down` — `--build` is omitted when `E2E_SERVER_IMAGE` is set so CI reuses the prebuilt artifact without rebuilding.
- [x] 3.3 Add `--native` mode (D4): expects Postgres/Redis reachable, same seed + key + env, server from source as background process with pid file, `/health` wait, `down --native` kills the pid — native mode leaves `DATABASE_*` unset so test-env defaults (host ports) apply; seed/key/env/port/health are single-sourced, only provisioning differs.
- [x] 3.4 Local verification: `up` → `GET http://localhost:3005/schools` returns seeded set → `down` leaves nothing running; repeat `up` is reproducible (spec: e2e-server-lifecycle) — verified locally with Docker 28.4 / Compose 2.39: `up` built the image, came up healthy, seeded; `/schools` returned exactly `["My Gaming Academia","Université Gustave Eiffel"]`; a repeat `up` stayed at 2 schools; `down` removed all containers + network and port 3005 refused connections.

## 4. Flutter harness delegation (D8, spec: e2e-smoke-harness)

- [x] 4.1 Refactor `app/integration_test/run_e2e.sh`: replace the server half (compose up, seed, key, setsid boot, polling, log files, teardown) with `ci/e2e-server.sh up/down/logs`; keep device resolution, per-flow loop, `--keep-up`, and result reporting — the script dropped from ~235 to ~165 lines; preflight no longer needs curl/openssl (the lifecycle owns them); teardown is now `e2e-server.sh down` and failure dumps `e2e-server.sh logs`.
- [x] 4.2 Update `app/integration_test/README.md` for the new server-lifecycle wiring — "What it does" now describes the shared lifecycle; prerequisites, the PORT/SMTP/dummy-key/Postgres-Redis key facts, and the step references updated.
- [x] 4.3 Run the Flutter harness locally end to end (or rely on the `test-e2e` CI job on the branch) to prove no regression — ran on a live Android emulator: the refactored `run_e2e.sh` booted the server via `ci/e2e-server.sh up` (seeded 2 schools + e2e calendar, healthy), resolved the emulator, reached the per-flow loop, and tore down via `ci/e2e-server.sh down`. The flows themselves hit a **pre-existing macOS gap** — `timeout` isn't on macOS (the unchanged flow loop uses it; CI/Linux has it, which is why the README calls CI the canonical green run), not a refactor regression. Confirmed the real round-trip separately by running `onboarding_flow_test.dart` directly (no `timeout` wrapper) against the lifecycle — it drives `GET /schools` and asserts the seeded school renders. Also scoped `up` to the `server` service so the base file's nginx (port 1443 + certs) no longer starts.

## 5. E2E build configuration (D5, D6)

- [ ] 5.1 `app.config.ts`: when `APP_VARIANT=development`, set Android `usesCleartextTraffic: true` (expo-build-properties) and iOS `NSAppTransportSecurity.NSAllowsLocalNetworking`; confirm production variant output unchanged (`expo config` diff)
- [ ] 5.2 Build a release-config dev-variant binary per platform locally (`expo run:android --variant release`, `expo run:ios --configuration Release`) with the platform-correct `EXPO_PUBLIC_API_URL`; verify the app reaches the harness server without Metro

## 6. Maestro flows + wrapper (D7)

- [ ] 6.1 Install Maestro locally; create `mobile/.maestro/schools.yaml`: launch dev-variant app → `openLink: timecalendar-dev://schools` → assert a seeded school name visible
- [ ] 6.2 Create `mobile/e2e/run_e2e.sh`: lifecycle `up` → `maestro test .maestro/` → lifecycle `down`, with `--keep-up` passthrough and non-zero exit on flow failure
- [ ] 6.3 Run the flow green locally on the iOS simulator
- [ ] 6.4 Run the flow green locally on an Android emulator (JAVA_HOME→JDK 17, ANDROID_HOME per local toolchain notes)

## 7. CI (D8)

- [x] 7.1 `test-mobile` job: add the Jest step (`npm test` + coverage reporting) after lint
- [ ] 7.2 New `e2e-mobile-android` job: `needs: build-server`, load image artifact + `E2E_SERVER_IMAGE`, KVM + `reactivecircus/android-emulator-runner`, `expo prebuild` + `gradlew :app:assembleRelease` (Gradle cache), `adb install`, Maestro install (setup-java + documented installer), run flows
- [ ] 7.3 New `e2e-mobile-ios` job: macOS runner, provision Postgres/Redis natively (pick cheapest: preinstalled service vs brew vs action), `e2e-server.sh up --native`, `expo prebuild` + `xcodebuild -configuration Release -sdk iphonesimulator` (CocoaPods/DerivedData cache), `simctl install`, run flows
- [ ] 7.4 Both e2e jobs: upload Maestro debug artifacts + server logs on failure; set sane timeouts
- [ ] 7.5 Push the branch and iterate until `test-mobile`, `e2e-mobile-android`, `e2e-mobile-ios`, and the existing `test-e2e` (Flutter regression proof) are all green

## 8. Documentation (R-1 pointers, K-3 debt)

- [ ] 8.1 Architecture Book (`.claude/rules/mobile/architecture.md`): add the Testing section — harness shape (jest-expo, mutator-seam mocking, Maestro layout), shared lifecycle pointer, dev-variant network exceptions, explicit K-3 deferral with trigger
- [ ] 8.2 Brief `mobile/e2e/README.md` (or section in mobile README): how to run e2e locally, prerequisites, `--keep-up`, how to add a flow
