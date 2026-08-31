## Why

The native Android and iOS E2E jobs build the development app identity and bake the seeded server's local URL, but omit the independent backend-environment capability. Because missing capability values intentionally fail closed to production, both release-config binaries ignore that local URL and cannot complete the seeded calendar import that gates B10.

Exact-head run [33162979890](https://github.com/timecalendar/timecalendar/actions/runs/33162979890) proved the routing repair: both platforms show `TEST ENVIRONMENT · Local`, complete `import-seed.yaml`, and render the real seeded events. Both then fail terminally on the very next step — `tapOn: id: "calendar-view-agenda"`, a segmented-control selector removed in `a45b9a5` when the calendar header moved to native chrome. The shared calendar-family flows still carry four references to it, so the seeded round trip they exist to prove can never complete.

That selector is not alone. `run_e2e.sh` runs top-level flows lexically and stops at the first failure, so `calendar.yaml` (3rd of 14) has been masking every later flow: `onboarding-welcome-url-cta` (`ical-import.yaml`, removed by `482f134`) and `onboarding-school-filter` (`onboarding.yaml`, removed by `f2e47ee`) are stale too. Repairing only the calendar family would move the terminal failure to flow 9 — still a red job, still no green exact head for the B10 gate that `TIM-263` is blocked on. All three repairs live on one surface, so this change takes all three.

Exact-head run `33365735943` later exposed the final keyboard asymmetries in the expanded shared flow set. On Android, `hideKeyboard` reported success after the checklist input had already unfocused, acted as Back, and silently popped event details before the typed-row assertion. On iOS, the institution Continue control existed in the accessibility hierarchy but was physically covered by the keyboard, so Maestro's correctly targeted tap entered another character instead of advancing. The checklist flow therefore needs a state-preserving persistence proof before toggling, while the two onboarding forms need their existing body CTAs to remain tappable above the keyboard.

## What Changes

- Supply `BACKEND_ENVIRONMENT_CAPABILITY=development` to every Android and iOS native E2E prebuild and release-bundle compilation alongside `APP_VARIANT=development` and the platform-correct local `EXPO_PUBLIC_API_URL`.
- Strengthen the focused workflow structure proof so each platform's prebuild and release-build steps must retain the complete three-part development backend contract.
- Replace all four obsolete `calendar-view-agenda` references in `mobile/.maestro/calendar.yaml` and `mobile/.maestro/hidden-events.yaml` with the current cross-platform calendar-view control contract: open the `calendar-view` header control, choose the locale-stable "Agenda" entry, and assert the agenda list itself rendered.
- Route `mobile/.maestro/ical-import.yaml` to the "Add by URL" entry where it now lives — the school step's "I can't find my school" action — and address `mobile/.maestro/onboarding.yaml`'s school search by its native-header placeholder, which is the only handle that control exposes.
- Add a baseline-gate proof that every selector id used by a Maestro flow resolves to a `testID` in `mobile/src`, matching selectors as regexes and collecting object-property and template-literal `testID`s, so a UI rework can no longer strand a flow selector until an expensive native run discovers it.
- Update native E2E testing guidance to name the capability as a required build input, name the selector-drift guard, and record exact-head Android and iOS CI as the terminal proof.
- Preserve the production fail-closed default, current endpoint allowlist, native identities, application UI/behaviour outside the bounded Activity and onboarding-layout repairs, flow order/retry policy, seeded-data assertions, local server lifecycle, and failure artifacts.
- Reopen Activity's older-page chain when the observed held-calendar set expands, then force the existing single-flight newest-page coordinator so the expanded set can establish a live cursor without deleting cached history or changing read state.
- Remove the final shared-flow `hideKeyboard`, gate the typed checklist value exactly, cold re-enter Calendar without clearing state, and prove the persisted row before toggling, progress, hard-delete, and absence checks.
- Make only the institution-name and programme onboarding forms keyboard-safe using the repository's existing `KeyboardAvoidingView` plus scroll/tap-handling layout, while preserving validation, draft writes, Skip, routes, labels, ids, and Android behavior. Gate each shared iCal CTA interaction behind the exact input value and its existing bounded CTA wait.
- Exclude API/generated-client changes, server/schema changes, deploy or store configuration, legacy Flutter, and any rerun of an unchanged terminal failure.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: Require both platform release-config development builds to compile an explicit development backend capability with their development identity and platform-local seeded-server URL; require shared flows to avoid platform-asymmetric keyboard commands, prove exact typed values before navigation or writes, keep onboarding body CTAs physically actionable with the keyboard present, and resolve selector ids against real app `testID`s, all backed by focused proof and exact-head native CI evidence.
- `mobile-activity-triggers`: Treat an observed held-calendar addition as invalidating the previous set's completed pagination chain, while retaining removal pruning, read state, cached rows, and coordinator single-flight behavior.

## Impact

- Sensitive CI surface: `.github/workflows/ci-mobile-e2e.yml`.
- Sensitive binding documentation: `docs/mobile/architecture-book/testing.md` and `docs/mobile/architecture-book/CHANGELOG.md`. Both record an existing CI/E2E wiring contract; neither introduces a costly-to-reverse decision, so no new ADR is required (ADR 038 is unchanged).
- Shared E2E flows: `mobile/.maestro/calendar.yaml`, `mobile/.maestro/hidden-events.yaml`, `mobile/.maestro/ical-import.yaml`, `mobile/.maestro/onboarding.yaml`.
- Bounded onboarding layout repair: `mobile/src/features/onboarding/ui/institution-name-screen.tsx`, `mobile/src/features/onboarding/ui/programme-screen.tsx`, and only their minimum shared/local styles and focused component tests.
- Checklist persistence flow: `mobile/.maestro/event-checklists.yaml`, plus focused mutation-sensitive coverage in `mobile/e2e/maestro-selectors.test.ts`.
- Focused proof and operator documentation: `mobile/e2e/test_ci_mobile_e2e.sh`, `mobile/e2e/maestro-selectors.test.ts` (new), `mobile/e2e/README.md`, `docs/agent-dev-environment.md`.
- Activity ownership lifecycle and focused regression proof: `mobile/src/features/activity/data/lifecycle.ts` and its colocated tests, plus root/barrel wiring for the renamed reconciliation hook.
- No OpenAPI contract/generated client, migration, server fixture, selector-id, native/store config, workflow/timeout, retry classifier/budget, deployment, infrastructure, binding Architecture Book, or Flutter changes. Application UI changes are limited to the two keyboard-safe onboarding form layouts above; user-visible behavior and navigation semantics remain unchanged.
- **Residual risk, accepted:** the guard covers `id:` selectors only. Six flows have not been reached by a native run since the UI rework, so a stale **text** assertion in one of them is possible and would surface only on the gate. Triage amendment #2 authorizes repairing whatever the gate surfaces inside this change; only a repair that genuinely needs a `mobile/src` change is out of scope, and that is `TIM-265`.
