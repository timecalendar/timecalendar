## 1. Typed startup preference and importer target

- [x] 1.1 Add `StartupTabPreference = "home" | "calendar"`, `settings.startupTabPreference`, and a total Home-defaulting parser to `mobile/src/features/settings/prefs/types.ts`; export through the prefs/feature barrels. Verify with parser tests for both valid values plus missing, empty, mixed-case, non-string-at-mapper, and unknown input.
- [x] 1.2 Add imperative get/set and reactive hook APIs in `settings/prefs`, with all writes going through `@/storage`. Verify Home and Calendar round-trip and hook updates under the real MMKV Jest seam.
- [x] 1.3 Enumerate the key in `mobile/src/storage/index.ts` and classify it environment-independent. Extend storage classification/reset tests to prove a backend-bound clear preserves it and type coverage remains exhaustive.
- [x] 1.4 Add the pure Flutter `startup_screen` mapper and imperative import setter target. Test exact `home`/`calendar` mapping, Home fallback for every unsupported shape, and delegation to the ordinary setter; do not read Flutter native prefs or add an importer/no-op importer hook.

## 2. Settings destination and localized native choice

- [ ] 2.1 Add a thin `/startup-settings` root Stack route and a Settings `ui/` picker screen following the owned `@/components/chrome` Host/Picker pattern, with Home/Calendar selected state and immediate persistence through `useStartupTabPreference`.
- [ ] 2.2 Add the working Startup screen row after Appearance & language in the Settings Preferences group, including platform icons, full-row navigation, stable testID, localized label/hint, large-text-safe layout, and 44pt iOS / 48dp Android target.
- [ ] 2.3 Add complete flat FR/EN keys for the row, route title, control label, Home, Calendar, hints, and accessibility copy; run the typed catalog parity check through TypeScript.
- [ ] 2.4 Extend Settings screen and route-structure tests to prove group order, `/startup-settings` registration/thin export, localized copy, current selection, both option callbacks, a11y semantics, and that selection calls only the setter with no router navigation.

## 3. Ordered launch prerequisite and decision seams

- [ ] 3.1 Refactor database startup migration into one memoized/idempotent promise that the launch runtime can await, preserving `@/firebase` recording and propagating failure to the blocking launch state. Update migration tests for single-flight success, retry-safe failure, and no storage consumer before resolution.
- [ ] 3.2 Add a startup feature with a pure resolver over initial path, killed-state notification intent, held-calendar identity, and parsed preference. Unit-test the full precedence matrix: explicit deep link, notification event/Calendar, empty identity onboarding, Home/default, Calendar, invalid preference, and no later rerun.
- [ ] 3.3 Add one root-mounted launch coordinator inside the environment/query providers and beside the Stack. Order migration → documented Phase 09 insertion point → initial intent → held-calendar read → fallback, snapshot the preference once, re-check current navigation before fallback replace, and retain `unstable_settings.initialRouteName = "(tabs)"` unchanged.
- [ ] 3.4 Add a process-lifetime launch state seam consumed by readiness and tabs-only secondary gates; prevent Changelog or any other automatic tabs presentation until the winning launch route is committed. Add component/route tests that later Settings changes, onboarding/import completion, and explicit navigation never reapply the fallback.
- [ ] 3.5 Add a localized accessible blocking launch-failure surface with idempotent Retry for migration/identity-read failure. Test error recording, no tabs mount/eligibility, retry recovery, and watchdog fail-closed behavior.

## 4. Notification cold-start integration

- [ ] 4.1 Refactor `features/notifications/data/tap-routing` so exactly one initial-notification seam supplies a parsed killed-state intent to launch resolution; retain the existing pure parser, sync, Activity refresh, and observability behavior.
- [ ] 4.2 Keep foreground messages as sync/refresh with no navigation and background taps as sync/refresh then navigation, with listener cleanup unchanged. Extend notification tests to cover those non-launch states after the refactor.
- [ ] 4.3 Add killed-state tests proving `getInitialTap()` is consumed once, a valid event/Calendar target beats Home/Calendar/onboarding, null/invalid input allows normal resolution, and sync/Activity fan-out retains its existing success/failure isolation.

