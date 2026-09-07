## ADDED Requirements

### Requirement: Programme uses the shared primary action and keyboard-safe owner
The programme step SHALL compose one shared `KeyboardSafeActionLayout` inside the readable root-page safe-area surface. Its intro, field, and validation error SHALL remain in the sole scrollable body, while Continue SHALL use `PrimaryAction` in a sibling region pinned immediately above the focused keyboard. Continue SHALL use `primaryStrong`/`onPrimary`, the 44-point iOS or 48-dp Android minimum, the existing localized label and `onboarding-programme-continue` selector, and disabled accessibility state while the normalized name is empty.

The iOS native header Skip item and Android header Skip control SHALL retain their current platform placement, localized labels, target semantics, and selector. Name normalization, length validation, draft writes, Return-key submission, Skip's empty-name behavior, Continue navigation, route order, and existing selectors SHALL remain unchanged.

#### Scenario: Programme action stays above the iOS keyboard
- **WHEN** the programme field is focused on iOS
- **THEN** padding-based keyboard avoidance keeps Continue immediately above the keyboard in a sibling action region
- **AND** the intro, field, and error remain reachable in the sole scroll owner

#### Scenario: Programme action stays above the Android keyboard
- **WHEN** the programme field is focused on Android
- **THEN** height-based keyboard avoidance keeps Continue immediately above the keyboard in a sibling action region
- **AND** the intro, field, and error remain reachable in the sole scroll owner

#### Scenario: Empty programme preserves Skip as the only advance path
- **WHEN** the normalized programme name is empty
- **THEN** Continue is disabled with accessible disabled state
- **AND** the platform-native Skip action remains enabled and advances with an empty programme name

#### Scenario: Valid programme preserves draft navigation
- **WHEN** the user enters a valid programme and activates Continue or the keyboard action
- **THEN** the normalized name is written to the existing import draft and the journey advances to Connect with unchanged route and selectors
