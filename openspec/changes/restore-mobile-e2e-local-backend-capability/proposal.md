## Why

The native Android and iOS E2E jobs build the development app identity and bake the seeded server's local URL, but omit the independent backend-environment capability. Because missing capability values intentionally fail closed to production, both release-config binaries ignore that local URL and cannot complete the seeded calendar import that gates B10.

Exact-head run [33162979890](https://github.com/timecalendar/timecalendar/actions/runs/33162979890) proved the routing repair: both platforms show `TEST ENVIRONMENT · Local`, complete `import-seed.yaml`, and render the real seeded events. Both then fail terminally on the very next step — `tapOn: id: "calendar-view-agenda"`, a segmented-control selector removed in `a45b9a5` when the calendar header moved to native chrome. The shared calendar-family flows still carry four references to it, so the seeded round trip they exist to prove can never complete.

## What Changes

- Supply `BACKEND_ENVIRONMENT_CAPABILITY=development` to every Android and iOS native E2E prebuild and release-bundle compilation alongside `APP_VARIANT=development` and the platform-correct local `EXPO_PUBLIC_API_URL`.
- Strengthen the focused workflow structure proof so each platform's prebuild and release-build steps must retain the complete three-part development backend contract.
- Replace all four obsolete `calendar-view-agenda` references in `mobile/.maestro/calendar.yaml` and `mobile/.maestro/hidden-events.yaml` with the current cross-platform calendar-view control contract: open the `calendar-view` header control, choose the locale-stable "Agenda" entry, and assert the agenda list itself rendered.
- Add a baseline-gate proof that every literal selector id used by a Maestro flow still exists as a `testID` in `mobile/src`, so a UI rework can no longer strand a flow selector until an expensive native run discovers it.
- Update native E2E testing guidance to name the capability as a required build input, name the selector-drift guard, and record exact-head Android and iOS CI as the terminal proof.
- Preserve the production fail-closed default, current endpoint allowlist, native identities, application UI/behaviour, flow order/retry policy, seeded-data assertions, local server lifecycle, and failure artifacts.
- Exclude API/generated-client changes, server/schema changes, deploy or store configuration, legacy Flutter, and any rerun of an unchanged terminal failure.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: Require both platform release-config development builds to compile an explicit development backend capability with their development identity and platform-local seeded-server URL; require the shared calendar-family flows to reach the agenda surface through the current calendar-view control; and require flow selectors to resolve against real app `testID`s, all backed by focused proof and exact-head native CI evidence.

## Impact

- Sensitive CI surface: `.github/workflows/ci-mobile-e2e.yml`.
- Sensitive binding documentation: `docs/mobile/architecture-book/testing.md` and `docs/mobile/architecture-book/CHANGELOG.md`. Both record an existing CI/E2E wiring contract; neither introduces a costly-to-reverse decision, so no new ADR is required (ADR 038 is unchanged).
- Shared E2E flows: `mobile/.maestro/calendar.yaml`, `mobile/.maestro/hidden-events.yaml`.
- Focused proof and operator documentation: `mobile/e2e/test_ci_mobile_e2e.sh`, `mobile/e2e/maestro-selectors.test.ts` (new), `mobile/e2e/README.md`, `docs/agent-dev-environment.md`.
- No OpenAPI contract/generated client, migration, application source, native/store config, deployment, infrastructure, or Flutter surface changes.
- **Known gap, out of scope here:** two further stale flow selectors (`onboarding-welcome-url-cta` in `ical-import.yaml`, `onboarding-school-filter` in `onboarding.yaml`) were removed by unrelated UI reworks and are tracked in `TIM-265`. Because `run_e2e.sh` stops at the first failing flow, the gate is expected to advance past the calendar family and terminate at `ical-import.yaml` until that ticket lands. The new selector guard carries both ids in a documented `KNOWN_STALE` allowlist that fails if it rots.