## 5. Splash and first-paint commitment

- [ ] 5.1 Replace `useAppReady()`'s migration placeholder with the launch state: normal readiness only after the observed pathname matches the winning destination; blocking failure readiness only after its error surface is ready. Preserve native-to-JS handoff, reduced motion, and accessible loading status.
- [ ] 5.2 Extend splash/coordinator component tests for Home, Calendar, onboarding, deep-link, notification, and failure paths. Include a focused assertion that Calendar-winning launch cannot call native hide/remove the JS overlay while Home is observed and becomes eligible only after `/calendar` is observed.
- [ ] 5.3 Verify the initial Home mount stays visually covered and tabs-only effects stay inert until commitment, without dynamically reordering Home · Calendar · Settings or changing their canonical URLs/back behavior.

## 6. Maestro cold-launch parity and CI proof

- [ ] 6.1 Add a shared `mobile/.maestro/startup-tab.yaml` flow using the existing dev-import seed to establish held identity, Settings to select Home then Calendar, and `stopApp` → plain `launchApp` cold relaunches that positively assert the chosen destination each time. Use shared stable testIDs/text and 60-second post-launch waits; do not create platform-specific flows.
- [ ] 6.2 Validate Maestro YAML/static harness discovery locally and update `mobile/e2e/README.md` if the new durable-state ordering needs explanation; do not claim device execution on this no-KVM/no-iOS-simulator host.
- [ ] 6.3 After implementation is pushed, add the PR `run-e2e` label and require both `e2e-mobile-android` and `e2e-mobile-ios` jobs to pass at the exact reviewed head. Record the workflow URLs/SHAs in the issue handoff; a stale or post-merge-only run is not this change's native proof.

## 7. Architecture Book, migration guidance, and device-only evidence

- [ ] 7.1 Add a load-bearing ADR for single-owner launch resolution, precedence, one-shot lifecycle, `(tabs)` anchor preservation, Phase 09 insertion point, and splash commitment; include rejected competing-effects and dynamic-trigger-order alternatives.
- [ ] 7.2 Update `docs/mobile/architecture-book/navigation.md` with the resolved launch sequence and intent precedence, `storage.md` with the environment-independent key/import target and blocking migration order, `features.md` with the Settings destination/startup owner, and `testing.md` with the cold-relaunch/first-paint proof pattern.
- [ ] 7.3 Update `docs/react-native-migration/01-roadmap/09-data-migration.md` to name `mapFlutterStartupScreen`/the setter as the target after native `flutter.startup_screen` read, and Phase 10 parity guidance to record this gap as implemented once tasks are complete. Do not claim the Phase 09 importer exists.
- [ ] 7.4 Add the Architecture Book `CHANGELOG.md` entry for the binding launch rule. Do not modify `app/`; cite Flutter provider/tabs/splash files only as behavior evidence.
- [ ] 7.5 Create one non-blocking `docs/react-native-migration/inbox/` note tagged `(HUMAN: startup-tab device pass)` for physical-device first-paint recording, VoiceOver/TalkBack, large text, and platform-native picker review. Mark observability as covered by prerequisite failure recording and product analytics N/A with the reason that selecting a local launch default is not a funnel/server action.

## 8. Local green and handoff evidence

- [ ] 8.1 Run Prettier on changed files, then focused preference/resolver/Settings/notification/splash suites while iterating; ensure logic branches meet the 90% threshold.
- [ ] 8.2 Run the complete mobile local gate from `mobile/`: `npx tsc --noEmit`, `npm run lint`, and `npm test -- --coverage`. Record exact commands/results; do not touch OpenAPI/generated, native/store/EAS, server migrations, deploy/CI workflows, or Flutter production files.
- [ ] 8.3 Run `openspec validate configure-mobile-startup-tab` and confirm every task is checked with evidence or explicitly handed to the named non-blocking human inbox note before implementation-stage handoff.
