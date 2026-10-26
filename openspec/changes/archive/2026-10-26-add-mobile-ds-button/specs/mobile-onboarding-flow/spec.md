# Spec Delta

## MODIFIED Requirements

### Requirement: Programme uses the shared primary action and keyboard-safe owner
The programme step SHALL compose one shared `KeyboardSafeActionLayout` inside the readable root-page safe-area surface. Its intro, field, and validation error SHALL remain in the sole scrollable body, while Continue SHALL use the shared button's `filled` variant in a sibling region pinned immediately above the focused keyboard. Continue SHALL use `primaryStrong`/`onPrimary`, the 44-point iOS or 48-dp Android minimum, the existing localized label and `onboarding-programme-continue` selector, and disabled accessibility state while the normalized name is empty.

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

## ADDED Requirements

### Requirement: Onboarding buttons use the shared button family
The welcome, connect and manual-import steps SHALL render their in-content buttons with the shared
button: welcome Skip and Next as `text` buttons (Next with a trailing forward arrow), the welcome
final call to action as a `large` `filled` button; connect's institution link as an `outlined`
button with the `link` role and a trailing open-in-browser icon, Back as `outlined` and Continue as
`filled`; manual import's QR route as `filled` with a leading QR icon and the iCal URL route as
`outlined` with a leading link icon. Labels, accessibility labels and hints, navigation, draft
writes and every existing `onboarding-*` selector SHALL stay unchanged.

#### Scenario: The recommended import route stands out

- **WHEN** the manual import step renders
- **THEN** the QR route is the filled button and the iCal URL route is the outlined button
- **AND** `onboarding-import-qr` and `onboarding-import-url` remain their selectors

#### Scenario: The intranet link announces a link

- **WHEN** the connect step shows a listed institution's intranet link
- **THEN** the control exposes the `link` role with its existing localized label
