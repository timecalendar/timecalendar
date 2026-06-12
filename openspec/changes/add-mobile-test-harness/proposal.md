# Test harness for mobile: Jest + RNTL, Maestro e2e on iOS and Android

## Why

`mobile/` has **no tests at all** — no Jest, no test script, no e2e. Foundation step 5 requires the full test harness wired and green in CI before any feature exists (R-6 makes it a gate for everything after it): Jest + RNTL for unit/component tests, and **Maestro e2e green on iOS *and* Android, locally and in CI, against a real NestJS server instance** — proving the app ↔ server contract end to end, not against mocks. The existing Flutter e2e harness already solved the server half, but as hand-rolled bash (process-group management, polling loops, log juggling); extracting it for reuse is the opportunity to replace it with the idiomatic tool — Docker Compose owns the lifecycle.

## What Changes

- **Jest + RNTL** via the `jest-expo` preset; `npm test` in `mobile/`; first real component test(s); coverage reporting on. **K-3 coverage thresholds are deliberately deferred** to the first logic-bearing feature (Settings) — recorded as explicit debt with its trigger, per K-3's own cargo-cult revisit clause.
- **Shared compose-first e2e server lifecycle**: the NestJS server becomes a compose service (e2e overlay on `server/docker-compose.yml`) with a `/health` healthcheck and `depends_on: postgres/redis (service_healthy)`. Boot = `docker compose up --wait`, seed = one-shot `compose run` of `db:init`, teardown = `compose down`, logs = `compose logs`. The shared script (in `ci/`) replaces the hand-rolled `setsid`/PGID-kill/readiness-poll bash; locally it builds the server image from source, in CI it points at the already-built image artifact.
- **Flutter harness refactored, flows untouched**: `app/integration_test/run_e2e.sh` delegates its server half to the shared lifecycle; the per-flow `flutter test` loop and the flows themselves don't change. The existing `test-e2e` CI job proves no regression.
- **Maestro e2e for mobile** with a **real-round-trip flow**: the app performs a real `GET /schools` against the harness server and the flow asserts seeded data renders — on the iOS simulator and an Android emulator, locally and in CI.
- **A minimal schools screen** in `mobile/` — the first real consumer of the generated Orval client + mounted QueryClient — giving the flow real data to assert. (Template-screen quality; dies when real onboarding lands.)
- **Dev-variant local-server access**: Android cleartext-HTTP and iOS local-networking exceptions enabled **on the `development` app variant only** (production identity untouched), so release-mode e2e builds can reach `http://10.0.2.2`/`http://localhost`.
- **CI**: `test-mobile` gains the Jest step; new Maestro e2e jobs — Android on `ubuntu-latest` (KVM emulator, reuses the `build-server` image artifact) and iOS on a macOS runner (free for this public repo). Known compromise: GitHub macOS runners may not support Docker — the iOS job then runs Postgres/Redis/server natively via the lifecycle script's seam (verified during implementation).
- **Architecture Book updated**: a Testing section recording the harness shape, the K-3 deferral, and pointers to the enforcing CI gates (R-1).

## Capabilities

### New Capabilities

- `mobile-test-harness`: Jest + RNTL unit/component testing for `mobile/` — preset, test location/conventions, coverage reporting, K-3 deferral, CI gate.
- `mobile-e2e`: Maestro end-to-end testing for `mobile/` — real-server round-trip flow, both platforms, local single-command run, CI jobs, e2e build configuration.
- `e2e-server-lifecycle`: the shared compose-first server lifecycle (boot/seed/health/teardown, dummy Firebase key, image-vs-build seam) consumed by every e2e harness in the repo.

### Modified Capabilities

- `e2e-smoke-harness`: the Flutter harness's server-orchestration requirements change — the backend runs as a compose-managed service via the shared lifecycle instead of a host `npm run start` process managed by `run_e2e.sh` itself (single-command UX, flows, and CI job unchanged).

## Impact

- `mobile/`: Jest config + devDependencies, `npm test` script, first tests, Maestro flows + e2e wrapper, minimal schools screen, `app.config.ts` dev-variant network exceptions.
- `server/`: compose e2e overlay (server service + `/health` healthcheck); no server source changes expected (`/health` already exists).
- `ci/`: new shared e2e-server lifecycle script (joins `wait.sh`, `generate-dummy-firebase-key.sh`).
- `app/integration_test/run_e2e.sh`: server half replaced by the shared lifecycle.
- `.github/workflows/build.yaml`: Jest step in `test-mobile`; new Android + iOS Maestro jobs.
- `.claude/rules/mobile/architecture.md`: Testing section added.
