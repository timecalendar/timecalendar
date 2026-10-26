# Spec Delta

## MODIFIED Requirements

### Requirement: A field with a visible error exposes it from the field

When a text or date-time field shows a validation error below it, the field itself SHALL expose
that error to VoiceOver and TalkBack through its accessibility hint, placed before any helper text
and any existing hint, so the error is read whenever the field gains focus. The shared field
primitives SHALL own this wiring; feature code SHALL pass the error to the field and SHALL NOT
compose the hint itself. The field's accessible name SHALL stay its label and its value SHALL stay
the typed text. When no error is shown, the hint SHALL be the field's helper and own hint, or
absent. The error text below the field SHALL be announced when it appears and again only when its
message changes. Where a native control accepts no accessibility hint (the iOS inline date-time
picker), the error SHALL still be announced on appearance and remain readable as the text directly
after the control.

#### Scenario: Focusing a field with an error

- **WHEN** the feedback email field shows "Enter a valid email" and the user focuses the field
- **THEN** the field's accessibility hint starts with the error message
- **AND** its accessible name is still the field label

#### Scenario: The error clears

- **WHEN** the error is resolved and disappears
- **THEN** the field's accessibility hint no longer contains the error

#### Scenario: The field keeps its own hint

- **WHEN** a field with its own hint shows an error
- **THEN** its accessibility hint is the error followed by the field's own hint

#### Scenario: The error is announced once

- **WHEN** an error appears and the user keeps typing while the same error remains
- **THEN** the error is announced exactly once
