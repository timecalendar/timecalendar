## 1. Restore the native E2E build contract

- [x] 1.1 Update the Android `Prebuild Android (dev variant)` and `Build release APK` environment blocks in `.github/workflows/ci-mobile-e2e.yml` so each explicitly sets `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and `EXPO_PUBLIC_API_URL=http://10.0.2.2:3005`; retain the current Gradle bounds, release target, install path, and artifacts.
- [x] 1.2 Update the iOS `Prebuild iOS (dev variant)` and `Build Release simulator app` environment blocks so each explicitly sets `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and `EXPO_PUBLIC_API_URL=http://localhost:3005`; retain the current Xcode Release simulator build, install path, server lifecycle, retry boundary, and artifacts.
- [x] 1.3 Review the complete workflow diff and confirm it does not change `mobile/app.config.ts`, the production fail-closed default, backend endpoint allowlist, native/store identities, API/generated clients, server/schema, deploy/infrastructure, or Flutter surfaces.

## 2. Add focused workflow structure proof

- [x] 2.1 Extend `mobile/e2e/test_ci_mobile_e2e.sh` with a step-scoped helper that isolates each of the four named prebuild/release-build blocks and requires exactly one development variant, exactly one development capability, and exactly one platform-correct local URL in each block.
- [x] 2.2 Make the proof reject a missing/duplicate value and the opposite platform URL without weakening the existing Maestro pin, Gradle-bound, retry, failure-artifact, or server-log assertions; keep the proof invoked by both native jobs before device execution.
- [x] 2.3 Run `bash -n mobile/e2e/test_ci_mobile_e2e.sh`, execute `./mobile/e2e/test_ci_mobile_e2e.sh`, and run ShellCheck when installed (record an explicit N/A otherwise).

## 3. Repair the shared calendar-family view selector

