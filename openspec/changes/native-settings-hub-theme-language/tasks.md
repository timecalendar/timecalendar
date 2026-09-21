## 1. Native settings chrome contract

- [x] 1.1 Add project-owned native settings host, section, row-kind, switch-row, checkmarked-choice, and radio-dialog contracts under `mobile/src/components/chrome/`; keep all new `@expo/ui` universal/SwiftUI/Compose imports inside the chrome boundary and export only the stable contracts from the barrel.
- [x] 1.2 Implement the iOS host with one SwiftUI Form/Section scroll owner and the Android host with one Material LazyColumn/ListItem scroll owner; feed every Host the scheme resolved by `@/hooks/use-color-scheme` and leave Router headers/insets/navigation outside the native host.
- [x] 1.3 Implement closed navigation/action/value/switch/selection row semantics, including full-row activation, navigation-only disclosure, noninteractive values, selected accessibility state, and exactly one toggle per row or trailing-control activation.
- [x] 1.4 Extend `mobile/jest/setup-expo-ui.ts` only with installed primitives, slots, modifiers, dismiss callbacks, and selected-state behavior used by the contract; add focused chrome tests for both platform branches, scheme propagation, row semantics, and one-scroll-owner composition.

## 2. Complete theme journey first

- [x] 2.1 Recompose Appearance on iOS as a native form with inline System/Light/Dark checkmarked rows wired directly to `useThemePreference`, retaining the existing thin `/appearance-settings` route.
- [x] 2.2 Recompose Appearance on Android as native value/action rows whose Theme row opens a Material single-choice radio dialog; commit and close on selection, and leave the preference unchanged on Cancel, outside dismissal, or Back.
- [x] 2.3 Add behavior tests for all three choices, current selected/value state, immediate app/navigation/host recoloring, app/device scheme disagreement, and every Android dismissal path.
- [x] 2.4 Stop before extending the composition to language and record the theme checkpoint: focused iOS/Android tests must be green, scroll/inset/Router ownership must be inspected against the real host structure, and any available device observations must be recorded; if this execution host has no simulator/device, record the outstanding owner-led D05 device acceptance without claiming it as automated proof.

## 3. Native settings hub and compatibility consumers

- [x] 3.1 Move the hub onto the native settings host while preserving group order, every existing destination, calendar-summary loading/empty/populated behavior, unread badge, Show weekends switch, normal localized section casing, and capability-gated Environment section.
- [x] 3.2 Turn `SettingsRow` and `SettingsSection` into typed compatibility adapters over the native contract, preserving current router/action/value props and ensuring plain actions never acquire navigation disclosures.
- [x] 3.3 Adapt About to the native host without redesigning its prose or actions, and keep Environment selection/confirmation behavior working inside the hub; retain localized failure/status behavior and route targets.
- [x] 3.4 Update hub, About, and Environment suites to exercise both platform branches, whole-row routing/action, noninteractive values, switch single-toggle behavior, summary loading/empty state, badge, environment gating, large-text-friendly structure, and absence of native-host errors.

## 4. Native language journey

- [x] 4.1 Add an iOS language selection screen under settings UI plus a thin `/language-settings` route and root Stack registration; push it from Appearance through Router and render exactly Use device language, Français, and English as one native checkmarked list.
- [x] 4.2 Add the Android Language value/action row and cancellable Material radio dialog using the same three choices and the shared selection contract.
- [x] 4.3 Wire both platform journeys to `useLanguagePreference`; add tests for all choices, retained selection, translated current-page/title/native-control labels, translated Router context, one scroll owner on the iOS push, and Android Cancel/outside/Back preservation.

## 5. Bounded app-lifetime locale refresh

- [x] 5.1 Refactor the supported-locale resolver to accept an explicit locale list while preserving `getLocales()` for synchronous startup/manual system resolution and English fallback for unsupported lists.
- [x] 5.2 Add one root-mounted locale synchronizer using public `expo-localization.useLocales()`; return early for explicit `fr`/`en`, and in `system` mode call `i18n.changeLanguage` only when the newly resolved locale differs from the active resolved language.
- [x] 5.3 Update localization mocks to the real installed `getLocales()`/`useLocales()` contract and add tests for startup fallback, all three stored choices, supported/unsupported changes, duplicate events, explicit-override protection, current-page translation, single-listener ownership, and cleanup on unmount.

## 6. Specifications and Architecture Book

- [x] 6.1 Add an Architecture Book ADR for the platform-native settings composition, theme-aware Host boundary, Router/scroll ownership, and compatibility-adapter policy; reconcile ADR 010 rather than silently contradicting its thin-wrapper rule.
- [x] 6.2 Update `theming.md`, `navigation.md`, `i18n.md`, `testing.md`, affected feature documentation, and `CHANGELOG.md` to describe the current native settings and locale-refresh contracts, their automated proof boundary, and owner-led device acceptance.
- [x] 6.3 Reconcile the archived historical language/settings statements through the change's `mobile-settings-hub`, `mobile-settings-screen`, and `mobile-i18n` deltas; run `openspec validate native-settings-hub-theme-language --strict` and resolve every issue.

## 7. CI proof and local-green verification

- [x] 7.1 Add a focused CI proof test in the existing `test-mobile` Jest inventory that fails if native settings bypasses chrome, gains a second scroll owner, loses theme propagation, or regresses system-locale duplicate/explicit-override protection.
- [x] 7.2 Run affected chrome, settings, About/environment, preference, theming, root-layout, and i18n Jest suites after their edits and record the exact passing commands and commit.
- [x] 7.3 From `mobile/`, run `npm run react-doctor:changed`, generated-client drift verification (`npm run generate` followed by a clean `src/api/generated` diff), `APP_VARIANT=development npx expo customize tsconfig.json`, `npx tsc --noEmit`, `npm run lint`, and `npm test -- --coverage`; fix failures without changing excluded API/native/CI surfaces.
- [x] 7.4 Prepare the D05 owner device checklist for iOS grouped surfaces, Android continuous list/ripple and dialog cancellation, both themes, app/device scheme disagreement, French/English and back-title translation, large text, screen readers, phone/tablet sizing, hub destinations, summary/badge/weekend state, and About/environment consumers; record it as release evidence, not a separate ticket or repository-merge gate.
