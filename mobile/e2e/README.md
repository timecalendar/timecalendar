# Mobile E2E (Maestro)

End-to-end tests for the mobile app. One [Maestro](https://maestro.mobile.dev/)
flow proves the real round-trip: the app fetches live seeded data from a NestJS
instance and asserts it renders — nothing mocked. Runs on the iOS simulator and
an Android emulator, locally and in CI.

- **Flows:** `mobile/.maestro/*.yaml` (Maestro's convention). Shared across
  platforms — they assert stable seeded text, so no per-platform selectors.
- **Wrapper:** `mobile/e2e/run_e2e.sh` boots the server stack once, runs each
  top-level flow in a fresh Maestro process, and tears the stack down once.
- **Server lifecycle:** owned by `../../ci/e2e-server.sh` (compose-first, shared
  with the Flutter harness). This harness never hand-rolls server boot/seed.

## Prerequisites

- A **release-config dev-variant build installed** on the connected
  simulator/emulator (see "Build & install" below). The wrapper does **not**
  build or install the app — only the server + Maestro.
- **Docker** (for the default compose lifecycle) — except macOS CI, which uses
  `--native`.
- **Maestro 2.8.0** on `PATH` (the same exact version CI installs and prints):
  ```bash
  export MAESTRO_VERSION=2.8.0
  curl -fsSL https://get.maestro.mobile.dev | bash
  export PATH="$HOME/.maestro/bin:$PATH"
  maestro --version
  ```
  Maestro is JVM-based and needs a JDK on `PATH`.
- A booted iOS simulator **or** Android emulator. Maestro auto-detects the
  single running device.
- Android toolchain notes (JDK 17, `ANDROID_HOME`) — see the main
  [`../README.md`](../README.md).

## Build & install the e2e binary

Release config so the JS bundle is embedded (no Metro), `development` variant so
the `timecalendar-dev` scheme and local-server network exceptions apply.
`EXPO_PUBLIC_API_URL` is baked at build time and must match the platform's path
to the host server on port 3005:

```bash
# Android — 10.0.2.2 is the host loopback from the emulator
APP_VARIANT=development EXPO_PUBLIC_API_URL=http://10.0.2.2:3005 \
  npx expo run:android --variant release

# iOS — localhost reaches the host from the simulator
APP_VARIANT=development EXPO_PUBLIC_API_URL=http://localhost:3005 \
  npx expo run:ios --configuration Release
```

## Run

```bash
./e2e/run_e2e.sh              # up once → one process per *.yaml → down once
./e2e/run_e2e.sh --keep-up    # leave the server stack up for debugging
./e2e/run_e2e.sh --native     # Docker-less host: caller provisions Postgres/Redis
./e2e/run_e2e.sh --native --startup-attempts 4 # iOS CI startup recovery
```

The script exits with Maestro's pass/fail status and tears the stack down on
success and failure alike. On failure it dumps the backend log tail. With
`--keep-up` it prints the commands to inspect logs and tear down manually.
`--startup-attempts` accepts 1–4 and defaults to one. A retry is allowed only
for either:

- a fresh booted-iOS-simulator unified-log record, queried from immediately
  before the current Maestro attempt, that attributes `SIGSEGV(11)` to the
  `fr.samuelprak.timecalendar.dev` app process; or
- a pinned 2.8.0 XCTest startup signature with no assertion evidence: either
  first-`launchApp`/`setPermissions` driver-not-listening/connection-refused
  output, or `IOSDriverTimeoutException: iOS driver not ready in time`.

Both classifiers reuse the same per-flow attempt bound and every retry starts a
fresh Maestro process; the server stays up once for the whole run. The simulator
query is saved beside the Maestro output as
`<flow>-attempt-<n>-simulator.log`. Only that current attempt's timestamp-bounded,
app-attributed result is inspected: persistent Maestro logs, prior attempts,
other flows, and other-process crashes cannot authorize a retry. If simulator
inspection is unavailable, fails, or has an unknown shape, classification fails
closed. Ordinary assertion, seeded-data, server, application, and unknown
failures stop immediately, retain their exit status, and prevent later flows
from running.

## Add a flow

1. Drop a `mobile/.maestro/<name>.yaml` in. Start with the app id and the deep
   link, assert on **seeded** data (see
   `server/src/modules/**/fixtures/*.yml` for the deterministic fixtures
   `db:init` loads):
   ```yaml
   appId: fr.samuelprak.timecalendar.dev
   ---
   - launchApp
   - openLink: timecalendar-dev://<route>
   - assertVisible: "<seeded text>"
   ```
2. `run_e2e.sh` discovers every top-level YAML lexically — no manifest wiring
   needed — and gives each one a fresh Maestro process.
3. Keep assertions on stable seeded text (ASCII-safe avoids accent-matching
   fragility across platforms).
4. To assert **real synced calendar data**, start the flow with the shared import
   preamble so the app durably holds the seeded token and syncs it (ADR 030):
   ```yaml
   - runFlow: import-seed.yaml
   ```
   `import-seed.yaml` opens `timecalendar-dev://dev-import?token=e2e-smoke-calendar`,
   which resolves + upserts the token into `user_calendars`, triggers a sync, and
   lands on the calendar. The seeded today-anchored events (`E2E Today Lecture`,
   `E2E Today Seminar`, the `E2E Overlap A/B` pair) then render as real synced
   tiles. Caveat: "today" is computed in **UTC** on the server; on a local run
   whose machine day differs from UTC near midnight the device's local-time
   `isToday` can disagree — a known local edge, not a CI flake (CI is UTC
   end to end).

## CI

`e2e-mobile-android` (Linux + KVM emulator) and `e2e-mobile-ios` (macOS runner,
native Postgres/Redis via `--native`) in
[`../../.github/workflows/ci-mobile-e2e.yml`](../../.github/workflows/ci-mobile-e2e.yml)
build the binary on the runner, install it, and run the flows. Maestro debug
output and server logs upload as artifacts on failure.

Both jobs pin and print Maestro 2.8.0. Android assembles Release with a 3072 MiB
heap, 1024 MiB Metaspace, at most two Gradle workers, and no persistent daemon.
iOS logs the selected Xcode path/version plus available and selected simulator
runtime, name, and UDID before running the harness with four startup attempts.
The shell proofs and workflow assertions run without a device; definitive native
proof is the path-triggered post-merge `main` run on GitHub-hosted runners.

These jobs are **on-demand** (a cold native build + device boot is ~20–30 min
each): add the **`run-e2e` label** to a PR to run them, and they always run on
`main`/`production` when `mobile/**` or `openapi/**` changed.
