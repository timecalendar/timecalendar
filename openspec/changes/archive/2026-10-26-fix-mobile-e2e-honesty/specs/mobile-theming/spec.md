## ADDED Requirements

### Requirement: iOS native chrome identifiers sit on leaf elements

On iOS, every accessibility identifier that the native chrome seam exposes SHALL sit on a leaf element or control (a text, a button, a field, a toggle, a labeled row), never on a SwiftUI container, because SwiftUI applies a container's identifier to each child and replaces the children's own identifiers. Each identifier a chrome component accepts SHALL therefore resolve to exactly one element in the iOS accessibility tree. The text-entry dialog SHALL place its dialog identifier on the sheet's title text on iOS, so the dialog's presence, its cancel and submit actions, its field and its message stay separately addressable on both platforms.

#### Scenario: The iOS text-entry dialog keeps distinct identifiers

- **WHEN** the iOS text-entry dialog is presented
- **THEN** its dialog identifier resolves to the title text, and its cancel, submit and field identifiers each resolve to their own control
- **AND** no SwiftUI container in the sheet carries an identifier

#### Scenario: A test addresses the dialog on both platforms

- **WHEN** a test or a Maestro flow waits for the dialog identifier
- **THEN** it finds the dialog on Android (the dialog surface) and on iOS (the title) without a platform-specific selector
