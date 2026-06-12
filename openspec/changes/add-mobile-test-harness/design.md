# Design — add-mobile-test-harness

## Context

Foundation step 5. `mobile/` (Expo SDK 56, RN 0.85, New Arch + Hermes, expo-dev-client, Expo Router) has typecheck + lint CI gates but zero tests. The Flutter app already has a working e2e harness (`app/integration_test/run_e2e.sh`) whose server half — compose up Postgres/Redis, seed `timecalendar_test`, dummy Firebase key, boot NestJS, poll readiness, tear down — is hand-rolled bash with `setsid` process-group management. The server already exposes `GET /health` and has a Dockerfile; the CI `build-server` job already produces a loadable image artifact; `postgres`/`redis` already carry compose healthchecks.

User-set constraints for this step (decided during scoping):
- E2E must prove a **real round-trip** — the app fetches real seeded data from a live NestJS instance, locally **and** in CI, on **both** platforms.
- CI binaries are built **on GitHub runners** (public repo → free macOS), not EAS (step 11) and not debug+Metro.
- The server lifecycle is **extracted and rewritten compose-first** — deliberately replacing the inherited bash with Docker-native idioms, shared with the Flutter harness.
- K-3 coverage thresholds are **deferred** to the first logic-bearing feature.
- Prefer idiomatic/DRY over custom config, accepting compromises where platform limits force them.

