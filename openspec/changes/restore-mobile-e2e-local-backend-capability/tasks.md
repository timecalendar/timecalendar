## 1. Restore the native E2E build contract

- [x] 1.1 Update the Android `Prebuild Android (dev variant)` and `Build release APK` environment blocks in `.github/workflows/ci-mobile-e2e.yml` so each explicitly sets `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and `EXPO_PUBLIC_API_URL=http://10.0.2.2:3005`; retain the current Gradle bounds, release target, install path, and artifacts.
- [x] 1.2 Update the iOS `Prebuild iOS (dev variant)` and `Build Release simulator app` environment blocks so each explicitly sets `APP_VARIANT=development`, `BACKEND_ENVIRONMENT_CAPABILITY=development`, and `EXPO_PUBLIC_API_URL=http://localhost:3005`; retain the current Xcode Release simulator build, install path, server lifecycle, retry boundary, and artifacts.
- [x] 1.3 Review the complete workflow diff and confirm it does not change `mobile/app.config.ts`, the production fail-closed default, backend endpoint allowlist, native/store identities, API/generated clients, server/schema, deploy/infrastructure, or Flutter surfaces.

## 2. Add focused workflow structure proof

- [x] 2.1 Extend `mobile/e2e/test_ci_mobile_e2e.sh` with a step-scoped helper that isolates each of the four named prebuild/release-build blocks and requires exactly one development variant, exactly one development capability, and exactly one platform-correct local URL in each block.
- [x] 2.2 Make the proof reject a missing/duplicate value and the opposite platform URL without weakening the existing Maestro pin, Gradle-bound, retry, failure-artifact, or server-log assertions; keep the proof invoked by both native jobs before device execution.
- [x] 2.3 Run `bash -n mobile/e2e/test_ci_mobile_e2e.sh`, execute `./mobile/e2e/test_ci_mobile_e2e.sh`, and run ShellCheck when installed (record an explicit N/A otherwise).

## 3. Repair every stale shared-flow selector

Triage amendment #2 widens this section from `calendar-view-agenda` alone to the full
stale set: a gate that terminates at flow 9 of 14 is a red job and cannot satisfy
acceptance criterion 6. All three repairs live in `mobile/.maestro/**` — same surface,
same risk class, same reviewer.

