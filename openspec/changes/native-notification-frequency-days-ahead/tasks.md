## 1. Pure notification choice and validation model

- [x] 1.1 Add feature-owned immutable frequency and horizon option models plus a pure stored-value-to-choice selector; unit-test all three frequencies, presets 1/3/7/14/30, nonpreset values, and the invariant that exactly one horizon choice is selected.
- [x] 1.2 Add a pure custom-days validator that trims surrounding whitespace, accepts decimal digits resolving to 1..30 without clamping, and returns localized validation states; table-test blank, signed, fractional/comma, exponent, nonnumeric, pasted invalid, boundary, out-of-range, whitespace, and leading-zero inputs.
- [x] 1.3 Keep existing notification preference keys/defaults/parsers and setters unchanged as the canonical commit path; extend preference/hook tests to prove values remain retained while `isActive` is false and one valid custom confirmation causes one dirty-before-write publication.

## 2. Native settings chrome and test harness

- [x] 2.1 Add the smallest project-owned settings numeric-editor contract under `mobile/src/components/chrome/`: SwiftUI form content for the Router sheet and a Material numeric dialog for Android, with translated actions/messages, stable identifiers, numeric keyboard hints, focus/keyboard ownership, native observable buffers, and current-buffer submission; do not reuse or alter the excluded iOS custom overlay.
- [x] 2.2 Route iOS Cancel/Done, Android Cancel/Save, hardware Back, and outside-tap policy through explicit callbacks; ensure chrome owns only platform mechanics while the feature owns parsing, error choice, persistence, and dismissal-after-success.
- [x] 2.3 Extend `mobile/jest/setup-expo-ui.ts` only for the installed SwiftUI/Compose fields, keyboard options/modifiers, buffers, buttons, dialog properties, and dismissal callbacks actually used by the new contract.
- [x] 2.4 Add focused chrome tests for both platform branches covering resolved color scheme, current native-buffer submission, numeric keyboard configuration, native identifiers/accessibility message structure, explicit actions, Android Back/outside policy, and absence of a second scroll/navigation owner.

## 3. Native notification parent and Android journeys

- [x] 3.1 Recompose `NotificationSettingsScreen` with `NativeSettingsHost`, sections, native switch, platform-correct frequency/horizon rows, localized summaries/help, and the existing shared status/Retry contract; remove `RootPage`, universal `Picker`, React Native switch, and the plus/minus stepper.
- [x] 3.2 On Android, add frequency and horizon Material radio-dialog state using string choice tokens; verify current selection, Cancel/outside/Back write-free behavior, immediate single commit/dismissal for frequency and presets, and Custom opening without a synthetic write.
- [x] 3.3 Add the Android custom numeric dialog initialized from the effective stored value on each open; keep invalid drafts open with localized validation, discard Cancel/Back drafts, and call `setNbDaysAhead` exactly once before closing on a valid Save.
- [x] 3.4 Refactor the shared notification synchronization status into a feature-owned reusable presentation as needed, preserving pending/waiting/error/acknowledged accessibility and Retry while keeping the T05 runtime and hook as the sole state owner.

## 4. iOS pushed choices and native custom sheet

- [x] 4.1 Add feature UI screens and one-line route exports for iOS frequency and days-ahead choice pages; register them in the root Stack, render one native host/checkmarked list per page, and cover Router-native Back with zero writes before a choice.
- [x] 4.2 Wire iOS frequency and preset rows to one immediate setter call followed by Router return; show preset-equivalent values as their preset and other valid values as Custom with the saved localized count.
- [x] 4.3 Add a thin custom-days route registered as an iOS Router `formSheet` with native grabber/detent options, and render the settings-specific SwiftUI numeric editor with explicit Cancel/Done rather than the existing overlay.
- [x] 4.4 Seed the iOS draft from the effective stored value on every presentation; prove Custom opening, Cancel, native Back where available, and swipe/unmount write nothing, while one valid Done persists once and returns to the chooser/parent with shared status intact.
- [x] 4.5 Extend root route-inventory tests to pin every thin export, localized feature-owned title/action, compact-versus-sheet registration, form-sheet options, and the absence of nested navigation or scroll containers.

## 5. Localization, behavior coverage, and CI proof

- [x] 5.1 Replace obsolete stepper/picker keys with typed parity-matched FR/EN keys for sections, switch intent, frequency summaries/descriptions, horizon presets/Custom, plural day values, editor actions, validation, accessibility, five-minute processing, and 19:00 Paris scheduling.
- [x] 5.2 Expand notification screen/child tests across iOS and Android for every frequency, preset, current selection, stored custom 2/12/29, custom boundaries 1/30, off-state retention, open/cancel/reopen, invalid pasted drafts, single confirmation commit, light/dark host props, and FR/EN labels/plurals.
- [x] 5.3 Add integration coverage proving a locally committed choice survives a failed sync and child unmount, and that parent-visible pending/error/Retry continues to use T05's shared runtime without a second mutation, token listener, generated client import, or storage path.
- [x] 5.4 Add an ordinary Jest-discovered CI contract test that fails when preset-over-Custom selection, cancellation write guards, single-commit cardinality, chrome-only Expo UI imports, or one-scroll/Router ownership is intentionally broken; restore the mutation and record the exact focused green command.

## 6. Architecture Book and specification reconciliation

- [x] 6.1 Update Architecture Book navigation and feature/current-state guidance with Router-owned notification pushes/form sheet, one native scroll owner, retained off-state values, shared synchronization status, and the unchanged permission/DTO/server-schedule boundaries.
- [x] 6.2 Update Architecture Book i18n, accessibility, and testing guidance with fixed-schedule copy, plural/validation behavior, accessible selected/error state, native-buffer host proof, and the owner-device boundary for geometry, keyboard, dismissal feel, large text, themes, and VoiceOver/TalkBack.
- [x] 6.3 Add a dated `docs/mobile/architecture-book/CHANGELOG.md` entry and cite existing ADRs 056/060 plus approved D01/D03/D04/D05; add no new ADR unless implementation evidence actually displaces one of those load-bearing decisions.
- [x] 6.4 Reconcile the accumulated `mobile-fcm-subscription` and `mobile-architecture-book` requirements with the implemented route names and behavior, then run `openspec validate native-notification-frequency-days-ahead` and resolve every error.

## 7. Local green, scope proof, and handoff evidence

- [x] 7.1 Run edited pure, chrome, notification UI/data, route-structure, localization, and runtime integration suites directly; record exact commands, results, and tested commit in the implementation handoff.
- [x] 7.2 Run the complete mobile gate from `mobile/`: `npx tsc --noEmit`, `npm run lint`, and `npm test -- --coverage`; confirm notification logic meets the 90% logic threshold and the project retains the 70% global floor.
- [x] 7.3 Run applicable device-free checks from `.github/workflows/ci-mobile.yml`, including generated-client drift and the existing harness/workflow contract tests, without adding or editing CI workflow files.
- [x] 7.4 Verify `git diff -- openapi/openapi.json mobile/src/api/generated server mobile/app.config.ts mobile/eas.json mobile/firebase server/src/migrations terraform k8s .github/workflows app` shows no sensitive or out-of-scope change; separately confirm the DTO enum/range and server five-minute/hourly/19:00 Europe/Paris schedules are unchanged.
- [x] 7.5 Record the owner-led release acceptance surfaces—iOS grouped lists/form sheet/swipe, Android rows/radio and numeric dialogs/Back, keyboard confirmation reachability, phone/tablet, FR/EN, themes and app/device mismatch, large text, accessible selected/errors, VoiceOver/TalkBack—without claiming those checks from mocks or making them a repository merge gate.
