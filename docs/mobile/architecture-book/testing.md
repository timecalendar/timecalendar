# Testing

The testing rules for `mobile/`. R-1 pointer convention: entries point at the live gate, file, or spec that enforces a rule rather than re-deriving it, and carry only the caveats tooling can't.

## Unit / component harness — `jest-expo`

- **`jest-expo` preset** owns the transform/ignore lists (the RN failure mode the preset exists to prevent — no hand-rolled transform config). `@testing-library/react-native`; tests colocated as `*.test.ts(x)` next to source. `npm test` = `jest --ci`, the same entrypoint locally and in CI (like lint).
- **Mock at the `customFetch` seam, not the network.** Component tests `jest.mock` `src/api/mutator` and drive the *real* generated Orval hook + a real `QueryClient` — the mutator is the designed seam (see Data layer), so mocking there exercises everything above it without a server. `src/features/school-selection/ui/school-picker-screen.test.tsx` is the reference.
- **Coverage** is collected via `npm test -- --coverage`. The `coverageThreshold` is **enforced** — 90% logic / 70% global; see [ADR 003](./decisions/003-coverage-threshold.md). Gated by the `test-mobile` job (R-1).

## E2E — Maestro, real round-trip

- **One flow, real data, deep-linked.** A Maestro flow under `mobile/.maestro/` launches the dev-variant app, opens a `timecalendar-dev://…` deep link, and asserts seeded data renders — proving app → generated client → `customFetch` → NestJS → Postgres end to end, nothing mocked. Flows are shared across platforms (stable seeded-text assertions, no per-platform selectors).
- **Single-command local run:** `mobile/e2e/run_e2e.sh` — lifecycle `up` → `maestro test .maestro/` → lifecycle `down` (teardown on success *and* failure), with `--keep-up` (debug escape hatch) and `--native` (passthrough); exits with Maestro's status. It does **not** build/install the app: a release-config dev-variant binary must already be installed (see `mobile/e2e/README.md`).
- **Shared server lifecycle.** The server half is owned by `ci/e2e-server.sh` (compose-first, `--native` for Docker-less macOS) — the same lifecycle the Flutter harness uses. See the `e2e-server-lifecycle` spec; do not re-hand-roll server boot/seed/teardown in a harness.
- **E2E builds are release-config, no Metro, dev-variant identity.** CI builds on GitHub runners via `expo prebuild` + native tooling (Android: Gradle `assembleRelease` → `adb install`; iOS: `xcodebuild -configuration Release -sdk iphonesimulator` → `simctl install`) — never EAS, never debug+Metro. `EXPO_PUBLIC_API_URL` is baked at build time: `http://10.0.2.2:3005` (Android emulator → host) / `http://localhost:3005` (iOS simulator).

## Dev-variant network exceptions

- **Local-server access rides the `development` variant only**, in `app.config.ts`: Android `usesCleartextTraffic: true` (via `expo-build-properties` — release builds block cleartext HTTP by default, which would silently break the `10.0.2.2` call) and iOS `NSAppTransportSecurity.NSAllowsLocalNetworking` (belt-and-braces over ATS's loopback exemption). **Production identity is untouched — the store app can never talk cleartext.** Verified by `expo config --json` diff between variants; can't be a lint rule (config-shape, not source), hence this prose (R-1).

## CI topology

- `test-mobile` runs gen-drift, tsc, lint, then Jest. `e2e-mobile-android` (ubuntu, KVM emulator, reuses the `build-server` image artifact via `E2E_SERVER_IMAGE`) and `e2e-mobile-ios` (macOS runner, Postgres/Redis provisioned natively because GitHub macOS runners have no Docker — the `--native` seam). Both upload Maestro debug output + server logs on failure (R-1).

### Workflow split + on-demand E2E

Workflows are split by concern; native E2E is **not** run on every push (cold native build + device boot is ~20–30 min/platform — toolchain cost, not app size).
- **`ci-build-deploy.yml`** — server/web images, server tests, deploy (every push; deploy self-gates to main/production).
- **`ci-mobile.yml`** — `test-mobile` (gen-drift, tsc, lint, Jest); path-filtered to `mobile/**` + `openapi/**`.
- **`ci-mobile-e2e.yml`** — `e2e-mobile-android` + `e2e-mobile-ios`, **on-demand**: PRs only with the **`run-e2e` label**, always on main/production when mobile/openapi changed. Self-contained — builds its own server image (`cache-from: type=gha`, a fast hit when `ci-build-deploy` already built that SHA) since artifacts don't cross workflow runs. The Android job inherits the label gate via `needs: build-server`.
- **`ci-flutter.yml`** — legacy `test-app` + Flutter `test-e2e`, demoted to main/production pushes touching `app/**` (R-5 bounded maintenance).
- **Branch-protection caveat:** path-filtered jobs that are skipped don't report a status — if any of these become *required* checks, a skip can block a PR. None are required today.

## Recorded debt — CI E2E caching speedups (not yet done)

Native E2E runs cold every time in CI (local builds are fast only because Gradle/DerivedData/Pods caches persist on disk). Deferred speedups: ① **AVD snapshot caching** for the Android emulator (skip cold boot); ② **iOS DerivedData cache** keyed on the lockfile (point `xcodebuild -derivedDataPath` outside the `prebuild --clean` tree so it survives); ③ confirm the **Gradle build cache** (not just deps) is active. Realistic gain ~Android 28→18 min, iOS 18→10 min on warm caches. Orthogonal to the on-demand split above. **Trigger:** when E2E run time becomes a friction point. Roadmap mirror: `docs/react-native-migration/01-roadmap/01-foundation.md` step 5.
