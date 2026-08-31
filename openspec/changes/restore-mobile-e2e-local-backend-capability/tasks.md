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

- [x] 5.1 Update `docs/mobile/architecture-book/testing.md` so release-config native E2E builds require the explicit development backend capability with the development variant and platform URL, and add the rule change to `docs/mobile/architecture-book/CHANGELOG.md`; preserve ADR 038 unchanged because this correction introduces no new costly-to-reverse decision. (Superseded in one respect by §8.3: gate `33167661438` disproved a factual claim ADR 038 makes about its own retry classifier, so that paragraph is corrected in place there. The decision itself — per-flow processes, a bounded budget, terminal assertions — still stands unchanged.)
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

## 8. Classify the pre-flow iOS driver-startup timeout as retryable

Gate `33167661438` at `288a7704` proved the §1–§5 work on iOS as far as it could: the
server seeded, the stack came up, and then flow `about` — the _first_ flow — never ran,
because Maestro could not create the iOS session at all (`IOSDriverTimeoutException`,
4 min of `MAESTRO_DRIVER_STARTUP_TIMEOUT`). The job had `--startup-attempts 4` available
and spent one, because `is_retryable_startup_failure` anchors on `launchApp`, which that
output cannot contain: the abort happens in `MaestroSessionManager.createIOS`, before the
flow is opened. The most canonical possible startup failure was classified `terminal
non-startup failure; not retrying`. This is a real gap in the classifier, not a rerun
excuse — the ADR 038 retry budget exists for exactly this flake and never got to spend it.

- [x] 8.1 Add a second, independent branch to `is_retryable_startup_failure` in `mobile/e2e/run_e2e.sh` matching `IOSDriverTimeoutException|iOS driver not ready in time`, placed after the assertion guard (so assertion evidence still wins) and **before** the `launchApp` branch, since this shape has no flow command to anchor on. Leave the existing transport branch byte-identical.
- [x] 8.2 Add a `driver_timeout` scenario to `mobile/e2e/test_run_e2e.sh` whose fake Maestro emits the real CI signature with **no** `launchApp` line, and assert the flow is attempted twice, the later flow still runs, and the retry reason is logged. Replay the classifier against the captured job-`98836832386` output to confirm it flips terminal → retryable.
- [x] 8.3 Widen the ADR 038 decision paragraph, `docs/mobile/architecture-book/testing.md`, and `mobile/e2e/README.md` from "first-`launchApp` transport failure" to the two-shape driver-startup class, and append the change to `docs/mobile/architecture-book/CHANGELOG.md`. ADR 038's decision is refined in place, not replaced: per-flow processes, the bounded budget, and terminal assertions are all unchanged. Flag the ADR edit as a sensitive binding-document surface in the handoff.
- [x] 8.4 Repair the OpenSpec delta's section headers in the same commit: `Flow selectors resolve against the shipped app` does not exist in `openspec/specs/mobile-e2e/spec.md`, so it must sit under `## ADDED Requirements` or `openspec archive` aborts at merge time. Carry the widened retry contract as a genuine `MODIFIED` of the shipped `XCTest startup retries cannot mask flow failures`.

## 9. Reach Settings rows that render below the fold

Android at `288a7704` passed `about`, `appearance-settings`, and `calendar` — including
the whole `calendar-view` → Agenda → seeded-title → details round trip, which proves §3
and §4 on a real device — then failed `environment-switch` at
`Assert that id: settings-environment is visible`, after the full 60s.

This is **not** selector drift, and `maestro-selectors.test.ts` is right to pass:
`settings-environment` exists in `mobile/src` and renders correctly. It is the last row
of the Settings `ScrollView`, in its own section below every destination section, so it
is simply off screen — and Maestro matches only the visible hierarchy. An existing
`testID` below the fold fails identically to a deleted one, which is exactly why the
static guard cannot cover this class.

- [x] 9.1 In `mobile/.maestro/environment-switch.yaml`, replace the `extendedWaitUntil` on `id: "settings-environment"` with `scrollUntilVisible` (`direction: DOWN`, same 60000 ms). Leave the launch, the `TEST ENVIRONMENT · Local` wait, the tap, the `Preproduction` choice, the confirm dialog, and the final banner assertion untouched.
- [x] 9.2 Apply the same repair to `mobile/.maestro/feedback.yaml`, which selects `settings-feedback` — one row below the `settings-about` that `about.yaml` finds on screen, so it is the next flow to hit this and would cost another full native cycle to discover. **Flag the [TIM-263](/TIM/issues/TIM-263) overlap explicitly in the handoff**: revealing that row is the parent's stated deliverable, and this is a two-line unblock taken here only because leaving it red makes acceptance criterion 6 unreachable on this ticket.
- [x] 9.3 Confirm the guard still resolves both ids through the new `scrollUntilVisible.element.id` shape (`npx jest e2e/maestro-selectors`), and add the below-the-fold rule to `mobile/e2e/README.md`'s "Add a flow" checklist with the Settings hub as the worked example. It is a device-viewport property, so no repository proof can encode it — the checklist is the only place it can live.

## 10. Dismiss a replayed first iOS deep-link confirmation

Exact-head gate `33176410414` at `e13152ee` reached the first flow's custom-scheme
confirmation, and Maestro's trace proves its optional `Open` tap hit the system button
and observed a hierarchy change. The failure artifact then showed the same confirmation
present again throughout the following 60-second app assertion. The preceding exact-head
gate proves this interaction normally dismisses once and later deep links see no dialog,
so this is a bounded iOS 26 replay of the suite's first system confirmation rather than a
stale app assertion, below-the-fold row, or driver-startup failure.

- [x] 10.1 In `mobile/.maestro/about.yaml`, repeat the iOS `Open` dismissal once as a second optional tap. Keep both taps inside the existing iOS-only system-dialog block; when the first dismissal holds, the second is inert, and no later flow or app assertion changes.
- [x] 10.2 Run the Maestro selector guard and applicable YAML/format checks, record the terminal gate artifact and prior passing control in the handoff, then push a material exact head for a fresh labeled gate.

## 11. Match Android's padded native search placeholder

The superseded `e13152ee` Android job reached `onboarding.yaml` after passing the
preceding ten top-level flows, including `feedback`. Its failure artifact shows the
native search field expanded and visibly rendering `Search schools`, while the UI
hierarchy reports `text: "   Search schools"`. Maestro anchors text regexes, so the
exact selector cannot match Android even though the field is present and focused.

- [x] 11.1 Change the shared placeholder selector to `.*Search schools`, accepting Android's native leading-space projection while still requiring the complete locale-stable label and matching the exact iOS value without a platform branch.
- [x] 11.2 Run the focused selector/format/OpenSpec proofs, push the material fix, and require a fresh exact-head baseline plus Android/iOS gate.

