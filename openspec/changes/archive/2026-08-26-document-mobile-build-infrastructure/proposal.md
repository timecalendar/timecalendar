## Why

TimeCalendar needs a durable recommendation for using its always-on Mac Mini without making a
single home machine, persistent caches, or local credentials a release risk. The decision must also
cover exact-commit internal builds, faster native E2E, agent-driven QA evidence, and the React Native
4.0 beta/production path before any infrastructure is implemented.

## What Changes

- Add a seven-document build-infrastructure recommendation pack alongside the mobile OTA docs.
- Define a hybrid architecture that keeps hosted GitHub Actions as the control plane, limits the Mac
  Mini to trusted iOS E2E work, and keeps signed binaries on EAS Build.
- Define exact-SHA workflow contracts for E2E, internal distribution, beta, and production releases.
- Document cache boundaries, persistent-runner security, hosted fallback, operational ownership,
  success metrics, and a phased adoption plan.
- Keep the change documentation-only: no runner, workflow, EAS profile, credential, store, native
  project, or application configuration is implemented.

## Capabilities

### New Capabilities

- `mobile-build-infrastructure-guidance`: The decision record and operating contracts for trusted
  native builds, persistent-runner E2E, caching, signed distribution, and staged adoption.

### Modified Capabilities

None.

## Impact

- Adds `docs/mobile/build-infrastructure/` and links it from `docs/mobile/ota/README.md`.
- Establishes requirements for future work touching GitHub Actions, a private orchestration
  repository, the Mac Mini runner, EAS Build/Submit/Workflows, TestFlight, Play testing tracks, and
  build evidence.
- Does not change runtime code, CI configuration, mobile configuration, generated files,
  credentials, or external infrastructure.
