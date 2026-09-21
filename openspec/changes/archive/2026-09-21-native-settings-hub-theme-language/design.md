## Context

The settings hub currently owns a React Native `ScrollView`, custom `SettingsSection` surfaces, and custom pressable rows. Appearance & language is one responsive `RootPage` containing two universal menu `Picker`s. Preference persistence and live theme/language setters are already correct and must remain the source of truth.

The installed SDK contracts support the intended native boundary without a new dependency. `@expo/ui` 56.0.17 exposes SwiftUI `Host`, `Form`, `Section`, `Button`, `Toggle`, and list primitives, plus Compose `Host`, `LazyColumn`, `ListItem`, `Switch`, `AlertDialog`, and `RadioButton`. Universal `Host` accepts a `colorScheme`. `expo-localization` 56.0.6 exposes public `useLocales()`, whose implementation subscribes to the native locale-change event and removes its subscription on unmount. Expo Router remains the only navigation owner.

The base specifications contain two historical contradictions that this change must retire: `mobile-settings-screen` mandates universal menu pickers, while `mobile-i18n` says there is no persisted language override even though the preference store and runtime setter already exist.

## Goals / Non-Goals

**Goals:**

- Make the hub, theme, and language complete platform-native journeys on iOS and Android.
- Establish reusable, theme-aware native settings host, section, row, switch, choice-list, and radio-dialog contracts inside `@/components/chrome`.
- Preserve route destinations, summary semantics, badge, weekend preference, environment capability, stored values, and compatibility consumers.
- Follow device-locale changes during app lifetime only in `system` language mode, with one effective i18next transition per actual supported-locale change.
- Keep one native scroll/inset owner per page inside the existing Router stack.

**Non-Goals:**

- Redesign About, timezone, notifications, or permission behavior.
- Add a navigation framework, locale package, native bridge, OS app-language integration, or supported-locale configuration migration.
- Change preference keys, defaults, API contracts, schema, native/store configuration, deployment workflows, or the legacy Flutter app.
- Claim pixel fidelity, Dynamic Type, or screen-reader quality from host tests; those remain owner-led device acceptance.

## Decisions

### Decision 1 — Chrome owns platform-native settings composition

Add a stable settings composition under `mobile/src/components/chrome/` with platform files. The public contract expresses a page host, sections, navigation/action/value rows, switch rows, checkmarked choices, and single-choice dialogs. Feature code supplies translated copy, current values, callbacks, test identifiers, and route actions; it does not import `@expo/ui` subpaths.

The iOS implementation composes one SwiftUI `Form` containing `Section`s and native row controls. The Android implementation composes one Material `LazyColumn` containing section headers and `ListItem` rows, with Material switches and dialogs. The page host, not `RootPage`, `ScrollView`, or a nested native list, is the sole scroll owner. Expo Router continues to own headers, pushes, back behavior, and modal policy; no SwiftUI `NavigationStack` or Compose navigation layer is introduced.

The wrapper may use the installed universal components where their contract exactly matches, but its exported API is project-owned. This prevents feature code and compatibility consumers from depending on alpha package details and lets platform composition differ without conditional logic in screens.

Alternatives rejected: retaining the custom rows or universal menu pickers misses the approved native-fidelity outcome; exporting raw platform primitives throughout features expands alpha-API churn; wrapping a native list in the existing React Native scroller creates two scroll/inset owners.

### Decision 2 — Row kind is a closed semantic contract

Native rows distinguish navigation, action, value, switch, and selection semantics. Navigation rows alone display a disclosure affordance and invoke a Router action. Action rows activate a callback without gaining a disclosure. Value rows are noninteractive and expose their value. Switch rows make the whole row activate the same state transition as the control while preventing double toggles. Selection rows expose selected/checkmarked state to assistive technology.

`SettingsRow` and `SettingsSection` remain compatibility adapters over the native contract long enough for About and the environment selector to retain their existing typed call sites. The settings hub and About adopt the native page host required by those adapters; environment remains capability-gated inside the hub. Tests cover old router/action/value consumers so compatibility is behavioral, not only type-level.

Alternative rejected: preserving the custom row implementation beside native rows would create two visual and accessibility contracts and make later timezone/notification reuse unreliable.

### Decision 3 — Theme is the first end-to-end native proof

Implement a complete theme journey on both platforms before extending the shared composition to language. On iOS, the Appearance page shows System, Light, and Dark as inline native rows with one checkmark. On Android, a theme row displays the current choice and opens a Material single-choice radio dialog. Selection persists immediately through `useThemePreference`; Android selection closes the dialog, while Back/outside/cancel leaves storage unchanged.

Every native `Host`, including dialog content, receives the scheme resolved by the existing `@/hooks/use-color-scheme` seam. The host therefore updates with an explicit app override even when it disagrees with the device, while system fonts, spacing, and neutral platform surfaces remain native. Navigation continues to receive the same resolved scheme through `buildNavTheme`.