## 12. Classify the captured iOS deep-link reopen timeout

Exact-head iOS job `98877231676` at `e03237dd` completed `launchApp(clearState)` and
`stopApp`, then failed its first deep link before any assertion. The complete captured
`IOSDriver.openLink` + `NSPOSIXErrorDomain` + `code=60` + `Simulator device failed to open` +
`Operation timed out` conjunction identifies a simulator-command transport timeout while
reopening the app. Triage amendment #4 authorizes only this third positive shape.

- [x] 12.1 Add an independent classifier branch after the assertion guard that requires all five captured fragments. Keep the existing session-creation and first-`launchApp` branches unchanged, the four-attempt maximum, a fresh Maestro process per attempt/flow, one server lifecycle, and the original non-zero result on exhaustion.
- [x] 12.2 Add a captured positive fixture proving retry and continuation, plus negative cases proving assertion evidence wins and partial, generic-timeout, application, and unknown failures remain terminal.
- [x] 12.3 Refine ADR 038, `testing.md`, the Architecture Book changelog, the E2E README, and the agent handbook from two to three positive shapes; update this delta with the complete conjunctive rule and scenarios. This is a sensitive binding-document refinement, not a new decision.
- [x] 12.4 Run the focused shell harness proof, shell syntax and formatting checks, OpenSpec validation, and `git diff --check`; then push a material exact head before taking a fresh labeled baseline plus Android/iOS gate.

## 13. Correct the deep-link signature to the real captured punctuation

Exact-head iOS job `98888496592` at `d788a881` passed `about`, `appearance-settings`,
`calendar` (including the real local seeded import), and `environment-switch`, then hit
the amendment-#4 deep-link timeout in `event-checklists` and was still marked terminal.
Section 12's classifier required the literal `NSPOSIXErrorDomain code=60`, but Maestro
prints `(domain=NSPOSIXErrorDomain, code=60)`; the section 12.2 fixture had silently
dropped that comma, so it never reproduced the captured signature. The other four
fragments were present and no assertion evidence matched.

- [x] 13.1 Require `NSPOSIXErrorDomain` and `code=60` as independent mandatory fragments alongside `IOSDriver.openLink`, `Simulator device failed to open`, and `Operation timed out`. The rule stays a complete conjunction — five fragments now — with the assertion guard first, four attempts maximum, a fresh Maestro process per attempt/flow, one server lifecycle, and the original non-zero result on exhaustion.
- [x] 13.2 Replace the positive fixture with the exact captured CI lines, punctuation included, and prove it retries in a fresh Maestro process and continues to the next flow. Add negative coverage for omission of the domain fragment and omission of the code fragment; retain the assertion, partial, generic-timeout, application, and unknown negatives.
- [x] 13.3 Correct ADR 038, `testing.md`, the Architecture Book changelog, the E2E README, the agent handbook, and this delta to the five-fragment wording, recording why the domain and code are matched independently. Sensitive binding-document surface; still a refinement of the existing bounded decision, so no new ADR.
- [x] 13.4 Run the focused shell harness proof, shell syntax/format checks, OpenSpec validation, and `git diff --check`; push the material head and take a fresh labeled baseline plus Android/iOS gate. Do not rerun `d788a881` unchanged.

## 14. Replace the signature classifier with a structural rule, and gate the workflow proof

Exact-head gate `33187454002` at `dfc8c82f` vindicated every selector repair — Android
reached flow 5 of 14 through `TEST ENVIRONMENT · Local`, a real seeded import, the agenda
round-trip and a full environment switch — and then failed two new ways. Android
`event-checklists` exposed a genuine application defect (a controlled `TextInput` over an
async live query drops typed characters), split out as TIM-268 and explicitly **not** to be
worked around in the flow. iOS `about` attempt 2 recorded `launchApp(clearState)` stuck at
`RUNNING` with **no exception text anywhere** in the harness log, so no signature could
match and two of four attempts were spent on a flow that evaluated zero assertions. That is
the fourth distinct startup shape and the third to cost a full native cycle; the matching
strategy is the defect. Triage amendment #6 authorizes a structural rule that subsumes the
three signatures, plus the F1 gate-coverage fix.

- [x] 14.1 Classify each attempt from Maestro's own per-flow `commands.json`: retryable only when the output holds no assertion evidence, no assertion command reached `COMPLETED`/`FAILED`, and the last recorded command is a startup-phase command — or no record exists at all. Collapse the three stack-trace signatures into it rather than adding a fourth. Keep the assertion guard first, the four-attempt maximum, one Maestro process per attempt/flow, one shared server lifecycle, flow order, and the original non-zero status on exhaustion. Fail closed on a malformed record.
- [x] 14.2 Prove the rule in `test_run_e2e.sh` in both directions: the captured no-assertion `launchApp` shape retries (with a fixture that emits **no** error text, so only the record can classify it), a session that never opened the flow retries, a deep-link reopen that never completed retries, a declined (`SKIPPED`) assertion inside startup retries; and an evaluated assertion — `COMPLETED` or `FAILED` — stays terminal even when the last command is a startup one, assertion evidence in the output wins over the record, a failure past startup stays terminal, a malformed record stays terminal, and a deterministic launch failure exhausts the budget and exits non-zero.
- [x] 14.3 F1: add `.github/workflows/ci-mobile-e2e.yml` to `ci-mobile.yml`'s push paths and invoke `test_run_e2e.sh` + `test_ci_mobile_e2e.sh` from the baseline job, so the workflow build contract is checked by a gate that actually fires on a change to that file alone. Extend `test_ci_mobile_e2e.sh` to assert those three baseline invariants.
- [x] 14.4 Refine ADR 038 in place — three positively identified shapes become one structural rule, with the deterministic-launch-failure bound stated plainly — and align `testing.md`, the Architecture Book changelog, `mobile/e2e/README.md`, `docs/agent-dev-environment.md`, and this delta. Sensitive binding-document surface; no new ADR, since this narrows an existing bounded decision.
- [x] 14.5 Verify locally: both harness proofs, mutation-check that each proof discriminates, classify the real captured `commands.json` artifacts from run `33187454002` in both directions, `bash -n`, YAML parse, mobile lint/typecheck/Jest, OpenSpec strict validation, `git diff --check`.
- [x] 14.6 TIM-268 ships **inside this PR**, not through `main`: its fix landed on this branch at `743f220`, so there is no `main` round-trip and no rebase, and TIM-268 closes from this PR's device evidence rather than from a separate gate. (Supersedes the original plan to land it on `main` first and let the `pull_request` merge ref pick it up.)
- [ ] 14.7 Pin the echo-drain prefix semantics the `743f220` fix depends on: a second lagging echo after the first, so replacing `written.current.slice(echo + 1)` with `written.current = []` fails the suite. One echo alone cannot discriminate the two.
- [ ] 14.8 Take a fresh labeled exact-head baseline plus Android/iOS gate on the head carrying both the TIM-268 fix and its pinning test. Do not rerun `dfc8c82f` or `1d0254b` unchanged, and keep the `run-e2e` label on.

