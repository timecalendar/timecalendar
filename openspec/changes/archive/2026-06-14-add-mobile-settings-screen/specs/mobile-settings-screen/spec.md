## ADDED Requirements

### Requirement: Settings screen is a presentational component with a thin route
The Settings screen SHALL be a **presentational** component at `mobile/src/components/settings-screen.tsx`
(tested beside it), reachable through a thin route `mobile/src/app/settings.tsx` that only re-exports
it (`export { default } from "@/components/settings-screen"`). The screen SHALL own no preference
logic, persistence, or validation — it SHALL delegate all preference state to the Settings feature's
existing hooks (`useThemePreference`, `useLanguagePreference`). Because it is presentational, it SHALL
fall under the 70% global coverage floor and SHALL NOT be subject to the 90% per-path logic threshold
(ADR 003).

#### Scenario: The screen lives in components with a thin route
- **WHEN** the Settings screen and its colocated test are located
- **THEN** the screen is at `mobile/src/components/settings-screen.tsx` and its test beside it
- **AND** `mobile/src/app/settings.tsx` only re-exports the screen (no logic, no colocated test)

#### Scenario: The screen owns no preference logic
- **WHEN** the Settings screen reads or writes a preference
- **THEN** it does so through the existing `useThemePreference` / `useLanguagePreference` hooks
- **AND** it adds no new preference store, validator, or persistence

### Requirement: Native controls reached only through the @expo/ui chrome wrapper
The Settings screen's native controls SHALL be rendered through a chrome wrapper
`mobile/src/components/chrome/expo-ui.tsx` that is the single import site for `@expo/ui`, exported from
the chrome barrel (`mobile/src/components/chrome/index.ts`). The screen (and any other feature/route
code) SHALL import the controls from `@/components/chrome` and SHALL NOT import `@expo/ui` directly,
keeping the alpha API's blast radius inside the chrome seam (the existing chrome lint boundary).

#### Scenario: The screen imports controls from the chrome seam
- **WHEN** the Settings screen renders a native picker control
- **THEN** it imports the control from `@/components/chrome`
- **AND** it does not import `@expo/ui` directly

#### Scenario: @expo/ui is imported only inside the chrome wrapper
- **WHEN** `@expo/ui` is imported anywhere in the app
- **THEN** the only import site is `mobile/src/components/chrome/expo-ui.tsx`
- **AND** the chrome barrel re-exports the wrapped control(s)

### Requirement: Theme and language preferences are set through native picker controls
The Settings screen SHALL present a theme control (options `system` / `light` / `dark`) and a language
control (options `system` / `fr` / `en`), each a native single-select picker. Selecting an option
SHALL immediately drive the matching feature hook's setter (`useThemePreference().setPreference` /
`useLanguagePreference().setPreference`), so the change takes effect without a separate confirm step:
a theme selection re-themes the app through the color-scheme seam, and a language selection persists
the preference and switches the active language.

#### Scenario: Selecting a theme option drives the theme preference setter
- **WHEN** the user selects `dark` in the theme control
- **THEN** the theme preference setter is called with `dark`
- **AND** the app resolves the dark token set through the color-scheme seam

#### Scenario: Selecting a language option drives the language preference setter
- **WHEN** the user selects `fr` in the language control
- **THEN** the language preference setter is called with `fr`
- **AND** the preference is persisted and the active language switches

#### Scenario: Each control reflects the current preference
- **WHEN** the Settings screen renders
- **THEN** the theme control's selected value is the current theme preference
- **AND** the language control's selected value is the current language preference

### Requirement: The Settings screen is reachable from the Profile tab and via a deep link
The Settings route SHALL be registered as a `Stack` sibling of the `(tabs)` group in the root layout
(so a non-tab route is navigable). The Profile tab SHALL provide an accessible entry control that
navigates to the Settings route, declaring an accessibility role and a translated accessibility label
and providing a touch target of at least 44pt (iOS) / 48dp (Android). The Settings route SHALL be
reachable via the development deep link `timecalendar-dev://settings`.

#### Scenario: Settings is registered under the root Stack
- **WHEN** the root layout declares its routes
- **THEN** `settings` is a `Stack` screen sibling of the `(tabs)` group

#### Scenario: An accessible Profile control navigates to Settings
- **WHEN** the Profile tab renders its Settings entry control
- **THEN** the control declares an accessibility role and a translated accessibility label
- **AND** activating it navigates to the Settings route

#### Scenario: Settings is reachable via the dev deep link
- **WHEN** the development-variant app is cold-launched with `timecalendar-dev://settings`
- **THEN** the Settings screen is shown

### Requirement: Settings UI strings are fully localized (FR + EN)
Every user-facing string on the Settings screen and its entry control SHALL be a translation key
with complete FR and EN catalog entries. This covers the title, each control's label, each option's
label, and the Profile→Settings entry label. Localization SHALL be enforced by the
no-hardcoded-strings lint rule and by `tsc`-typed bidirectional FR/EN parity (a missing or extra key
in either catalog fails the typecheck).

#### Scenario: No hardcoded user-facing string on the screen
- **WHEN** the Settings screen or its entry control renders text or an accessibility label
- **THEN** that string comes from a translation key
- **AND** the no-hardcoded-strings lint rule passes

#### Scenario: FR and EN catalogs are complete and in parity
- **WHEN** a Settings UI key is added to one catalog
- **THEN** the same key exists in the other catalog
- **AND** `tsc` fails if a key is missing or extra in either direction

### Requirement: The Settings screen and control wiring are verified by an automated test
The unit-test suite SHALL include a test that renders the Settings screen through the real theme and
i18n trees and asserts: the localized title and both control labels render (translated values, not raw
keys); each control reflects the current preference; and driving a control's selection calls the
matching feature hook's setter with the selected value. The native controls (`@expo/ui`) SHALL be
mocked suite-wide so the universal control renders and its selection callback can be driven under
Jest. The test SHALL run under the existing `test-mobile` CI job (tsc + lint + Jest).

#### Scenario: The screen renders localized strings in CI
- **WHEN** the proof test renders the Settings screen
- **THEN** the localized title and control labels render (not raw keys)

#### Scenario: Driving a control drives the matching preference setter
- **WHEN** the proof test drives the theme control's selection to `dark`
- **THEN** the theme preference setter is called with `dark`

#### Scenario: The coverage gate stays green
- **WHEN** the suite runs with coverage
- **THEN** all configured thresholds still pass (the screen is presentational, under the 70% floor)

### Requirement: A Maestro flow proves the Settings screen is reachable and renders
The e2e suite SHALL include a Maestro flow that cold-launches the development-variant app, deep-links
to `timecalendar-dev://settings`, and asserts the localized title and the controls render. The flow
SHALL NOT depend on driving a native picker's selection (native picker popups are not reliably
addressable across iOS and Android); the control-to-hook wiring is proven instead by the automated
unit test.

#### Scenario: The Maestro flow asserts the screen renders
- **WHEN** the Maestro Settings flow runs on iOS or Android
- **THEN** it deep-links to `timecalendar-dev://settings`
- **AND** asserts the localized Settings title and controls are visible

#### Scenario: The flow does not drive the native picker
- **WHEN** the Maestro Settings flow is authored
- **THEN** it asserts render and reachability only
- **AND** it does not assert a preference changed by toggling a native picker