The first implementation checkpoint must run focused iOS/Android behavior tests and record real-host device observations for scroll, insets, navigation, current selection, and app/device scheme disagreement before language reuses the contracts.

Alternative rejected: building both journeys before validating the host would multiply the highest-risk integration assumptions.

### Decision 4 — Language reuses the selection model but follows each platform's journey

The language choices are exactly Use device language, Français, and English. iOS navigates from Appearance to a Router-owned language page containing one native checkmarked list. Android opens a cancellable Material radio dialog from the Appearance row. Selection calls the existing language preference setter immediately, preserving the stored union and i18next live update. The current page title, row labels, dialog labels, navigation title, and selection state rerender in the new language without remounting or losing the choice.

Add a thin `/language-settings` route for the iOS push and register it beside existing root routes. It remains harmless but unused by the Android composition. The existing `/appearance-settings` URL and every hub destination remain stable.

Alternative rejected: one shared picker fails the native journey requirement; introducing OS app-language settings would change the product and native configuration boundary.

### Decision 5 — Public `useLocales()` is the app-lifetime listener

Mount one small locale synchronizer in the root application lifetime. It reads `useLocales()`, the stored language preference, and the existing supported-locale resolver. In an effect, it returns immediately for explicit `fr`/`en`; in `system` mode it resolves the supplied locale list and calls `i18n.changeLanguage` only when the result differs from the current resolved language. Duplicate native events therefore produce no duplicate transition. The public hook owns native subscription cleanup on unmount; tests mock the public hook result rather than inventing an unsupported event API.

Refactor locale detection only enough to accept an explicit locale list while retaining `getLocales()` as the startup/manual default and English as the unsupported-language fallback. The module-scoped i18next instance still initializes synchronously once. If the installed hook cannot be mounted without broad lifecycle machinery, omit runtime refresh and document that D04 fallback instead of adding an AppState or native event framework.

Alternatives rejected: importing private `addLocaleListener` is not a public package contract; listening to AppState is not a locale event; changing i18next on every event causes redundant renders; explicit preferences following the device would violate stored user intent.

### Decision 6 — Verification is layered and the Architecture Book stays authoritative

Native Expo UI mocks gain only the real primitives and callbacks used by the wrapper. Contract tests prove row kinds, full-row activation, selection state, Android cancellation, host scheme propagation, and one scroll owner. Feature tests retain hub summary loading/empty behavior, unread badge, weekend switch, destinations, environment gating, and About action/value/navigation consumers. Locale tests cover all choices, current-page translation, unsupported fallback, duplicate events, explicit override protection, and cleanup through the public hook contract.

Update the theming, navigation, i18n, testing, Architecture Book changelog, and any affected feature map text. No new top-level Maestro journey is added because the repository's three-journey device budget excludes detailed settings variants; owner-led device acceptance covers grouped iOS surfaces, continuous Material lists/ripple, both themes, French labels, large text, screen readers, back-title translation, phone/tablet sizing, and dialog dismissal.

## Risks / Trade-offs

- [Alpha native primitives differ subtly across platforms or SDK patches] → keep every import and platform adapter inside chrome, prove the installed package types, and validate theme first on real hosts.
- [Native Form/LazyColumn sizing creates a blank or nested-scrolling page] → give the host the available viewport and make Form/LazyColumn the only scroll owner; assert the ownership structure and inspect both platforms.
- [A compatibility consumer assumes React Native layout around a row] → migrate About to the native host and cover its action, value, and navigation rows plus error copy; test the capability-gated environment row in the hub.
- [A row and its trailing switch both fire] → centralize activation in the chrome row contract and behavior-test one transition per tap path.
- [Changing language while a native page/dialog is open leaves stale labels] → pass translated strings as reactive props and test the current mounted surface after `changeLanguage`.
- [Locale events arrive repeatedly or while explicit mode is active] → compare the resolved supported locale before changing i18next and return early for explicit preferences.
- [Host tests overstate platform fidelity] → keep device acceptance explicitly owner-led and do not add a separate QA ticket or merge gate.

## Migration Plan

1. Land the project-owned native host/row/selection contracts and mocks, then convert theme end to end and validate its native host behavior.
2. Convert the hub and compatibility consumers without changing route targets or preference data.
3. Add the iOS language route, Android language dialog, and app-lifetime locale synchronizer using the same selection model.
4. Reconcile specs and Architecture Book text, run focused tests followed by the mobile local-green gate, and retain owner device acceptance as release evidence.

Rollback removes the new presentation and synchronizer while leaving all existing preference keys and stored values valid. No data or API migration is required.

## Open Questions

None blocking. The exact internal mix of universal versus platform-specific Expo UI primitives may be chosen during implementation only if the public chrome contract, one-scroll-owner rule, and required native outcomes remain unchanged.
