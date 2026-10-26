## MODIFIED Requirements

### Requirement: Feedback uses the shared primary action and keyboard-safe owner
The Feedback form SHALL compose one shared `KeyboardSafeActionLayout` inside the readable root-page safe-area surface. Its fields and status content SHALL remain in the sole scrollable body, while a sibling action region SHALL remain visibly pinned immediately above the focused keyboard. The action region SHALL use the layout's default rhythm and pass no `actionContainerStyle`. Submit SHALL use the shared button's `filled` variant with `primaryStrong`/`onPrimary`, the 44-point iOS or 48-dp Android minimum, the existing localized label and `feedback-submit` selector, and disabled/busy accessibility state while the mutation is pending. The pending status text SHALL be a `ThemedText` with `tone="secondary"`, and the screen SHALL NOT pass `themeColor`.

The migration SHALL preserve e-mail-to-message focus traversal, multiline Return behavior, validation, remembered-email timing, context normalization, single-flight mutation, success alert/back navigation, retryable failure, generated request shape, analytics/observability boundaries, and every existing `feedback-*` selector.

#### Scenario: iOS keyboard lifts the Feedback action
- **WHEN** a Feedback field is focused on iOS
- **THEN** the shared layout's iOS keyboard avoidance keeps the sibling primary action region immediately above the keyboard
- **AND** the fields remain reachable through the sole scroll owner

#### Scenario: Android keyboard resizes the Feedback form
- **WHEN** a Feedback field is focused on Android
- **THEN** the shared layout's measured keyboard inset keeps the sibling primary action region visible immediately above the keyboard
- **AND** the fields remain reachable through the sole scroll owner

#### Scenario: The action region uses the shared form rhythm
- **WHEN** the Feedback screen renders
- **THEN** `feedback-action-region` has `gap: Spacing.two`, `paddingTop: Spacing.three` and `paddingBottom: Spacing.four`

#### Scenario: Pending submission exposes semantic action state
- **WHEN** a valid Feedback submission is pending
- **THEN** the `feedback-submit` action retains its localized accessible label, uses the semantic filled pair and platform target, exposes disabled and busy accessibility state, and blocks duplicate activation
- **AND** the polite sending status renders in the `textSecondary` color through `tone="secondary"`

#### Scenario: Feedback outcomes remain unchanged
- **WHEN** validation fails, submission succeeds, or submission fails and is retried
- **THEN** the existing field errors, remembered e-mail, success alert and back action, retryable failure, request context, and diagnostic privacy behavior remain unchanged