- [ ] 3.1 In `mobile/.maestro/calendar.yaml`, replace the `tapOn: id: "calendar-view-agenda"` / `assertVisible: id: "calendar-view-agenda"` pair with `tapOn: id: "calendar-view"` → `tapOn: text: "Agenda"` → an `extendedWaitUntil` on `id: "agenda-section-list"` (60000 ms, matching the file's existing timeouts). Leave `runFlow: import-seed.yaml`, both seeded-title waits, and the `Room E2E Lecture` assertion untouched.
- [ ] 3.2 In `mobile/.maestro/hidden-events.yaml`, replace both `tapOn: id: "calendar-view-agenda"` steps (lines 75 and 110) with the same `calendar-view` → `Agenda` pair. Do not add a companion assertion — the existing seeded-title `extendedWaitUntil` after each already proves the agenda rendered. Leave the flow order, `stopApp`/`openLink` sequence, iOS "Open" optional taps, and the `assertNotVisible` untouched.
- [ ] 3.3 Update the header comment in both files to describe the control the flow now drives: one `calendar-view` `testID` shared by the iOS `@expo/ui` `Picker` (`appearance="menu"`) and the Android `@react-native-menu/menu` trigger, and `Agenda` chosen from its menu because `calendar.view.agenda` is identical in EN and FR. Keep the existing "no per-platform selectors" claim true.
- [ ] 3.4 Confirm `grep -rn "calendar-view-agenda" mobile/` returns nothing, and that the diff touches no file under `mobile/src`.

## 4. Guard selector drift in the baseline gate

- [ ] 4.1 Add `mobile/e2e/maestro-selectors.test.ts`: parse every `mobile/.maestro/*.yaml` for `id:` values, keep only literal ids matching `^[a-z0-9-]+$` (skipping the deliberately regex-shaped `checklist-check-.*` / `checklist-remove-.*`), collect literal `testID="…"` values from every non-test file under `mobile/src`, and fail on any flow id with no match. The failure message must name the flow file and the unresolved id.
- [ ] 4.2 Add a `KNOWN_STALE` map holding exactly `onboarding-welcome-url-cta` (`ical-import.yaml`) and `onboarding-school-filter` (`onboarding.yaml`), each commented with the `TIM-265` reference and the commit that removed it. Make the guard bidirectional: a `KNOWN_STALE` id that IS present in `mobile/src` must also fail, so the allowlist cannot rot when `TIM-265` lands.
- [ ] 4.3 Run `npx jest e2e/maestro-selectors` from `mobile/` and confirm it passes on this branch; temporarily rename `calendar-view` in a scratch copy (or assert against a fixture) to confirm the guard actually fails on drift, then discard the scratch change.

## 5. Update binding and operator documentation

- [x] 5.1 Update `docs/mobile/architecture-book/testing.md` so release-config native E2E builds require the explicit development backend capability with the development variant and platform URL, and add the rule change to `docs/mobile/architecture-book/CHANGELOG.md`; preserve ADR 038 unchanged because this correction introduces no new costly-to-reverse decision.
- [x] 5.2 Update `mobile/e2e/README.md` and `docs/agent-dev-environment.md` build examples and CI contract to include `BACKEND_ENVIRONMENT_CAPABILITY=development` for Android and iOS.
- [ ] 5.3 Extend the `testing.md` Maestro bullet to record the selector rule: flow selectors resolve against real `mobile/src` `testID`s, enforced by `mobile/e2e/maestro-selectors.test.ts` in the baseline gate; note the calendar-family agenda switch goes through the `calendar-view` control. Append the corresponding line to `docs/mobile/architecture-book/CHANGELOG.md`. Treat both files as sensitive binding documentation and keep the edits to the existing contract — no new ADR.
- [x] 5.4 Confirm the documentation adds no credential, device-install, or console-registration action; therefore no `(HUMAN: …)` migration inbox note is required.

## 6. Local-green verification

- [x] 6.1 Resolve Expo config for Android and iOS with the complete three-input contract and assert `extra.appVariant=development`, `extra.backendEnvironmentCapability=development`, the development native identity, and each platform URL; separately confirm an omitted or malformed capability still resolves production.
- [ ] 6.2 Run the focused `mobile/app.config.test.ts` and `mobile/e2e/maestro-selectors.test.ts` Jest suites, the full `mobile` lint + tsc baseline, applicable YAML/Markdown/shell formatting checks, and `openspec validate restore-mobile-e2e-local-backend-capability`.
- [ ] 6.3 Run `git diff --check` and inspect the complete diff for only the workflow, the two Maestro flows, focused proofs, named documentation/Architecture Book updates, and this OpenSpec change; confirm nothing under `mobile/src`, no secrets, and no unrelated generated/native files are present.

## 7. Exact-head CI proof and handoff

- [ ] 7.1 Push the implementation head, apply the existing `run-e2e` PR label, and require the baseline check plus `Run mobile E2E (Android)` and `Run mobile E2E (iOS)` to succeed on that exact SHA; do not rerun an unchanged terminal failure, and let any later push retrigger the labeled workflow.
- [ ] 7.2 Inspect the Android and iOS logs far enough to confirm the seeded calendar import traverses the real platform-local server path AND that `calendar.yaml` and `hidden-events.yaml` now complete their full round trip past the agenda switch; retain ADR 038 terminal-failure semantics.
- [ ] 7.3 If a run terminates at `ical-import.yaml` on the `onboarding-welcome-url-cta` selector, that is the expected `TIM-265` boundary, not a regression of this change — record it explicitly and do not rerun. If either platform instead fails to address the `calendar-view` menu entry, stop and escalate to the Founding Engineer: the fallback needs an application change this ticket does not authorize.
- [ ] 7.4 Record the exact commit SHA and direct workflow/job links in the issue handoff, naming which flows passed and which remain blocked by `TIM-265`. No separate QA gate applies; the Reviewer performs fresh exact-head preflight and autonomously merges after green CI.