Verified platform limit: **GitHub-hosted macOS runners do not support Docker** (no nested virtualization on Apple Silicon; [runner docs](https://docs.github.com/en/actions/concepts/runners/github-hosted-runners), [community discussion](https://github.com/orgs/community/discussions/179684)). The iOS e2e job cannot use compose.

## Goals / Non-Goals

**Goals:**
- `npm test` green in `mobile/` (Jest + RNTL via `jest-expo`), wired into the `test-mobile` CI job, with coverage reporting on.
- One Maestro flow proving app → NestJS → Postgres round-trip (seeded schools render), green locally and in CI on iOS simulator + Android emulator.
- One shared server lifecycle (`ci/`), compose-first, consumed by both the Flutter harness and the new mobile harness.
- The Flutter e2e keeps working unchanged from the caller's perspective (`run_e2e.sh [--keep-up]`, same CI job).

**Non-Goals:**
- K-3 `coverageThreshold` enforcement (deferred; recorded debt — lands with Settings).
- EAS anything (step 11), i18n wiring (step 6), the real splash screen (step 13).
- More than one mobile e2e flow; Reassure/perf baselines; device farms / Maestro Cloud (can't reach a localhost server, and adds a paid dependency).
- Migrating Flutter *flows* — only the server half of its harness moves.

## Decisions

### D1 — Unit harness: `jest-expo` preset, RNTL, colocated tests
`jest.config.js` with the `jest-expo` preset (Expo's maintained preset owns the transform/ignore lists that otherwise rot), `@testing-library/react-native`, tests colocated as `*.test.ts(x)` next to source. `npm test` = `jest --ci` locally and in CI — same entrypoint, like lint. Coverage reporting (`--coverage` in CI) on from day one so the K-3 gate has a baseline to land on; **no `coverageThreshold`** yet (K-3 debt, trigger: first feature with logic paths). First real test: the schools screen renders seeded-shape data with the query layer mocked at the `customFetch` seam (`jest.mock` of `src/api/mutator`) — the mutator is the designed seam, so mocking there tests everything above it without network.
*Alternative rejected:* hand-rolled Jest transform config (the usual RN failure mode `jest-expo` exists to prevent).

### D2 — The round-trip surface: a minimal `schools` route, deep-link launched
New route `mobile/src/app/schools.tsx` rendering `useSchoolControllerSearchSchools()` results — the first real consumer of the generated Orval client and the mounted QueryClient. The Maestro flow launches the app, opens `timecalendar-dev://schools` (`openLink`), and asserts a seeded school's name is visible. Deep-linking avoids touching the template home screen and needs no test-only UI chrome; the route is template-quality and dies when real onboarding lands (like the existing template screens). User-facing strings get the same file-level `TODO(i18n-step-6)` disable as the other template files.
*Alternatives rejected:* asserting only the splash (boots the server but proves nothing about it — fails the round-trip DoD); replacing the home screen content (couples this step to step 13's real splash/home work).

### D3 — Shared lifecycle: compose-first, `ci/e2e-server.sh`
A compose overlay `server/docker-compose.e2e.yml` adds a `server` service: `build: server/` with `image: ${E2E_SERVER_IMAGE:-timecalendar-server-e2e}` (locally it builds from source, layer-cached; CI overrides `E2E_SERVER_IMAGE` to the `build-server` artifact image — no rebuild), `NODE_ENV=test`, port `3005`, a `/health` healthcheck, `depends_on` postgres/redis with `condition: service_healthy`, and the dummy Firebase key mounted read-only. `ci/e2e-server.sh` (joining `wait.sh` and `generate-dummy-firebase-key.sh`) exposes `up` / `down` / `logs`:
- `up` = generate key if absent → `docker compose up --wait --build` → one-shot seed `docker compose run --rm server npm run db:init`.
- `down` = `docker compose down`. `logs` = `docker compose logs server`.

Everything the old bash hand-rolled — readiness polling, process-group kills, log capture, orphan cleanup — becomes Docker's job. Port stays **3005** (the Flutter harness's value; both emulator network paths already assume it).
*Alternative rejected:* polishing the from-source bash (keeps the inherent process-management complexity; the user explicitly chose the rewrite).

### D4 — The macOS CI exception: a `--native` seam, not a second harness
Because macOS runners have no Docker (verified above), `e2e-server.sh up --native` skips compose: it expects Postgres/Redis already reachable on the standard ports (provisioned by workflow steps — the runner image's PostgreSQL or `brew`), then runs the *same* seed → key → boot → health-wait sequence with the server as a background `npm run start` process (pid-file, `kill` on `down`). Seed command, key generation, env, port, and health endpoint stay single-sourced in the script; **only service provisioning differs**, and only on macOS CI. Ephemeral runners make teardown best-effort there.
*Alternatives rejected:* colima/Docker-on-macOS hacks (unsupported, slow, flaky); skipping iOS e2e in CI (fails the DoD); a self-hosted mac runner (a whole project).

### D5 — E2E binaries: release-config dev-variant builds on runners
CI builds with `expo prebuild` + native tooling — Android: `./gradlew :app:assembleRelease` → `adb install`; iOS: `xcodebuild -configuration Release -sdk iphonesimulator` → `xcrun simctl install`. Release config means the JS bundle is embedded — **no Metro in CI**. The builds use `APP_VARIANT=development` (the `.dev` identity and `timecalendar-dev` scheme — same app the deep link targets, coexists with anything else installed). `EXPO_PUBLIC_API_URL` is baked at build time: `http://10.0.2.2:3005` (Android) / `http://localhost:3005` (iOS). Gradle/CocoaPods/DerivedData cached via standard actions. Locally, `expo run:<platform> --variant release` produces the equivalent binary through the same prebuild.
*Alternatives rejected:* EAS Build (step 11, paid queue in CI, 15-iOS-builds/month free cap burns in days); debug+Metro (a live bundler is a CI flakiness source and unrepresentative).

### D6 — Local-server network exceptions ride the `development` variant
`app.config.ts`, only when `APP_VARIANT=development`: Android `usesCleartextTraffic: true` (via `expo-build-properties` — release builds block cleartext HTTP by default, which would silently break the `10.0.2.2` call), iOS `NSAppTransportSecurity.NSAllowsLocalNetworking` (belt-and-braces; ATS's loopback behavior is verified at implementation). Production variant is untouched — the store identity can never talk cleartext.
*Alternative rejected:* a third `e2e` app variant (more identity surface, another Firebase registration later, for zero benefit over the dev variant devs already use against local servers).

### D7 — Maestro flows in `mobile/.maestro/`, one wrapper script
Flows live at `mobile/.maestro/` (Maestro's convention), shared YAML across platforms (text assertions on seeded data; no per-platform selectors needed). `mobile/e2e/run_e2e.sh` is a thin wrapper: lifecycle `up` → `maestro test .maestro/` → lifecycle `down` (`--keep-up` passthrough like the Flutter harness). CI installs Maestro via its documented installer (`get.maestro.mobile.dev`) plus `setup-java` (Maestro is JVM-based). On failure, Maestro's debug artifacts (screenshots/logs) and `e2e-server.sh logs` upload as workflow artifacts.

### D8 — CI topology: two new jobs, Flutter job refactor-proven
- `e2e-mobile-android`: `ubuntu-latest`, `needs: build-server` (loads the image artifact, `E2E_SERVER_IMAGE` override), KVM + `reactivecircus/android-emulator-runner` (the `test-e2e` job's proven recipe), Gradle-built APK, Maestro.
- `e2e-mobile-ios`: `macos-latest`, native services per D4, xcodebuild simulator app, Maestro.
- `test-mobile` gains the Jest step (after lint).
- `test-e2e` (Flutter) is **not** restructured — `app/integration_test/run_e2e.sh` internally delegates its server half to `ci/e2e-server.sh`; the job passing is the regression proof for the refactor.
Jobs run on every push (repo convention — no path filters anywhere; consistency wins until CI minutes hurt).

## Risks / Trade-offs

- **[macOS native-services drift vs compose]** → Only provisioning diverges; seed/key/boot/health stay single-sourced in `e2e-server.sh`. Revisit when GitHub ships nested-virt runners (M3+ hardware supports it).
- **[iOS xcodebuild time on macOS runners (~20–40 min cold)]** → CocoaPods + DerivedData caching; generous job timeout; accepted as the price of free runners over EAS.
- **[Local server iteration now needs an image rebuild]** → Layer-cached (`COPY package*.json` before `COPY . .`); e2e rarely co-iterates server code; accepted in scoping.
- **[Maestro flakiness on emulators]** → Assert on stable seeded text; Maestro's built-in waits; debug artifacts uploaded on failure; flow kept to one screen.
- **[Flutter harness regression from the refactor]** → Behavior-preserving seam (same port, same seed, same key path, `--keep-up` kept); existing `test-e2e` job gates it.
- **[Cleartext/ATS assumptions]** → D6 encodes both exceptions explicitly on the dev variant; verified on both platforms during implementation (first local Maestro run is the test).
- **[`node:24` image lacking curl for the healthcheck]** → Verify at implementation; fallback `node -e "fetch(...)"` healthcheck command.

## Migration Plan

Additive throughout; no deploy surface. Order: Jest harness → schools route (+component test) → compose overlay + `ci/e2e-server.sh` → Flutter harness delegation (prove via `test-e2e`) → local Maestro on both platforms → CI jobs → Architecture Book. Rollback = revert; the only shared-file risk is `run_e2e.sh`, restorable independently.

## Open Questions

- macOS runner Postgres provisioning: preinstalled service vs `brew` vs setup action — pick whichever the current `macos-latest` image makes cheapest at implementation time.
- Whether ATS already exempts loopback on iOS (D6 ships the exception regardless; question only affects whether it's load-bearing).
- Exact seeded school fixture names for the Maestro assertion (read from the seed script at implementation).
