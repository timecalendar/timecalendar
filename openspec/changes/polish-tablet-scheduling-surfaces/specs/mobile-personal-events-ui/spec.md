## ADDED Requirements

### Requirement: Personal-events list uses the shared standard lane
The personal-events list SHALL resolve a `standard` lane from the positive width of its existing safe-area owner. Its feature-owned header, Add action, empty state, rows, and scroll edges SHALL align within that lane while retaining one list and the existing navigation and reactive data behavior.

#### Scenario: Tablet list is centered and capped
- **WHEN** the personal-events owner reports a portrait-tablet width
- **THEN** the header, empty state, and rows align within the centered standard lane with tablet gutters
- **AND** rows do not stretch beyond the standard content cap

#### Scenario: List actions are unchanged
- **WHEN** a user activates Add or an existing row at any supported width
- **THEN** the create or edit route opens with the existing parameters and accessibility label/hint behavior

#### Scenario: Compact list is preserved
- **WHEN** the list owner reports 390 or another width below 600
- **THEN** the same one-column list uses compact gutters without changing row order or touch targets

### Requirement: Personal-event form body and footer share one readable lane
The personal-event create/edit/delete form SHALL keep the existing `KeyboardAvoidingView`, native date-time pickers, field order, validation, save/delete semantics, confirmation alerts, and error presentation. Its scroll body and keyboard-safe action footer SHALL share one measured `readable` lane at every supported portrait width.

#### Scenario: Form and footer align on tablet
- **WHEN** the form owner reports a portrait-tablet width
- **THEN** title, fields, validation messages, error notices, Save, and Delete align within the same centered readable lane
- **AND** the footer remains reachable under the existing keyboard-avoidance behavior

#### Scenario: Create and edit behavior is preserved
- **WHEN** a user creates an event or edits an existing event at phone or tablet width
- **THEN** native pickers, validation, persistence, back navigation, save failure, delete confirmation, delete failure, and action order remain unchanged

#### Scenario: Large text retains sequential form order
- **WHEN** font scaling stresses the form at 834 or a wider owner
- **THEN** the form remains one readable column in field → validation → Save → Delete source and focus order
- **AND** no optional tablet column is introduced