- [x] 3.1 In `mobile/.maestro/calendar.yaml`, replace the `tapOn: id: "calendar-view-agenda"` / `assertVisible: id: "calendar-view-agenda"` pair with `tapOn: id: "calendar-view"` → `tapOn: text: "Agenda"` → an `extendedWaitUntil` on `id: "agenda-section-list"` (60000 ms, matching the file's existing timeouts). Leave `runFlow: import-seed.yaml`, both seeded-title waits, and the `Room E2E Lecture` assertion untouched.
- [x] 3.2 In `mobile/.maestro/hidden-events.yaml`, replace both `tapOn: id: "calendar-view-agenda"` steps (lines 75 and 110) with the same `calendar-view` → `Agenda` pair. Do not add a companion assertion — the existing seeded-title `extendedWaitUntil` after each already proves the agenda rendered. Leave the flow order, `stopApp`/`openLink` sequence, iOS "Open" optional taps, and the `assertNotVisible` untouched.
- [x] 3.3 In `mobile/.maestro/ical-import.yaml`, replace the stale `onboarding-welcome-url-cta` tap with the entry point's current route: advance the welcome carousel (`onboarding-next` ×2), take `onboarding-welcome-cta` into the school step, wait on `"Select your school"` (which only renders in the browsing state, so it also proves the footer action mounted), then tap `onboarding-school-missing`. Leave the existing `"Add a calendar by URL"` assertion and the empty-submit validation steps untouched.
- [x] 3.4 In `mobile/.maestro/onboarding.yaml`, replace `tapOn: id: "onboarding-school-filter"` with `tapOn: text: "Search schools"`. `react-native-screens`' `SearchBarProps` carries no `testID`, so the native-header search bar is addressable only by its placeholder — exactly as locale-stable as this file's existing `"Select your school"` assertion. Leave the `inputText`/`eraseText` sequence and both filter assertions untouched.
- [x] 3.5 Update the header comment in each edited file to describe the control the flow now drives and name the commit that moved it. Keep the existing "no per-platform selectors" claim true.
- [x] 3.6 Confirm `grep -rn "calendar-view-agenda\|onboarding-welcome-url-cta\|onboarding-school-filter" mobile/` returns nothing, and that the diff touches no file under `mobile/src`.

## 4. Guard selector drift in the baseline gate

The naive literal matcher reports **ten** candidates on this repo, of which seven are
false positives — it would push real, working ids (including `settings-feedback`, the
exact id [TIM-263](/TIM/issues/TIM-263) exists to prove) into the allowlist and never
catch the next real break. The three matching rules below are load-bearing.

- [x] 4.1 Add `mobile/e2e/maestro-selectors.test.ts`: parse every `mobile/.maestro/*.yaml` for `id:` values (anchored to the YAML key, so `Android:` inside a header comment is not a selector), collect testIDs from every non-test file under `mobile/src`, and fail on any flow id with no match. The failure message names the flow file, the line, and the unresolved id.
- [x] 4.2 Implement the three matching rules: (a) a flow `id:` value is a **regex**, anchored `^(?:…)$`, not a literal — so `checklist-check-.*` resolves; (b) collect `testID: "…"` object properties as well as `testID="…"` JSX attributes — so the `about-screen.tsx` / `settings-screen.tsx` descriptors resolve; (c) expand template-literal testIDs by substituting a sample for each `${…}` — so ``testID={`checklist-check-${item.uuid}`}`` stands for its family. Pass-throughs (`testID={testID}`) declare no id and are skipped: the value they receive is collected by rule (b).
- [x] 4.3 Ship `KNOWN_STALE` **empty** — every stale id is repaired in §3, so nothing is deferred. Keep the check bidirectional (an allowlisted id that IS present in `mobile/src` fails) so the allowlist cannot rot if one is ever added.
- [x] 4.4 Add self-checks that keep the suite from going vacuous: non-zero flow/selector/testID counts, `calendar-view-agenda` must NOT resolve while `calendar-view` must, the regex and object-property rules each assert both directions.
- [x] 4.5 Run `npx jest e2e/maestro-selectors` from `mobile/` and confirm it passes on this branch; rename a live selector in a scratch copy to confirm the guard actually fails on drift, then restore it.

## 5. Update binding and operator documentation

- [x] 5.1 Update `docs/mobile/architecture-book/testing.md` so release-config native E2E builds require the explicit development backend capability with the development variant and platform URL, and add the rule change to `docs/mobile/architecture-book/CHANGELOG.md`; preserve ADR 038 unchanged because this correction introduces no new costly-to-reverse decision.
- [x] 5.2 Update `mobile/e2e/README.md` and `docs/agent-dev-environment.md` build examples and CI contract to include `BACKEND_ENVIRONMENT_CAPABILITY=development` for Android and iOS.
- [x] 5.3 Extend the `testing.md` Maestro bullet to record the selector rule: flow selectors resolve against real `mobile/src` `testID`s, enforced by `mobile/e2e/maestro-selectors.test.ts` in the baseline gate; note the calendar-family agenda switch goes through the `calendar-view` control. Append the corresponding line to `docs/mobile/architecture-book/CHANGELOG.md`. Treat both files as sensitive binding documentation and keep the edits to the existing contract — no new ADR.
- [x] 5.4 Confirm the documentation adds no credential, device-install, or console-registration action; therefore no `(HUMAN: …)` migration inbox note is required.
- [x] 5.5 Add the selector rule to `mobile/e2e/README.md`'s "Add a flow" checklist (the operator-facing home of the convention), and correct `ical-import.yaml`'s header: reaching the URL screen now goes through the school step's live `GET /schools` read, so the flow's "no network" claim applies only to its validation half.

## 6. Local-green verification

- [x] 6.1 Resolve Expo config for Android and iOS with the complete three-input contract and assert `extra.appVariant=development`, `extra.backendEnvironmentCapability=development`, the development native identity, and each platform URL; separately confirm an omitted or malformed capability still resolves production.
- [x] 6.2 Run the focused `mobile/app.config.test.ts` and `mobile/e2e/maestro-selectors.test.ts` Jest suites, the full `mobile` lint + tsc baseline, applicable YAML/Markdown/shell formatting checks, and `openspec validate restore-mobile-e2e-local-backend-capability`.
- [x] 6.3 Run `git diff --check` and inspect the complete diff for only the workflow, the four Maestro flows, focused proofs, named documentation/Architecture Book updates, and this OpenSpec change; confirm nothing under `mobile/src`, no secrets, and no unrelated generated/native files are present.

## 7. Exact-head CI proof and handoff

- [ ] 7.1 Push the implementation head, apply the existing `run-e2e` PR label, and require the baseline check plus `Run mobile E2E (Android)` and `Run mobile E2E (iOS)` to succeed on that exact SHA; do not rerun an unchanged terminal failure, and let any later push retrigger the labeled workflow.
- [ ] 7.2 Inspect the Android and iOS logs far enough to confirm the seeded calendar import traverses the real platform-local server path AND that the complete flow set runs through: the calendar family past the agenda switch, `ical-import.yaml` through the school-step entry, and `onboarding.yaml` through the header search bar. Retain ADR 038 terminal-failure semantics.
- [ ] 7.3 A further stale selector or text assertion surfaced by the gate in a flow the native run had not reached since the UI rework (`environment-switch`, `event-checklists`, `home`, `personal-events`, `settings`, `user-calendars` are the unreached six) is an **in-scope material fix on this ticket**, not a new one — repair it in `mobile/.maestro/**` and take a fresh gate. Escalate to the Founding Engineer only if a repair genuinely requires a `mobile/src` change (the [TIM-265](/TIM/issues/TIM-265) boundary) — most likely the Android native-stack `SearchView` rendering collapsed to an icon, which would make the `"Search schools"` placeholder unmatchable until expanded.
- [ ] 7.4 Record the exact commit SHA and direct workflow/job links in the issue handoff, naming which flows passed. No separate QA gate applies; the Reviewer performs fresh exact-head preflight and autonomously merges after green CI.
