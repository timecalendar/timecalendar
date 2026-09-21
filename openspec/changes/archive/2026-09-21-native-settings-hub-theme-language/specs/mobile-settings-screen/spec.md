## MODIFIED Requirements

### Requirement: Settings screen is a presentational component with a thin route
The Appearance & language screen SHALL remain a presentational component under `mobile/src/features/settings/ui/` with a thin `mobile/src/app/appearance-settings.tsx` route re-export. The iOS language choice page SHALL likewise live under the feature UI layer with a thin `mobile/src/app/language-settings.tsx` route. These screens SHALL own no preference validation or persistence and SHALL delegate all state transitions to `useThemePreference` and `useLanguagePreference`.

#### Scenario: Routes remain thin and tests stay outside the route tree
- **WHEN** Appearance & language and the iOS language page are implemented
- **THEN** each route file only re-exports its feature screen
- **AND** behavior tests remain colocated with feature UI rather than in `src/app/`

#### Scenario: Presentation does not duplicate preference logic
- **WHEN** either screen reads or changes theme or language
- **THEN** it uses the existing Settings preference hooks
- **AND** it adds no preference key, parser, or storage path

### Requirement: Native controls reached only through the @expo/ui chrome wrapper
All Expo UI primitives used by the settings journeys SHALL be imported only within `mobile/src/components/chrome/`. Feature and route code SHALL consume project-owned native settings contracts from the chrome barrel. The wrapper SHALL contain platform-specific SwiftUI and Compose composition and SHALL keep Expo Router as the navigation owner.

#### Scenario: Settings features use project-owned contracts
- **WHEN** a settings screen renders a form, list, row, switch, choice, or dialog
- **THEN** it imports that contract from `@/components/chrome`
- **AND** it contains no direct `@expo/ui` import

#### Scenario: Platform navigation is not nested
- **WHEN** an iOS selection page is pushed or an Android dialog is opened
- **THEN** Expo Router remains the only navigation stack owner
- **AND** no SwiftUI or Compose navigation container is introduced

### Requirement: Theme and language preferences are set through native picker controls
Theme SHALL offer System, Light, and Dark through inline native checkmarked rows on iOS and a cancellable Material single-choice radio dialog on Android. Language SHALL offer exactly Use device language, Français, and English through an iOS pushed native checkmarked page and a cancellable Material single-choice radio dialog on Android. Each committed selection SHALL immediately call the matching preference hook setter, persist the choice, update selected state, and apply the effective theme or language to the mounted app without a separate confirmation action.

#### Scenario: iOS theme selection is inline and live
- **WHEN** the user selects Dark from the iOS Appearance form
- **THEN** Dark becomes the sole checked choice and the theme setter receives `dark`
- **AND** the current form and navigation adopt the resolved dark scheme

#### Scenario: Android theme selection uses a cancellable radio dialog
- **WHEN** the user opens Theme on Android and selects Light
- **THEN** the theme setter receives `light`, the dialog closes, and the row shows Light
- **AND** dismissing the dialog by Cancel, outside tap, or Back without selecting changes no preference

#### Scenario: iOS language selection uses one pushed list
- **WHEN** the user opens Language on iOS
- **THEN** one page lists Use device language, Français, and English with exactly the stored choice checked
- **AND** choosing Français persists `fr` and translates the currently mounted page and native labels

#### Scenario: Android language selection uses one radio dialog
- **WHEN** the user opens Language on Android
- **THEN** one Material dialog lists the same three choices with the stored choice selected
- **AND** selecting English persists `en`, translates the current page, and retains English as selected

### Requirement: Appearance & language is reachable from Settings and via a deep link
The `/appearance-settings` route SHALL remain registered as a root Stack sibling of `(tabs)` and reachable from the Settings hub and development deep link. The `/language-settings` route SHALL be registered as a root sibling for the iOS pushed language journey. Existing hub destinations and Router back behavior SHALL remain unchanged, and translated route titles/back context SHALL update with the active language.

#### Scenario: Existing appearance entry remains stable
- **WHEN** the user activates Appearance & language from the hub or opens its development deep link
- **THEN** the existing appearance route opens with an accessible native row and Router-owned back behavior

#### Scenario: iOS language page is Router-owned
- **WHEN** the user activates Language from Appearance on iOS
- **THEN** Router pushes `/language-settings` with one native scroll owner
- **AND** returning uses the existing stack rather than a nested native navigation container

### Requirement: The Settings screen and control wiring are verified by an automated test
The automated suite SHALL exercise both platform compositions through the real preference-hook and i18n boundaries with native chrome mocked to the installed API contracts. It SHALL verify every theme and language choice, current selected state, immediate current-page translation, Android cancellation paths, resolved host scheme, route wiring, and preservation of selection after language changes.

#### Scenario: Theme journey is the first native proof
- **WHEN** the implementation reaches its first checkpoint
- **THEN** focused tests prove a complete System/Light/Dark journey on both platform branches
- **AND** real-host scroll/navigation/theme observations are recorded before language reuses the composition

#### Scenario: Every choice and cancellation path is deterministic
- **WHEN** tests drive each theme and language option and dismiss Android dialogs without selection
- **THEN** committed options call the corresponding setter once and update selected state
- **AND** cancellation calls no setter and preserves the prior state

## REMOVED Requirements

### Requirement: A Maestro flow proves the Settings screen is reachable and renders
**Reason**: The repository now permits exactly three durable top-level Maestro journeys, and detailed settings variants are assigned to focused host tests plus owner-led native acceptance rather than an additional smoke flow.

**Migration**: Keep route/deep-link wiring under automated route tests; cover native form/list/dialog rendering, back behavior, large text, and accessibility in the owner device checklist defined by this change.
