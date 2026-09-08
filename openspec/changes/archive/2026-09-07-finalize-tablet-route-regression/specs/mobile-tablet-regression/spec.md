## ADDED Requirements

### Requirement: The tablet route matrix records the integrated shipped disposition

The tablet quick-wins matrix SHALL retain one row for every audited React Native route or surface and SHALL describe the behavior delivered by the tablet workstreams or an explicit no-change disposition. Each row SHALL name its semantic width rule and focused verification evidence. The final reconciliation SHALL NOT introduce landscape, multitasking, tablet-only navigation, native configuration, dependency, generated-client, migration, or legacy Flutter changes.

#### Scenario: A completed tablet workstream is reconciled

- **WHEN** a route owned by a completed tablet workstream is reviewed in the final matrix
- **THEN** the row describes its shipped measured-lane or full-bleed composition
- **AND** the row identifies focused phone/tablet regression evidence
- **AND** the row contains no future-tense commitment for work that already shipped

#### Scenario: Device evidence is unavailable on the execution host

- **WHEN** the final pass cannot run a simulator, emulator, or physical device locally
- **THEN** the evidence records that limitation without claiming device execution
- **AND** available static, component, integration, and CI evidence remains explicit

### Requirement: Keyboard-safe forms keep actions inside the visible height

The shared keyboard-safe action layout SHALL measure its top edge in window coordinates and SHALL apply the offset according to the platform keyboard-frame contract. It SHALL use height avoidance on both platforms, retain a flexible scroll body, and keep the action region as a sibling inside the constrained owner.

#### Scenario: A fixed header precedes the form

- **WHEN** the form owner is laid out below native or application chrome
- **THEN** iOS uses its non-negative finite window position as the keyboard vertical offset
- **AND** Android uses zero because its keyboard frame is already window-relative
- **AND** the software keyboard constrains only the height actually available below that chrome

#### Scenario: A measurement is invalid

- **WHEN** the native measurement is negative or non-finite
- **THEN** the layout retains its previous safe offset
- **AND** no invalid geometry reaches `KeyboardAvoidingView`

### Requirement: The native personal-event journey targets the alert confirmation

The budgeted personal-event journey SHALL positively observe the delete alert and SHALL distinguish its confirmation from the editor action that shares the same accessible label. Android SHALL target the action to the right of Cancel, while iOS SHALL target the action above the editor delete control. Both branches SHALL rejoin at a positive Agenda anchor before asserting the exact event is absent.

#### Scenario: Android renders horizontal alert actions

- **WHEN** the Android delete alert shows Cancel and Delete side-by-side
- **THEN** the journey activates Delete only when it is right of Cancel
- **AND** it does not relate the modal action to an obscured editor control

#### Scenario: iOS retains the editor action in the accessibility hierarchy

- **WHEN** the iOS alert and editor expose the same Delete label
- **THEN** the journey activates the Delete element above the editor action
- **AND** the final Agenda absence proves the deletion completed

### Requirement: Integrated rebase preserves the native smoke budget

The final tablet branch SHALL retain the integrated base's three top-level native journeys and helper-only nested flows. It SHALL NOT restore a retired route-specific flow while resolving rebase conflicts.

#### Scenario: The integrated base removes legacy flows

- **WHEN** an earlier tablet-regression commit modified a flow removed by the integrated base
- **THEN** conflict resolution preserves the deletion
- **AND** any still-reproducible defect is ported into the corresponding budgeted journey