## 15. Merge `main`, and clear the last two below-the-fold reveals

Diagnostic gate `33193527228` at `2871377c` reached flows 6 and 7 — `feedback` and `home` —
that no earlier run had ever got to, and failed at both for the amendment-#3a reveal reason
rather than any application defect: the debug screenshots show the app rendering correctly in
each case. In the same window PR #293 went `CONFLICTING`, because `main` landed `#297`
(removing the non-production environment banner) while this branch's `environment-switch.yaml`
still asserted `TEST ENVIRONMENT · Local` — a string that no longer renders in the merged
tree. Triage amendments #9 and #10 specify both repairs and make a fresh Android + iOS run at
the merged head the acceptance gate, superseding any green measured at `2871377c`.

- [x] 15.1 Resolve the `main` merge with `git merge origin/main` — no rebase, no force-push. Take `origin/main`'s `mobile/.maestro/environment-switch.yaml` verbatim: it is a strict superset of this branch's copy, already carrying the `settings-environment` reveal, the iOS-composed-label regex, and the re-navigation after the destructive reset. Keep both `CHANGELOG.md` entries with `#297`'s first. Leave no `TEST ENVIRONMENT · …` assertion anywhere in `mobile/.maestro/**`, revive no `backend-environment-marker`, and revert no part of `#297`.
- [x] 15.2 Centre the `feedback.yaml` reveal (`centerElement: true`). `settings-feedback` is not the last row on Settings — the environment section renders below it — so the scroll stops as the row peeks in at the bottom edge under the iOS floating tab bar; the hierarchy reports it visible, the scroll and the `tapOn` both report `COMPLETED`, and the tap lands on the bar's middle button (Calendar at the row's centre X). Android's non-floating bar never overlapped, which is why only iOS failed. `environment-switch.yaml` stays untouched: `settings-environment` genuinely is the last element, so it bottoms out clear of the bar.
- [x] 15.3 Reveal `E2E Today Lecture` in `home.yaml` with a bounded `scrollUntilVisible` + `centerElement`, keeping the `assertVisible` regex unweakened. The today timeline is a fixed-scale grid topped at the day's first timed event (`dynamicHourRange`, 10:00) and does not auto-scroll to now, so the 14:00 lecture sits four hours of pixels below a ~two-hour viewport. Wait on the 10:00 `E2E Overlap A` tile first so the scroll cannot race the startup sync and exhaust an empty grid. No `mobile/src` change, no platform fork.
- [ ] 15.4 Acceptance gate: baseline plus Android and iOS native green on the merged head, with the complete per-flow result recorded — `feedback` and `home` named explicitly, per criterion 7. A gate green only at `2871377c` is not evidence for the merged tree and must not be reported as the exact-head signal.
- [ ] 15.5 Before archive, define and record signal (c)'s closure check: baseline run `33194849747` @ `ac1aa586` is Android terminal at `calendar`/`import-seed` and iOS terminal at `about` on a no-command-record abort; the post-merge `main` run is expected to clear both. Record that the Reviewer owns the post-merge check and keeps TIM-264 open until its verdict. Still terminal at Android `calendar` ⇒ the capability fix did not survive the squash-merge; still terminal at iOS `about` ⇒ the structural classifier is not doing what section 14 claims. This task records the pre-merge baseline, expectations, and owner only; it does not claim the post-merge result before merge.

## 16. Drive the event-details action through its native accessibility label

Exact-head gate `33197588645` at `b882b86c` passed the first six flows on both platforms,
including `feedback`, then reached `hidden-events`. The iOS artifact rendered the visual
header title `Hide`, but its hierarchy exposed only `Hide this event`, matching the app's
explicit accessibility label; the stale visual-text selector therefore failed before opening
the chooser. Android independently displayed a system ANR dialog after the deep-link restart,
caused by a timed-out Google measurement service bind rather than an application assertion or
backend failure. The selector repair is material and cross-platform; the next labeled gate
determines whether that unrelated Android platform flake clears without broadening retry policy.

- [x] 16.1 In `hidden-events.yaml`, address the event-details header action by its shipped accessibility label, `Hide this event`, then select the identically labelled native Alert option. Preserve the shared flow, deep-link sequence, seeded-title assertions, and hide/un-hide round trip; touch no `mobile/src` or retry-classifier surface.
- [ ] 16.2 Run the focused selector/YAML/OpenSpec proofs, push the material head with `run-e2e` retained, and require a fresh exact-head baseline plus Android/iOS gate through the complete flow set. Record `33197588645`'s Android system ANR and iOS stale accessibility-label selector as diagnostic evidence, not acceptance.

## 17. Classify startup transport failures within the final restart epoch

Run `33200667041` at `1c950751` proved the global completed-assertion veto was too broad:
`hidden-events` completed its nested import assertion at depth 1, then began a new depth-0
`stopApp` → `openLink` lifecycle whose final command failed with the known iOS simulator
transport timeout. No command before that final startup failure had status `FAILED`.

- [x] 17.1 Classify the final restart epoch from the latest explicit `launchAppCommand`, `stopAppCommand`, or `openLinkCommand` at the failing command's depth. Ignore a `COMPLETED` assertion before that boundary, but keep the captured-output assertion guard first and globally terminal; keep any earlier `FAILED` assertion or other command globally terminal; and keep an evaluated assertion or non-startup interaction in the current epoch terminal. Preserve fail-closed malformed records, four attempts maximum, one Maestro process per attempt/flow, one shared server lifecycle, lexical order, and the original non-zero status on exhaustion.
- [x] 17.2 Add the captured 12-command shape and prove a fresh-process retry can pass and continue. Pin negatives for an earlier failed assertion, assertion evidence in output, an earlier failed interaction, an evaluated assertion or non-startup interaction in the current epoch, malformed records, and deterministic exhaustion. Mutation-test the restart-boundary and global-failure guards, and classify the downloaded run artifact directly.
- [x] 17.3 Refine ADR 038, `testing.md`, the Architecture Book changelog, the E2E README, the agent handbook, and this delta to the phase-local rule. This is a sensitive binding-document correction, not a new ADR.
- [ ] 17.4 Commit the material repair, merge current `origin/main` without rebase or force-push while keeping every changelog entry with main's entries first, push both commits together with `run-e2e` retained, and require baseline plus complete Android and iOS green on that final exact head before archive.

## 18. Disambiguate the collided hide-chooser selector

