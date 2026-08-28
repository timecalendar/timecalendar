## Why

The native Android and iOS E2E jobs build the development app identity and bake the seeded server's local URL, but omit the independent backend-environment capability. Because missing capability values intentionally fail closed to production, both release-config binaries ignore that local URL and cannot complete the seeded calendar import that gates B10.

Exact-head run [33162979890](https://github.com/timecalendar/timecalendar/actions/runs/33162979890) proved the routing repair: both platforms show `TEST ENVIRONMENT · Local`, complete `import-seed.yaml`, and render the real seeded events. Both then fail terminally on the very next step — `tapOn: id: "calendar-view-agenda"`, a segmented-control selector removed in `a45b9a5` when the calendar header moved to native chrome. The shared calendar-family flows still carry four references to it, so the seeded round trip they exist to prove can never complete.

That selector is not alone. `run_e2e.sh` runs top-level flows lexically and stops at the first failure, so `calendar.yaml` (3rd of 14) has been masking every later flow: `onboarding-welcome-url-cta` (`ical-import.yaml`, removed by `482f134`) and `onboarding-school-filter` (`onboarding.yaml`, removed by `f2e47ee`) are stale too. Repairing only the calendar family would move the terminal failure to flow 9 — still a red job, still no green exact head for the B10 gate that `TIM-263` is blocked on. All three repairs live on one surface, so this change takes all three.

## What Changes

- Supply `BACKEND_ENVIRONMENT_CAPABILITY=development` to every Android and iOS native E2E prebuild and release-bundle compilation alongside `APP_VARIANT=development` and the platform-correct local `EXPO_PUBLIC_API_URL`.
- Strengthen the focused workflow structure proof so each platform's prebuild and release-build steps must retain the complete three-part development backend contract.
- Replace all four obsolete `calendar-view-agenda` references in `mobile/.maestro/calendar.yaml` and `mobile/.maestro/hidden-events.yaml` with the current cross-platform calendar-view control contract: open the `calendar-view` header control, choose the locale-stable "Agenda" entry, and assert the agenda list itself rendered.
- Route `mobile/.maestro/ical-import.yaml` to the "Add by URL" entry where it now lives — the school step's "I can't find my school" action — and address `mobile/.maestro/onboarding.yaml`'s school search by its native-header placeholder, which is the only handle that control exposes.
- Add a baseline-gate proof that every selector id used by a Maestro flow resolves to a `testID` in `mobile/src`, matching selectors as regexes and collecting object-property and template-literal `testID`s, so a UI rework can no longer strand a flow selector until an expensive native run discovers it.
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
- Shared E2E flows: `mobile/.maestro/calendar.yaml`, `mobile/.maestro/hidden-events.yaml`, `mobile/.maestro/ical-import.yaml`, `mobile/.maestro/onboarding.yaml`.
- Focused proof and operator documentation: `mobile/e2e/test_ci_mobile_e2e.sh`, `mobile/e2e/maestro-selectors.test.ts` (new), `mobile/e2e/README.md`, `docs/agent-dev-environment.md`.
- No OpenAPI contract/generated client, migration, application source, native/store config, deployment, infrastructure, or Flutter surface changes.
- **Residual risk, accepted:** the guard covers `id:` selectors only. Six flows have not been reached by a native run since the UI rework, so a stale **text** assertion in one of them is possible and would surface only on the gate. Triage amendment #2 authorizes repairing whatever the gate surfaces inside this change; only a repair that genuinely needs a `mobile/src` change is out of scope, and that is `TIM-265`.
