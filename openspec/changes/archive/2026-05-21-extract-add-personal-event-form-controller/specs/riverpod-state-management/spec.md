## ADDED Requirements

### Requirement: Personal-event form is backed by a Riverpod controller

The personal-event add/edit form SHALL hold its form state and form logic in
a Riverpod `Notifier` controller, not in widget `setState`. The controller
SHALL be exposed as an `autoDispose` family keyed by the optional
`PersonalEvent` being edited (`null` for a new event), so that every time the
screen is opened it starts from freshly-built state. The screen widget
(`add_personal_event_screen.dart`) SHALL be a thin presentation shell with no
form state, and SHALL stay under 250 lines.

The controller SHALL own: initial-state construction for the add and edit
cases, the field setters, the end-after-start time validation, and the
construction of the `PersonalEvent` to persist. The colour-to-persist
conversion SHALL be injected into the controller as a function so the
controller does not depend on `package:provider` and remains unit-testable.

The controller SHALL have unit tests covering initial state (add and edit),
the field setters, the end-after-start validation, and event construction in
the add and edit cases.

This refactor SHALL preserve behaviour: the rendered field order, all
user-facing strings, the date format, the validation messages, and the
add-versus-edit save semantics SHALL be unchanged.

#### Scenario: Form state lives in a Notifier, not setState

- **WHEN** `app/lib/modules/personal_event/` is inspected after the change
- **THEN** an `AddPersonalEventController extends Notifier` exists with an
  `autoDispose` family `NotifierProvider` keyed by `PersonalEvent?`
- **AND** `add_personal_event_screen.dart` is a `StatelessWidget` shell that
  delegates the form UI to a dedicated form widget
- **AND** `add_personal_event_screen.dart` is under 250 lines

#### Scenario: Controller is unit-tested

- **WHEN** `flutter test` is run from `app/`
- **THEN** `test/modules/personal_event/controllers/add_personal_event_controller_test.dart`
  passes, covering initial state for the add and edit cases, the field
  setters, the end-after-start validation, and `PersonalEvent` construction
  for the add and edit cases

#### Scenario: Behaviour is preserved

- **WHEN** the refactored screen is opened to add a new event and to edit an
  existing event
- **THEN** the field order, user-facing strings, date format, and validation
  messages match the pre-refactor screen
- **AND** saving a new event creates a `PersonalEvent` with a fresh `uid`,
  and saving an edited event preserves the original `uid`

#### Scenario: Change is analyze-clean and test-green

- **WHEN** `flutter analyze` and `flutter test` are run from `app/` after the
  change
- **THEN** `flutter analyze` reports no new issues attributable to the change
- **AND** the unit and widget test suite passes