Section 16 made the hide action address the header button by its real accessibility label,
`Hide this event`. That repair was correct and it was also ambiguous: the native Alert
chooser option carries the byte-identical string from a different i18n key
(`eventDetails.hide.actionLabel` vs `eventDetails.hide.thisEvent`). Run `33206115891` at
`7366f4bf` — Android 14/14, iOS terminal at flow 7 — captured both `tapOn`s resolving to the
same element, the 48x44pt header button at `[334,62][382,106]`. The chooser was never tapped,
the event was never hidden, and `assertNotVisible: "E2E Today Seminar(,.*)?"` failed
correctly, three steps downstream of the tap that actually went wrong.

- [ ] 18.1 In `hidden-events.yaml`, select the Alert chooser option by an anchor no header
      element can satisfy: `below:` the Alert title `Hide event` (`eventDetails.hide.title`), a
      full-match regex that cannot match `Hide this event` and which the header — drawn above the
      alert on both platforms — can never sit under. Gate it on the chooser actually being
      presented with an `extendedWaitUntil` on `Hide all events of the same name`, an element
      unique to that surface, so an alert that never opens fails at a named step instead of
      silently re-tapping the first match. One cross-platform selector, no platform fork, the
      hide/un-hide round trip unchanged; `below:` confirmed parsed by `maestro check-syntax` at
      the pinned 2.8.0, and the anchor confirmed present in the iOS hierarchy by that run's
      simulator log walking `Checking 'Hide event'` 0.18s before the second tap resolved.
- [ ] 18.2 Take a fresh labeled exact-head baseline plus Android/iOS gate on the head carrying
      the anchor. Read a red `hidden-events` by naming the step: at the `extendedWaitUntil` the
      alert did not present or iOS composed its options into one element; at the second `tapOn`
      the `below:` candidate set was empty; at `assertNotVisible` with both taps resolving to
      different elements the hide itself is broken — an application defect and the only one of
      the three outside this ticket's flow-only scope.
- [ ] 18.3 Record the collision class in the `mobile-e2e` delta: a selector that is correct can
      still be ambiguous, and the disambiguating anchor plus its presence gate belong in the spec,
      not only in the flow's comment header. Note that the repository proof cannot observe runtime
      ambiguity and that the symptom surfaces at a downstream assertion naming an unrelated
      element.

## 19. Replace the platform-asymmetric back navigation in the settings flow

