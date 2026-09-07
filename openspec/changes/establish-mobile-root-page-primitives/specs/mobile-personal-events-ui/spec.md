## MODIFIED Requirements

### Requirement: Personal-event form body and footer share one readable lane

The personal-event create/edit/delete form SHALL use the shared `KeyboardSafeActionLayout` while retaining its native date-time pickers, field order, validation, save/delete semantics, confirmation alerts, and error presentation. Its scroll body and keyboard-safe action footer SHALL share one measured `readable` lane at every supported portrait width. The localized create/edit title SHALL live in the compact native Stack header, and the scroll body SHALL NOT repeat it as an oversized in-content route title.

Save SHALL use the shared filled `PrimaryAction` with `primaryStrong`/`onPrimary`, the platform minimum target, disabled/busy accessibility semantics when the save hook is pending, and the unchanged `personal-event-save` selector. Delete SHALL remain a distinct secondary/destructive action after Save with the unchanged `personal-event-delete` selector. Save/delete failure notices SHALL remain in the pinned action region.

#### Scenario: Form and footer align on tablet

- **WHEN** the form owner reports a portrait-tablet width
- **THEN** fields, validation messages, error notices, Save, and Delete align within the same centered readable lane
- **AND** the footer remains immediately above the keyboard through the shared owner

#### Scenario: Native header replaces the duplicate title

- **WHEN** the create or edit form opens
- **THEN** the compact Stack header shows the corresponding localized create/edit title
- **AND** the scroll body starts with form fields rather than a second oversized route title

#### Scenario: Save uses the semantic primary action

- **WHEN** the form renders or a save is pending
- **THEN** Save uses the shared filled brand pair, platform target, and enabled/disabled/busy semantics
- **AND** `personal-event-save` remains the selector on the accessible button

#### Scenario: Create and edit behavior is preserved

- **WHEN** a user creates an event or edits an existing event at phone or tablet width
- **THEN** native pickers, validation, persistence, back navigation, save failure, delete confirmation, delete failure, and action order remain unchanged
- **AND** the existing `personal-event-*` field and action selectors remain stable

#### Scenario: Large text retains sequential form order

- **WHEN** font scaling stresses the form at 834 or a wider owner
- **THEN** the form remains one readable column in field, validation, Save, then Delete source and focus order
- **AND** its content remains scrollable while the action region stays pinned above the keyboard
