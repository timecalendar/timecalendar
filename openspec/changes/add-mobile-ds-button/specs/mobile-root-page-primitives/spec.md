# Spec Delta

## MODIFIED Requirements

### Requirement: Filled primary actions share semantic colors, sizing, and state

Filled body/footer actions SHALL use the shared button's `filled` variant; the app SHALL NOT keep a
separate primary-action component. A filled action SHALL render `onPrimary` content on
`primaryStrong`, meet a minimum 44-point height on iOS and 48-dp height on Android, accept
caller-owned translated label, activation handler, layout-only style, and `testID`, and expose
disabled and busy states. Disabled or busy actions SHALL block activation, visibly differ from
enabled state, and expose `accessibilityState.disabled`; busy actions SHALL additionally expose
`accessibilityState.busy` and a non-focusable progress indicator while retaining the visible label
as the accessible label.

#### Scenario: Enabled action uses the verified brand pair

- **WHEN** a filled primary action is enabled in either color scheme
- **THEN** its fill is `primaryStrong` and its content is `onPrimary`
- **AND** its target meets the current platform minimum

#### Scenario: Disabled action cannot activate

- **WHEN** the action is disabled
- **THEN** activation does not invoke its handler
- **AND** disabled state is exposed visually and to assistive technology

#### Scenario: Busy action is single-flight and announced

- **WHEN** the action is busy
- **THEN** activation does not invoke a second handler call
- **AND** busy and disabled semantics are exposed on the same accessible button

#### Scenario: Native placement remains feature-owned

- **WHEN** the semantic primary action belongs in an iOS native header or Android FAB
- **THEN** the feature MAY use that platform-native placement and its platform-owned target sizing
- **AND** the shared contract does not force both platforms into the filled body-button layout

#### Scenario: The error state's primary action is a filled button

- **WHEN** a full error state offers a primary recovery action
- **THEN** that action renders as the shared filled button with the caller's label and selector
