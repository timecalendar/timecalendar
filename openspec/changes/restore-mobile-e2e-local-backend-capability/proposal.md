## Why

The native Android and iOS E2E jobs build the development app identity and bake the seeded server's local URL, but omit the independent backend-environment capability. Because missing capability values intentionally fail closed to production, both release-config binaries ignore that local URL and cannot complete the seeded calendar import that gates B10.

Exact-head run [33162979890](https://github.com/timecalendar/timecalendar/actions/runs/33162979890) proved the routing repair: both platforms show `TEST ENVIRONMENT · Local`, complete `import-seed.yaml`, and render the real seeded events. Both then fail terminally on the very next step — `tapOn: id: "calendar-view-agenda"`, a segmented-control selector removed in `a45b9a5` when the calendar header moved to native chrome. The shared calendar-family flows still carry four references to it, so the seeded round trip they exist to prove can never complete.

That selector is not alone. `run_e2e.sh` runs top-level flows lexically and stops at the first failure, so `calendar.yaml` (3rd of 14) has been masking every later flow: `onboarding-welcome-url-cta` (`ical-import.yaml`, removed by `482f134`) and `onboarding-school-filter` (`onboarding.yaml`, removed by `f2e47ee`) are stale too. Repairing only the calendar family would move the terminal failure to flow 9 — still a red job, still no green exact head for the B10 gate that `TIM-263` is blocked on. All three repairs live on one surface, so this change takes all three.

Exact-head run `33365735943` later exposed the final keyboard asymmetries in the expanded shared flow set. On Android, `hideKeyboard` reported success after the checklist input had already unfocused, acted as Back, and silently popped event details before the typed-row assertion. On iOS, the institution Continue control existed in the accessibility hierarchy but was physically covered by the keyboard, so Maestro's correctly targeted tap entered another character instead of advancing. The checklist flow therefore needs a state-preserving persistence proof before toggling, while the two onboarding forms need their existing body CTAs to remain tappable above the keyboard.

Exact-head run `33386097672` at `b239406b` then exposed two final measured gaps. iOS's nested
Activity import recorded a failed depth-zero `runFlowCommand` wrapper before its still-open
depth-one `openLinkCommand` failed with the already-authorized simulator startup transport shape;
the classifier currently mistakes the propagated wrapper status for an independent earlier
failure. Android's rename flow retained the exact wrong value `E2E Renamed Timetablee` after both
erase boundaries, and the existing exact pre-Save gate correctly stopped the write. The recovery
must distinguish only a live structural ancestor wrapper and must correct only that exact observed
input residue before preserving the mandatory exact target gate.

Exact-head run `33395764565` at `39998762` cleared both of those repairs and produced Android
17/17. On iOS, `ical-import` entered exact `E2E Programme`, completed the full centred CTA reveal,
the bounded CTA wait, the required tap, and the optional same-id fallback, but never reached
Connect. The final hierarchy remained on programme with the focused keyboard physically covering
the Continue action. That device evidence disproves the proposal's earlier assumption that keeping
the CTA inside a keyboard-avoiding scroll is sufficient: the programme action must use the
repository's proven sticky-footer placement, and the component proof must pin physical containment
semantics rather than call a scroll descendant “lifted”.

## What Changes

- Supply `BACKEND_ENVIRONMENT_CAPABILITY=development` to every Android and iOS native E2E prebuild and release-bundle compilation alongside `APP_VARIANT=development` and the platform-correct local `EXPO_PUBLIC_API_URL`.
- Strengthen the focused workflow structure proof so each platform's prebuild and release-build steps must retain the complete three-part development backend contract.
- Replace all four obsolete `calendar-view-agenda` references in `mobile/.maestro/calendar.yaml` and `mobile/.maestro/hidden-events.yaml` with the current cross-platform calendar-view control contract: open the `calendar-view` header control, choose the locale-stable "Agenda" entry, and assert the agenda list itself rendered.
- Route `mobile/.maestro/ical-import.yaml` to the "Add by URL" entry where it now lives — the school step's "I can't find my school" action — and address `mobile/.maestro/onboarding.yaml`'s school search by its native-header placeholder, which is the only handle that control exposes.
- Add a baseline-gate proof that every selector id used by a Maestro flow resolves to a `testID` in `mobile/src`, matching selectors as regexes and collecting object-property and template-literal `testID`s, so a UI rework can no longer strand a flow selector until an expensive native run discovers it.
- Update native E2E testing guidance to name the capability as a required build input, name the selector-drift guard, and record exact-head Android and iOS CI as the terminal proof.
- Preserve the production fail-closed default, current endpoint allowlist, native identities,
  application UI/behaviour outside the bounded Activity and onboarding-layout repairs, top-level
  flow order, retry assertion guard/attempt budget, seeded-data assertions, local server lifecycle,
  and failure artifacts; refine only the nested-wrapper provenance used by the existing structural
  retry policy.
- Reopen Activity's older-page chain when the observed held-calendar set expands, then force the existing single-flight newest-page coordinator so the expanded set can establish a live cursor without deleting cached history or changing read state.
- Remove the final shared-flow `hideKeyboard`, gate the typed checklist value exactly, cold re-enter Calendar without clearing state, and prove the persisted row before toggling, progress, hard-delete, and absence checks.
- Keep the already device-proven institution-name form unchanged. In the programme form, move the
  existing Continue action out of the `ScrollView` and place it immediately after the scroll as a
  sticky sibling inside the existing `KeyboardAvoidingView`, following the personal-event form
  pattern so iOS padding lifts it and Android resize keeps it reachable. Preserve validation,
  draft writes, Skip, route, label, id, disabled state, handler, colors, entered value, and the
  shared iCal sequence.
- Refine the structural retry classifier so a failed `runFlowCommand` propagated from the final
  failed startup child is excluded from the global veto only while it remains that child's live
  lower-depth ancestor; same-depth, closed, assertion-bearing, interaction-bearing, and malformed
  records remain terminal.
- In the rename flow, condition only on the conjunctive exact wrong input value
  `E2E Renamed Timetablee`, tap at `99%,50%` inside that selected input, erase exactly one
  character, and retain the exact `E2E Renamed Timetable` pre-Save gate and every local/server
  convergence assertion.
- Exclude API/generated-client changes, server/schema changes, deploy or store configuration, legacy Flutter, and any rerun of an unchanged terminal failure.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-e2e`: Require both platform release-config development builds to compile an explicit development backend capability with their development identity and platform-local seeded-server URL; require shared flows to avoid platform-asymmetric keyboard commands, prove exact typed values before navigation or writes, correct only a measured exact controlled-input residue before an irreversible write, keep onboarding body CTAs physically actionable with the keyboard present, resolve selector ids against real app `testID`s, and classify a propagated failed flow wrapper as non-independent only while it is the live ancestor of the final failed startup command, all backed by focused proof and exact-head native CI evidence.
- `mobile-activity-triggers`: Treat an observed held-calendar addition as invalidating the previous set's completed pagination chain, while retaining removal pruning, read state, cached rows, and coordinator single-flight behavior.

## Impact

- Sensitive CI surface: `.github/workflows/ci-mobile-e2e.yml`.
- Sensitive binding documentation: `docs/mobile/architecture-book/testing.md`,
  `docs/mobile/architecture-book/CHANGELOG.md`, and ADR 038. The build/selector guidance records an
  existing CI/E2E wiring contract; the retry text narrowly refines ADR 038's structural provenance
  rule. No new ADR is required.
- Shared E2E flows: `mobile/.maestro/calendar.yaml`, `mobile/.maestro/hidden-events.yaml`,
  `mobile/.maestro/ical-import.yaml`, `mobile/.maestro/onboarding.yaml`, and
  `mobile/.maestro/user-calendar-rename.yaml`.
- Bounded onboarding layout repair: the already-landed institution-name form stays unchanged;
  this amendment touches only `mobile/src/features/onboarding/ui/programme-screen.tsx`, its minimum
  local/shared footer spacing, and its focused component test.
- Checklist persistence flow: `mobile/.maestro/event-checklists.yaml`, plus focused mutation-sensitive coverage in `mobile/e2e/maestro-selectors.test.ts`.
- Focused proof and operator documentation: `mobile/e2e/test_ci_mobile_e2e.sh`, `mobile/e2e/maestro-selectors.test.ts` (new), `mobile/e2e/README.md`, `docs/agent-dev-environment.md`.
- Native retry harness and binding contract: `mobile/e2e/classify-maestro-attempt.mjs`,
  `mobile/e2e/test_run_e2e.sh`, ADR 038, `docs/mobile/architecture-book/testing.md`, and
  `docs/mobile/architecture-book/CHANGELOG.md`. This is a narrow refinement of the existing
  structural decision, not an attempt-budget or assertion-guard widening.
- Rename correction: `mobile/.maestro/user-calendar-rename.yaml` and its focused structural and
  mutation-sensitive proof in `mobile/e2e/maestro-selectors.test.ts`.
- Activity ownership lifecycle and focused regression proof: `mobile/src/features/activity/data/lifecycle.ts` and its colocated tests, plus root/barrel wiring for the renamed reconciliation hook.
- No OpenAPI contract/generated client, migration, server fixture, selector-id, native/store config,
  workflow/timeout, retry attempt budget, deployment, infrastructure, or Flutter changes.
  Application UI changes are limited to the bounded onboarding form repairs above, with this
  amendment changing only the programme CTA's containment; user-visible behavior and navigation
  semantics remain unchanged. The existing structural retry classifier plus binding ADR/Architecture
  Book contract are refined only for the live nested wrapper provenance described above.
- **Residual risk, accepted:** repository proof cannot simulate native keyboard geometry. It can
  reject the known-bad containment by proving the programme CTA is the sole sticky sibling after
  the scroll and still inside the avoiding view; the unchanged Maestro journey and fresh exact-head
  device gate remain the physical tapability proof. No other application surface is authorized.
