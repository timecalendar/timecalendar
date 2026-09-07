## ADDED Requirements

### Requirement: Feedback uses the shared primary action and keyboard-safe owner
The Feedback form SHALL compose one shared `KeyboardSafeActionLayout` inside the readable root-page safe-area surface. Its fields and status content SHALL remain in the sole scrollable body, while a sibling action region SHALL remain visibly pinned immediately above the focused keyboard. Submit SHALL use `PrimaryAction` with `primaryStrong`/`onPrimary`, the 44-point iOS or 48-dp Android minimum, the existing localized label and `feedback-submit` selector, and disabled/busy accessibility state while the mutation is pending.

The migration SHALL preserve e-mail-to-message focus traversal, multiline Return behavior, validation, remembered-email timing, context normalization, single-flight mutation, success alert/back navigation, retryable failure, generated request shape, analytics/observability boundaries, and every existing `feedback-*` selector.

#### Scenario: iOS keyboard lifts the Feedback action
- **WHEN** a Feedback field is focused on iOS
- **THEN** padding-based keyboard avoidance keeps the sibling primary action region immediately above the keyboard
- **AND** the fields remain reachable through the sole scroll owner

#### Scenario: Android keyboard resizes the Feedback form
- **WHEN** a Feedback field is focused on Android
- **THEN** height-based keyboard avoidance keeps the sibling primary action region visible immediately above the keyboard
- **AND** the fields remain reachable through the sole scroll owner

#### Scenario: Pending submission exposes semantic action state
- **WHEN** a valid Feedback submission is pending
- **THEN** the `feedback-submit` action retains its localized accessible label, uses the semantic filled pair and platform target, exposes disabled and busy accessibility state, and blocks duplicate activation

#### Scenario: Feedback outcomes remain unchanged
- **WHEN** validation fails, submission succeeds, or submission fails and is retried
- **THEN** the existing field errors, remembered e-mail, success alert and back action, retryable failure, request context, and diagnostic privacy behavior remain unchanged