Run `33211705313` at `be665c66` was the best gate yet — Android 14/14, iOS 12/14 including
`hidden-events` (section 18's anchor proven on the platform it was failing on), `feedback`
and `home`. It went terminal at flow 13 `settings`, on `back`. iOS has no hardware back key,
so Maestro issues a left-edge swipe; on the native-stack `My calendars` screen it reported
`COMPLETED` without popping, and the captured `step-016` hierarchy still showed
`My calendars` 60s later. Android drives the same command through its hardware key, so the
defect was structurally invisible on one platform for as long as the flow has existed.

- [x] 19.1 Replace both `back` steps in `settings.yaml` with the `stopApp` + `launchApp` cold
      restart `about.yaml` already uses to re-enter the hub, re-tapping the `Settings` tab. One
      cross-platform idiom, no per-platform fork. The header back button is not a usable
      alternative: iOS exposes it as id `BackButton` with the accessibility label `(tabs)`, and
      Android's toolbar navigation icon exposes neither, so no shared selector exists.
- [x] 19.2 Assert `settings-theme-picker` on the Appearance destination. `Appearance &
language` is also the hub's own row label, asserted earlier in the same flow, so it could
      never have proven the push happened — the leg was passing vacuously. The picker testID
      exists only on the destination and is where `appearance-settings.yaml` lands.
- [x] 19.3 Guard the rule in `maestro-selectors.test.ts`: no flow may carry a bare `back`.
      The existing proof reads selectors only and structurally could not see a command. Verified
      by mutation — reintroducing `- back` fails the suite at the exact file and line — with a
      parser test pinning that it is not matching vacuously. `maestro check-syntax` accepts the
      repaired flow at the pinned 2.8.0.
- [ ] 19.4 Take a fresh labeled exact-head baseline plus Android/iOS gate on the head carrying
      the repair. Read a red `settings` by naming the step: at the post-restart `Settings` wait the
      restart itself failed; at `settings-theme-picker` the Appearance row did not push — a real
      navigation defect and the only one of the two outside this ticket's flow-only scope.
- [ ] 19.5 Extend the per-flow handoff record of task 15.4 to name `settings` and
      `user-calendars` alongside `feedback` and `home`. `settings` is the flow this section
      repairs, so its iOS result is the repair's only device evidence. `user-calendars` is flow 14
      and every prior gate went terminal before reaching it, so a green iOS job here is the
      **first execution of that flow on iOS in the project's history** — a bare "14/14 both
      platforms" does not record that. Its sole construct unproven on iOS is
      `assertVisible: "No calendars imported."`; that string renders as a `ThemedText` sibling in
      a plain `View` (`user-calendars-screen.tsx:126-132`), not inside a pressable, so the
      iOS-collapses-a-pressable composition that section 18 fixed cannot apply and an empty state
      has nothing below the fold. A red flow 14 is therefore new information to diagnose on its
      own terms, not a recurrence of that class.
- [ ] 19.6 Record the platform-asymmetric command class in the `mobile-e2e` delta: a command
      can report `COMPLETED` while being a no-op on one platform, so the flow must re-enter a root
      screen with the shared `stopApp` + `launchApp` restart idiom and the repository proof must
      reject a bare `back`, naming the file and line. Note what distinguishes this class from the
      below-the-fold class (section 9, recorded by the `A flow reaches a row below the fold`
      scenario) and the collision class (18.3) — it is statically decidable, because the command is
      a literal in the flow, and it must be caught statically, since the platform that passes hides
      it and the platform that fails reports it as a timed-out assertion against the screen the
      flow believed it had already left.

## 20. Size the cold-launch readiness waits for a degraded runner

Run `33216821519` at `8dba4521` was Android 14/14, every flow attempt 1/1, and iOS terminal at
flow 4 `environment-switch` — at its own launch gate, with 4 recorded commands and no
flow-specific step executed. `environment-switch.yaml` is byte-identical to the version that
passed on iOS at both `7366f4bf` and `be665c66`, and the head's only diff from `be665c66` is
`settings.yaml` (flow 13) plus a Jest guard, neither of which runs before flow 4. The runner
was measurably degraded: `launchApp` alone took 75.8 s, and `about` burned two startup aborts
before passing on attempt 3/4. The 60 s wait then elapsed in full — a genuine timeout, not an
instant miss.

The retry budget cannot absorb this. The same condition was classified both ways in that one
job: `about` was caught while `launchApp` was still `RUNNING` (retryable startup), while
`environment-switch` was caught one command later, after `launchApp` flipped to `COMPLETED`
(terminal). One command's worth of timing decided it. Closing that gap would mean retrying an
`assertConditionCommand FAILED`, which weakens the assertion guard — the invariant that makes
a green gate mean anything. The gap is recorded as known and accepted; the wait is what moves.

- [x] 20.1 Raise every `extendedWaitUntil: visible: "Settings"` that immediately follows a
      `launchApp` from `60000` to `120000` — exactly seven sites in five flows: `about.yaml`,
      `environment-switch.yaml`, `feedback.yaml`, `settings.yaml` (three), `user-calendars.yaml`.
      Nothing else moves: no other timeout, selector, ordering, `mobile/src`, classifier, or retry
      budget. Verified mechanically — seven waits raised and no other `timeout: 120000` anywhere in
      `mobile/.maestro/**`.
- [x] 20.2 Record the provenance at the `environment-switch.yaml` site: the measured 75.8 s
      launch, run `33216821519`, and why the retry budget structurally cannot cover a launch-gate
      timeout. A bound without its measurement reads as arbitrary and gets "cleaned up" later.
- [x] 20.3 Confirm no repository proof asserts these blocks literally before editing them.
      `test_run_e2e.sh`, `test_ci_mobile_e2e.sh`, and `maestro-selectors.test.ts` contain no
      `extendedWaitUntil` or timeout literal, so the baseline cannot redden on the change — this is
      exactly the literal-block coupling that makes PR #292 unmergeable, checked rather than assumed.
- [ ] 20.4 Take a fresh labeled exact-head baseline plus Android/iOS gate on the head carrying
      the raise. Read a red `environment-switch` by naming the step: still at the launch gate after
      120 s means the app genuinely fails to boot on iOS and the diagnosis in this section is wrong;
      anywhere past it is a different class diagnosed on its own terms. Android's 14/14 at
      `8dba4521` is corroboration only, not the accepting signal.
- [ ] 20.5 Record the cold-start readiness class in the `mobile-e2e` delta: a readiness wait is
      a bound on the device, not a claim about the app, so it is sized for the slowest observed
      runner and carries its provenance; widening it is sound only because it is one-directional
      and cannot produce a false green; and the class is told apart from a true assertion failure
      by its command record — a handful of commands ending at the launch gate, versus the collision
      class's many commands against a genuinely-rendered element.
- [ ] 20.6 Residual, deliberately not changed and recorded so it is diagnosed rather than
      rediscovered: `environment-switch.yaml`'s **second** `Settings` wait (after `Clear and
switch`) stays at `60000`. It follows `Updates.reloadAsync()`
      (`src/features/environment/data/switch.ts:30`), a JS-runtime restart with the native process
      already warm — not a `launchApp`, so it is outside the enumerated class. If a future gate dies
      there, this is the one-line fix and it needs no new diagnosis.

## 21. Make the hide fixture outlive a UTC midnight

Exact-head gate [33220510226](https://github.com/timecalendar/timecalendar/actions/runs/33220510226)
at `24af3e91` was baseline green and Android 14/14; iOS passed six flows including `feedback`
and went terminal at flow 7 `hidden-events`. The Alert repair from section 18 is proven by that
artifact — the header tap, the chooser-presence wait, and the anchored chooser tap all completed,
and the reopened week showed every seeded event except the target. The Agenda then rendered
`No events this period.`: the server seeded the today cluster on Aug 28, the long job crossed UTC
midnight, and the newly mounted Agenda anchored its window on Aug 29. The agenda window is
`[today 00:00, today + 7 days)` and **forward-only**
(`mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts:47-51`), so
both the hidden target and its non-hidden control were on the excluded previous day. A pure
date defect, failing where it reads exactly like a broken hide.

- [x] 21.1 Seed contract. Split the hide fixture out of the today cluster in
      `server/src/scripts/seed-e2e-calendar.ts`: `E2E Hide Seminar` / `e2e-hide-seminar` at
      16:00–18:00 UTC on the UTC day **after** the seed run, plus `E2E Hide Control` /
      `e2e-hide-control` at 14:00–16:00 on that same day. Titles are date-neutral on purpose. The
      today cluster does not move: `E2E Today Lecture` and `E2E Overlap A`/`B` stay seed-day
      anchored, because `home.yaml` asserts the _today_ timeline and no other anchor satisfies it.
      The event set moves behind a pure `buildE2eCalendarEvents(now)`; `seedE2eCalendar` keeps only
      the database side.
- [x] 21.2 Flow, docs and selector alignment. `mobile/.maestro/hidden-events.yaml` follows the
      rename at every reference — the stable details deep link, the three title assertions, the
      `Un-hide` label, and the header comment — with the command order, both Agenda switches, the
      cross-platform Alert anchor, and the hide → absent → manage → un-hide → present round trip
      unchanged and no assertion weakened. `mobile/e2e/maestro-selectors.test.ts` follows the
      `Un-hide` label; it reads the seeded titles from the seed script itself, so the rest
      re-checks itself. `mobile/e2e/README.md` gains the seed-date rule as checklist item 7 and
      `docs/mobile/architecture-book/testing.md` + `CHANGELOG.md` record it as the binding contract.
- [x] 21.3 A non-hidden control must share its target's day — the one place this section departs
      from the triage brief, which said to keep `E2E Today Lecture` as the control. It cannot be
      kept: the control is asserted **through the same Agenda**, so post-rollover it falls out of
      the forward-only window exactly as the target did, and the flow would still fail — one
      assertion earlier, at `extendedWaitUntil: "E2E Today Lecture(,.*)?"` instead of at
      `assertNotVisible`. The control's _role_ is what the brief protects (an empty Agenda must not
      satisfy `assertNotVisible` vacuously) and that role is preserved in full by `E2E Hide Control`
      on the target's own day. A control that does not outlive the crossing its target survives
      stops guarding on precisely the run that needs it.
- [x] 21.4 Focused rollover proof. `server/src/scripts/seed-e2e-calendar.spec.ts` pins
      `now = 2026-08-28T23:30:00Z` and observation at `2026-08-29T00:30:00Z`, mirroring the agenda
      window and `intersectsRange` from their real sources, and proves: `E2E Hide Seminar` is
      Aug 29 16:00–18:00 UTC and intersects the window from **both** anchors; `E2E Hide Control`
      shares that day and both intersections; `E2E Today Lecture` is still Aug 28; uids and titles
      are unique; and the month boundary rolls (`2026-08-31` → `2026-09-01`). The control arm
      mutates the target back to the seed day and asserts it is **excluded** after midnight, so a
      window check that accepted everything cannot make the rest vacuous. No database is mocked —
      the builder is pure, and a mocked repository would have exercised TypeORM rather than the
      arithmetic that broke. 10/10 green locally.
- [x] 21.5 Record the seed-date class in the `mobile-e2e` delta: a fixture seeded once is
      observed by a device clock that keeps moving, so the failure is a date-contract defect and not
      a defect in the feature under test; an agenda-asserted fixture is anchored on the next UTC day
      with a date-neutral title; a control shares its target's day; the today-timeline exception
      keeps its anchor with the residual exposure pinned; and the contract is proven by a pure
      builder rather than a mocked repository.
- [ ] 21.6 Take a fresh labeled exact-head baseline plus Android/iOS gate on the head carrying
      this section. Read a red `hidden-events` by naming the step: at the first
      `extendedWaitUntil: "E2E Hide Seminar(,.*)?"` on the details screen means the renamed uid did
      not resolve; at `E2E Hide Control` means the next-day anchor is not in the Agenda window and
      this section's diagnosis is wrong; at `assertNotVisible` after both taps completed means the
      hide itself is broken — the only one of the three outside this ticket's fixture scope.
      Android's 14/14 at `24af3e91` is corroboration only, not the accepting signal.
- [ ] 21.7 Residual, deliberately not changed and recorded so it is diagnosed rather than
      rediscovered: `calendar.yaml`, `event-checklists.yaml` and `home.yaml` still assert the
      seed-day today cluster, so a job that crosses UTC midnight _before_ those flows fails the same
      way `hidden-events` just did — `home.yaml` structurally cannot be fixed by an anchor move,
      since the today timeline is what it exists to assert. Pinned by the seed proof's
      "carries the recorded one-midnight exposure" case, so the asymmetry is a visible contract
      rather than a gap. The real fixes are a shorter job or a re-seed before the calendar-family
      flows; both are outside this ticket, and neither is justified by a single observed crossing.

## 22. Size the measured row-50 Activity pagination traversal

Exact-head run `33330342869` at `0ba41571` reached the same first pagination scroll on both
platforms after proving the real-server Activity import, unread badge, first-page interactions,
cancelled-row behavior, and refresh. The 60-second `tie-higher` traversal expired while both
artifacts still showed forward progress: Android at fillers 40-42 and iOS at fillers 31-33.
The target is row 50, so this is a bounded traversal deficit rather than a missing selector or
stuck list.

- [x] 22.1 Raise only the `activity-new-e2e-activity-tie-higher` `scrollUntilVisible` timeout
      from 60000 to 120000 in `mobile/.maestro/activity.yaml`, with provenance naming the run,
      row 50, and both observed progress ranges. Preserve selector, direction, command order,
      assertions, and the `tie-lower` / `older-anchor` 60000 bounds.
- [x] 22.2 Extend `mobile/e2e/activity-maestro-selectors.test.ts` with an ordered structural
      proof that pins the three pagination selectors to `tie-higher` 120000, `tie-lower` 60000,
      and `older-anchor` 60000. The proof must fail if the first bound is reverted, either later
      bound is widened, or their order changes.
- [x] 22.3 Record the measured long-pagination class in the `mobile-e2e` delta: only the
      evidenced row-50 traversal receives the wider bound, while the later page assertions and
      scroll bounds stay unchanged.
- [x] 22.4 Run the focused Activity Jest proof, confirm its timeout mutations fail, run Maestro
      YAML syntax, OpenSpec strict validation, formatting for the touched TypeScript/YAML, and
      `git diff --check`, then push the material head with `run-e2e` retained.
- [ ] 22.5 Require the fresh exact-head baseline plus Android and iOS native jobs to pass all
      17 top-level flows. Record both complete per-flow lists and prove Activity continues through
      `tie-higher`, `tie-lower`, and `older-anchor` over the real local server path before archive.

## 23. Reopen Activity pagination when the held-calendar set expands

TIM-433's exact-head verdict at `699d8614` reached and asserted `tie-higher` on both platforms,
then stopped at the bottom of the cached list without ever requesting the second page. The initial
baseline-only refresh had stored `olderPageComplete=true`; after the second calendar was imported,
the newest-page write correctly preserved that state for an unchanged held set but incorrectly
treated it as complete for the expanded set. `loadOlderPage` therefore returned `complete` before
reading a token or issuing a request.

- [x] 23.1 Extend the app-lifetime held-calendar observer into ownership reconciliation. On an
      observed addition after the first loaded baseline, clear only the older-page cursor/completion
      state and force the existing newest-page coordinator. Preserve removal pruning, hidden-calendar
      treatment, cached rows, read watermark, unread count semantics, cursor recovery, and the
      independent newest/older single-flight slots; do not add a calendar-sources → Activity edge.
- [x] 23.2 Add mutation-sensitive regression coverage for the exact sequence: a baseline calendar
      completes its chain, a second held calendar appears, the expanded newest page adopts a cursor,
      and `loadOlderPage` requests and stores the following page. Assert the baseline row and read
      watermark survive, the server unread count remains authoritative, and an overlapping
      sync-triggered newest refresh is joined rather than duplicated. Replacing the reset with a no-op
      must fail at the older-page outcome.
- [x] 23.3 Run the focused Activity repository/coordinator/lifecycle suites, mobile typecheck and
      lint, strict OpenSpec validation, formatting, and `git diff --check`; inspect the complete diff
      for no selector, timeout, flow-order, server/API/schema, credential, deployment, native/store,
      or legacy Flutter change.
- [ ] 23.4 Push the material head with `run-e2e` retained and require a fresh exact-head baseline
      plus Android and iOS 17/17. Activity must reach `tie-higher`, `tie-lower`, and `older-anchor`
      through the real local server before Reviewer handoff; do not archive before that verdict.

## 24. Reveal the restored hide target below the Agenda fold

Exact-head Android job `99359339017` in run `33349187760` proved the Activity repair through
`tie-higher`, `tie-lower`, and `older-anchor`, then reached `hidden-events`. The hide chooser,
absence check, management-screen row, and `Un-hide E2E Hide Seminar` tap all completed. On the
final Agenda, the artifact showed `E2E Hide Control` only partially visible at the bottom edge;
the following 16:00 seminar row was below the viewport, so the non-scrolling 60-second
`extendedWaitUntil` expired. This is the section 9 below-the-fold class, not a failed un-hide.

- [x] 24.1 Replace only the final restored-target wait in `hidden-events.yaml` with a downward,
      centred `scrollUntilVisible` for `E2E Hide Seminar(,.*)?`, followed by the same positive
      `assertVisible`. Preserve the hide/absence/manage/un-hide order, Alert anchor, non-hidden
      control, selectors, and 60-second bound.
- [x] 24.2 Pin the final reveal structure in `maestro-selectors.test.ts`, and extend the existing
      below-the-fold delta scenario to name the restored Agenda target and its following positive
      assertion. The proof must fail if the scroll is replaced by a plain wait, centring is removed,
      or the terminal assertion is removed.
- [x] 24.3 Run the focused selector proof, mutation-check the three protected properties, parse
      the flow with pinned Maestro 2.8.0 when locally available, run applicable formatting, strict
      OpenSpec validation, and `git diff --check`; push with `run-e2e` retained.
- [ ] 24.4 Require a fresh exact-head baseline plus Android and iOS 17/17. `hidden-events` must
      complete the unchanged non-vacuous hide/un-hide round trip, and Activity must again reach all
      three pagination assertions before Reviewer handoff; do not archive before that verdict.

## 25. Follow the merged unlisted-institution journey to URL import

Exact-head run `33351996623` at `eac37ec9` passed Activity pagination, the calendar family,
`feedback`, `hidden-events`, and `home` on both platforms, then failed identically in
`ical-import`. Both command traces completed the `onboarding-school-missing` tap and timed out
at `Add a calendar by URL`; the Android artifact showed the new `Which institution?` screen.
Merged commit `a10ab396` intentionally changed the action from a direct URL-screen jump to the
institution → programme → connect → manual-import journey, leaving this flow's reachability
assumption stale.

- [x] 25.1 Extend only `ical-import.yaml`'s reachability half through the shipped unlisted-
      institution journey using the existing cross-platform ids, then select `onboarding-import-url`.
      Preserve the welcome/school entry proof, the URL-screen title, the empty-submit validation,
      flow ordering, and the no-platform-fork contract.
- [x] 25.2 Pin the ordered journey edges in `maestro-selectors.test.ts`, including the institution
      and programme inputs, both Continue actions, the connect Continue action, the manual-import URL
      choice, and the unchanged URL-screen title assertion. The proof must fail if the obsolete direct
      jump is restored or the manual-import choice is bypassed.
- [x] 25.3 Record the merged-journey drift class in the `mobile-e2e` delta and run the focused
      selector proof, mutation-check its ordered route contract, parse the YAML with pinned Maestro
      2.8.0 when available, run applicable formatting, strict OpenSpec validation, and
      `git diff --check`; push with `run-e2e` retained.
- [ ] 25.4 Require a fresh exact-head baseline plus Android and iOS 17/17. `ical-import` must
      complete the new institution/programme/connect/manual-import reachability chain and retain its
      empty-submit validation before Reviewer handoff; do not archive before that verdict.

## 26. Synchronize the controlled rename input before Save

Exact-head Android job `99378208040` in run `33355905670` completed the rename dialog's first
erase, input, and Save commands, but persisted `E2E Renamed Timetablee`: the final seeded `e`
crossed the controlled-input erase/echo boundary at the same command timestamp. The exact-title
assertion failed correctly, so the flow must settle the local field before permitting the server
write rather than accepting the corrupted value.

- [x] 26.1 In `user-calendar-rename.yaml`, retain the focused input tap and first `eraseText`, add
      a second consecutive `eraseText`, enter `E2E Renamed Timetable`, and wait up to 15 seconds for
      one selector that conjunctively matches `id: user-calendar-rename-input` and the exact target
      text before tapping Save. Preserve the baseline, local-write, wipe/re-import,
      server-convergence, and baseline-absence assertions.
- [x] 26.2 Extend `maestro-selectors.test.ts` with a focused structural proof that pins the input
      tap, two erase boundaries, target input, exact conjunctive value wait, Save ordering, and the
      existing local/server assertions. The proof must fail if the second erase or exact wait is
      removed, the wait is widened, or Save moves before it.
- [ ] 26.3 Require a fresh exact-head baseline plus Android and iOS 17/17. The rename flow must
      persist exactly `E2E Renamed Timetable` locally and after a wiped-device server re-import.

## 27. Wait for actionable iCal Continue controls

Exact-head iOS job `99377897981` in run `33355905670` entered `E2E Institution`, then Maestro's
`hideKeyboard` failed even though the captured hierarchy showed the input unfocused and
`onboarding-institution-continue` visible and enabled. The dismiss command established no useful
precondition and prevented an already-actionable CTA from running.

- [x] 27.1 Remove exactly the two terminal `hideKeyboard` commands from `ical-import.yaml`. After
      each institution/programme `inputText`, wait up to 15 seconds for its existing Continue id and
      retain the matching tap immediately after the wait. Preserve every route edge, entered value,
      CTA interaction, manual-import URL choice, URL-screen assertion, and empty-submit validation.
- [x] 27.2 Extend the focused iCal journey proof to pin each input → matching Continue wait →
      matching Continue tap sequence and reject any `hideKeyboard`. The proof must fail when a
      terminal command returns, a bounded wait disappears, or a CTA is bypassed or reordered.
- [ ] 27.3 Require a fresh exact-head baseline plus Android and iOS 17/17. `ical-import` must
      traverse both Continue controls and complete the existing manual-import validation journey.

## 28. Repair checklist-progress navigation after merging the shipped summary journey

Exact-head native run `33359726956` checked out the pull-request merge result and reached the
checklist-summary journey added by `main`, while the push baseline checked the older branch head.
Both platforms then failed on the removed `calendar-view-agenda` id. The merged flow also carried
a bare `back`, which can report success without leaving native-stack details on iOS, and bare
seeded-title selectors that do not match iOS's composed accessible event container.

- [x] 28.1 Merge current `origin/main` without rebase or force-push, then preserve the complete
      add → type → toggle → Agenda `1/1` progress → reopen → hard-delete round trip while replacing
      the stale agenda id and every bare `E2E Today Lecture` event-container selector.
- [x] 28.2 Replace the post-toggle bare `back` with the shared state-preserving cold re-entry:
      `stopApp` → calendar deep link → optional iOS `Open` → bounded Calendar wait → shared
      `calendar-view` / `Agenda` navigation before the exact progress-id assertion.
- [x] 28.3 Extend the focused checklist-progress proof to pin that ordered re-entry and reject the
      stale agenda id, bare seeded title, or bare `back`; retain production progress-id source proof
      and the add/toggle/delete assertions. Record the measured merge-result drift and cross-platform
      re-entry rule in the `mobile-e2e` delta.
- [ ] 28.4 Require a fresh exact-head baseline plus Android and iOS 17/17. `event-checklists` must
      prove the real local SQLite add/toggle/progress/reopen/delete round trip on both platforms, and
      the handoff must record both complete per-flow lists before archive.

## 29. Re-enter the personal-events root after cancelling deletion

Merged `personal-events.yaml` carried the same platform-asymmetric bare `back` forbidden by
section 19. Android's hardware key pops the edit screen, while Maestro can report a completed
left-edge swipe on iOS without leaving a native-stack screen. The cancellation proof must retain
the durable row, so the repair re-enters the owning route without clearing application state.

- [x] 29.1 Replace only the post-Cancel bare `back` with `stopApp` →
      `openLink: timecalendar-dev://personal-events` → optional iOS `Open`, then wait up to 60 seconds
      for the exact `Maestro CRUD event` row before reopening it. Preserve the create, Cancel,
      form-still-open, confirmed Delete, and final exact-absence assertions; do not use `clearState`.
- [x] 29.2 Extend `maestro-selectors.test.ts` with a focused ordered proof for Cancel → edit-form
      assertion → state-preserving cold re-entry → exact preserved row → reopen → confirmed Delete →
      exact absence. Mutation checks reject a returned bare `back`, removed or reordered re-entry,
      and either weakened row assertion.
- [x] 29.3 Record the cancelled-destructive-prompt native-stack class in the `mobile-e2e` delta
      and run the general selector suite, focused mutations, pinned Maestro 2.8.0 syntax, strict
      OpenSpec validation, applicable formatting, zero-bare-back scan, and `git diff --check`.
- [ ] 29.4 Require a fresh exact-head baseline plus Android and iOS 17/17. `personal-events` must
      prove the complete create → cancel-delete → preserved row → confirmed delete → absent journey
      on both platforms before archive.

## 30. Prove checklist persistence without a keyboard navigation command

Exact-head Android job `99406336168` in run `33365735943` typed `Buy notebook`, then the final
`hideKeyboard` reported `COMPLETED` while acting as Android Back and returning to Agenda. The row
was persisted, but the next assertion ran against the wrong screen. The repair must prove the
value in the live input, then prove the persisted row after state-preserving re-entry before any
toggle.

- [x] 30.1 Remove the final `hideKeyboard` from `event-checklists.yaml`; require a 15-second
      selector conjunctively matching `id: checklist-input-.*` and exact `text: "Buy notebook"`, then
      cold re-enter Calendar without `clearState`, reopen `E2E Today Lecture(,.*)?`, assert the typed
      row, and only then toggle it. Preserve the later cold re-entry, exact `progress-1-1`, reopen,
      hard-delete, and exact absence proof.
- [x] 30.2 Extend the focused checklist/general Maestro proof and mutation cases to reject any
      returned `hideKeyboard`, removed or widened exact input-value gate, removed or reordered
      pre-toggle re-entry, or loss/reordering of add → type → persist → toggle → progress → delete →
      absent. Assert `mobile/.maestro/**` contains zero `hideKeyboard` commands.
- [x] 30.3 Run the focused selector/mutation suite, parse `event-checklists.yaml` with pinned
      Maestro 2.8.0, run applicable formatting and lint, strict OpenSpec validation, and
      `git diff --check`. Confirm no selector id, top-level flow order, Architecture Book rule, or
      production behavior changed.
- [ ] 30.4 Require the fresh material exact head to pass the branch baseline plus Android and iOS
      17/17. Record both complete flow lists and explicitly name `event-checklists` before archive.

## 31. Keep onboarding Continue controls tappable above the keyboard

Exact-head iOS job `99405887796` in run `33365735943` exposed
`onboarding-institution-continue` at bounds `[24,581][378,629]` while the keyboard covered that
region. Maestro selected the correct id, but its tap landed in keyboard/prediction chrome, changed
`E2E Institution` to `E2E Institutiont`, and never left the institution route. The programme form
uses the same centered body-CTA layout and carries the same latent terminus.

- [x] 31.1 Update only `institution-name-screen.tsx`, `programme-screen.tsx`, and the minimum
      shared/local styles to apply the established `KeyboardAvoidingView` plus scroll/tap-handling form
      pattern. Keep both body Continue controls visibly above and tappable through the iOS keyboard;
      preserve Android behavior, validation, draft writes, route targets, Skip, labels, ids, and
      entered values, with no new dependency or keyboard primitive.
- [x] 31.2 In shared `ical-import.yaml`, retain both explicit CTA-id waits and taps, but precede
      each with a 15-second selector conjunctively matching the exact input id/value pair:
      `onboarding-institution-input` + `E2E Institution`, then `onboarding-programme-input` +
      `E2E Programme`. Do not add `hideKeyboard`, Return submission, coordinates, optional commands,
      deep-link bypasses, or platform forks.
- [x] 31.3 Add focused component and Maestro structural/mutation coverage that pins keyboard-safe
      layout semantics on both screens and each input → exact-value gate → CTA wait → CTA tap sequence.
      The proof must fail if either iOS CTA can return behind the keyboard, either exact gate is
      removed/widened, either CTA is bypassed/reordered, or any `hideKeyboard` returns.
- [x] 31.4 Run the two focused component suites, focused Maestro selector/mutation proof, pinned
      Maestro 2.8.0 syntax for `ical-import.yaml`, TypeScript/lint as applicable, formatting, strict
      OpenSpec validation, and `git diff --check`. Confirm the local layout repair does not change a
      binding Architecture Book contract; binding Architecture Book edits remain out of scope.
- [ ] 31.5 Require the same fresh material exact head to pass the branch baseline plus Android and
      iOS 17/17. Record both complete lists and explicitly name `activity`, `event-checklists`,
      `feedback`, `home`, `ical-import`, `settings`, `user-calendar-rename`, and the first complete iOS
      `user-calendars` result before archive.

## 32. Reveal a focused checklist input covered by the keyboard

Exact-head Android job `99432675919` in run `33374278029` typed `Buy notebook` and retained the
focused checklist input with the exact value, but its bounds `[136,1596][628,1691]` sat below the
keyboard beginning around y=1280. Maestro therefore marked the input not visible and the exact-value
readiness gate expired. Persistence is intact; the flow must reveal the same exact input before
applying its visibility gate.

- [x] 32.1 Immediately after `inputText: "Buy notebook"`, add one shared downward
      `scrollUntilVisible` selecting `checklist-input-.*` and exact `Buy notebook`, requiring 100%
      visibility, centring, and a 30000 ms bound. Preserve the following exact 15000 ms readiness
      gate and the complete cold re-entry → persisted row → toggle/progress → delete/absence order.
- [x] 32.2 Extend `event-checklists-maestro-selectors.test.ts` with ordered structural and mutation
      proof rejecting a removed, widened, late, uncentred, or partially-visible reveal and any
      weakening of the existing exact gate or persistence round trip. Record the measured class in
      the `mobile-e2e` delta.
- [x] 32.3 Run the focused checklist proof and mutations, pinned Maestro 2.8.0 syntax, strict active
      OpenSpec validation, applicable formatting/lint, and `git diff --check`; confirm no selector id,
      application/layout, top-level flow order, workflow, binding-document, server, or fixture change.
- [ ] 32.4 Require the fresh material exact head to pass the branch baseline plus Android and iOS
      17/17. Record both complete lists and explicitly name `activity`, `event-checklists`, `feedback`,
      `home`, `ical-import`, `settings`, `user-calendar-rename`, and the first complete iOS
      `user-calendars` result before archive.
