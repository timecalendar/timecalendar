# Mobile E2E (Maestro)

End-to-end tests for the mobile app. One [Maestro](https://maestro.mobile.dev/)
flow proves the real round-trip: the app fetches live seeded data from a NestJS
instance and asserts it renders — nothing mocked. Runs on the iOS simulator and
an Android emulator, locally and in CI.

- **Flows:** `mobile/.maestro/*.yaml` (Maestro's convention). Shared across
  platforms — they assert stable seeded text, so no per-platform selectors.
- **Wrapper:** `mobile/e2e/run_e2e.sh` boots the server stack, runs the flows,
  and tears it down.
- **Server lifecycle:** owned by `../../ci/e2e-server.sh` (compose-first, shared
  with the Flutter harness). This harness never hand-rolls server boot/seed.

## Prerequisites

- A **release-config dev-variant build installed** on the connected
  simulator/emulator (see "Build & install" below). The wrapper does **not**
  build or install the app — only the server + Maestro.
- **Docker** (for the default compose lifecycle) — except macOS CI, which uses
  `--native`.
- **Maestro** on `PATH`:
  ```bash
  curl -fsSL https://get.maestro.mobile.dev | bash
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
./e2e/run_e2e.sh              # up → maestro test .maestro/ → down
./e2e/run_e2e.sh --keep-up    # leave the server stack up for debugging
./e2e/run_e2e.sh --native     # Docker-less host: caller provisions Postgres/Redis
```

The script exits with Maestro's pass/fail status and tears the stack down on
success and failure alike. On failure it dumps the backend log tail. With
`--keep-up` it prints the commands to inspect logs and tear down manually.

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
2. `run_e2e.sh` runs the whole `.maestro/` directory — no wiring needed.
3. Keep assertions on stable seeded text (ASCII-safe avoids accent-matching
   fragility across platforms).

## CI

`e2e-mobile-android` (Linux + KVM emulator) and `e2e-mobile-ios` (macOS runner,
native Postgres/Redis via `--native`) in
[`../../.github/workflows/ci-mobile-e2e.yml`](../../.github/workflows/ci-mobile-e2e.yml)
build the binary on the runner, install it, and run the flows. Maestro debug
output and server logs upload as artifacts on failure.

These jobs are **on-demand** (a cold native build + device boot is ~20–30 min
each): add the **`run-e2e` label** to a PR to run them, and they always run on
`main`/`production` when `mobile/**` or `openapi/**` changed.
