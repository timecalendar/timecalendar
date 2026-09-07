## ADDED Requirements

### Requirement: Standalone personal-events states use the shared root-page composition

The standalone Personal events destination SHALL use `RootPage` with one measured `standard` lane while retaining its compact localized native title, body Add action, reactive data hook, row order, `FlatList`, and create/edit navigation. Its loaded-empty branch SHALL use the shared screen `EmptyState` without mandatory artwork and SHALL retain the existing localized meaning. The route SHALL NOT add a duplicate in-content title, second scroll owner, or new action placement.

#### Scenario: Empty list uses the shared page state

- **WHEN** the personal-events hook returns an empty collection
- **THEN** the shared screen empty state fills the available standard lane below the compact native title
- **AND** the Add action remains reachable with its current label and selector

#### Scenario: Populated list keeps virtualization and navigation

- **WHEN** personal events exist
- **THEN** the existing `FlatList` remains the only virtualized owner and renders the same rows in the shared lane
- **AND** activating Add or a row opens the create or edit form with unchanged parameters, labels, hints, and `personal-event-*` selectors

#### Scenario: Form behavior remains under the existing keyboard-safe contract

- **WHEN** the user opens create or edit from the normalized list
- **THEN** the existing compact create/edit title, readable lane, keyboard-safe body/footer, native pickers, Save/Delete actions, validation, persistence, and confirmation behavior remain unchanged
- **AND** the form route does not gain a second in-content title or scroll owner
