# riverpod-state-management Specification

## Purpose
TBD - created by archiving change riverpod-3-migration. Update Purpose after archive.
## Requirements
### Requirement: Riverpod 3 baseline

The Flutter app SHALL declare `hooks_riverpod: ^3.3.1` (or any later
v3 line) in `app/pubspec.yaml`, and `app/pubspec.lock` SHALL resolve
`hooks_riverpod` to a version starting with `3.`.

Note: the transitive `state_notifier` 1.0.0 package remains in the
lockfile because flutter_riverpod 3.3.1 / riverpod 3.2.1 still
depend on it for backwards-compatibility re-exports. The migration
requirement is that no direct `StateNotifier` usage survives in the
codebase (see the "No StateNotifier usage" requirement below) — not
that the package drops out of the lockfile.

#### Scenario: Pubspec and lockfile reflect the v3 baseline

- **WHEN** `flutter pub get` is run after the bump
- **THEN** `app/pubspec.yaml` carries `hooks_riverpod: ^3.3.1` (or higher within the 3.x line)
- **AND** `app/pubspec.lock` resolves `hooks_riverpod` to a version whose major is `3`

### Requirement: No StateNotifier usage

The Flutter app SHALL contain no `StateNotifier` or
`StateNotifierProvider` references in `app/lib/` or `app/test/`. Every
provider that previously used the legacy API SHALL be expressed as a
Riverpod 3 `Notifier` (synchronous state) or `AsyncNotifier`
(asynchronous state) backed by the matching `NotifierProvider` /
`AsyncNotifierProvider`.

#### Scenario: No legacy StateNotifier matches

- **WHEN** `grep -rn 'StateNotifier' app/lib app/test --include='*.dart'` is run
- **THEN** the command produces no matches

#### Scenario: The five migrated providers compile under v3

- **WHEN** `flutter analyze` is run from `app/` after the migration
- **THEN** the analyzer reports zero errors and zero new warnings on:
  - `app/lib/modules/assistant/providers/assistant_provider.dart`
  - `app/lib/modules/hidden_event/providers/hidden_event_provider.dart`
  - `app/lib/modules/event_details/providers/event_nb_checklist_items_provider.dart`
  - `app/lib/modules/event_details/providers/checklist_item_provider.dart`
  - `app/lib/modules/school/controllers/school_selection_controller.dart`

### Requirement: Provider lifetime preserves v2 keepAlive default

Providers in `app/lib/` SHALL preserve their Riverpod 2 lifetime
under Riverpod 3. Verified against riverpod 3.2.1 /
flutter_riverpod 3.3.1 (during apply): every provider constructor
(`Provider`, `NotifierProvider`, `AsyncNotifierProvider`,
`FutureProvider`, `StateProvider`, `StreamProvider`, …) still defaults
to `isAutoDispose: false`, so the v2 `keepAlive` lifetime is the v3
default without any code change. Providers that previously opted into
`.autoDispose` MUST keep that modifier; no explicit `ref.keepAlive()`
calls are required on providers that previously relied on the default
lifetime.

#### Scenario: Long-lived providers keep state across listener gaps

- **GIVEN** a provider that did NOT declare `.autoDispose` under Riverpod 2 (e.g., `eventsProvider`, `userCalendarProvider`, `hiddenEventProvider`)
- **WHEN** the app navigates away from a screen that listens to the provider and then back to it
- **THEN** the provider state observed on the return navigation is the same instance produced before navigation
- **AND** the provider's `build()` is not re-run between the two navigations

#### Scenario: Previously autoDispose providers still dispose

- **GIVEN** a provider that DID declare `.autoDispose` under Riverpod 2 (e.g., `checklistItemProvider`, `schoolSearchProvider`, `schoolFilteredProvider`, `debugCalendarDetailsProvider`)
- **WHEN** the last listener of that provider unmounts
- **THEN** the provider's state is disposed
- **AND** the next mount triggers a fresh `build()`

### Requirement: AsyncNotifier preserves v2 fail-fast UX

The app SHALL disable Riverpod 3's default exponential-backoff retry
policy on AsyncNotifier failures so that a failed `build()` surfaces
`AsyncValue.error` to the listening widgets on the first failure,
matching the Riverpod 2 default behaviour the screens were built
against. The override SHALL be applied at the root
`ProviderContainer` (via the `retry:` parameter) so that it covers
every current and future `AsyncNotifier` without per-provider
boilerplate. Per-provider `retry:` overrides remain permitted for
providers that want different policies, but are not required.

Note: Riverpod 3 exposes the retry policy as a `Retry?` parameter on
provider constructors and on `ProviderContainer` / `ProviderScope`;
there is no `retry` getter on the `Notifier` / `AsyncNotifier`
classes to override.

#### Scenario: Failed load surfaces error immediately

- **GIVEN** an `AsyncNotifier`-backed provider whose `build()` throws on the first call
- **WHEN** a widget listens to that provider via `ref.watch`
- **THEN** the widget observes an `AsyncValue.error` synchronously after the failure
- **AND** the `AsyncNotifier` does not automatically re-invoke `build()` after the failure

#### Scenario: Root ProviderContainer disables retry

- **WHEN** `app/lib/main.dart` is inspected
- **THEN** the root `ProviderContainer` is constructed with a
  `retry:` callback that returns `null` for every `(retryCount, error)`
  pair, disabling the default v3 retry policy for every provider in
  the app (per `parent?.retry` inheritance through child
  `ProviderScope`s).

### Requirement: ref.listen uses the v3 signature

Every `ref.listen` call in `app/lib/` SHALL use the Riverpod 3
`(previous, next)` callback signature with both arguments typed as
nullable.

#### Scenario: The school-selection screen listener compiles under v3

- **WHEN** `flutter analyze` is run from `app/` after the migration
- **THEN** `app/lib/modules/school/screens/school_selection/school_selection_screen.dart` reports zero errors
- **AND** its `ref.listen` callback accepts two parameters, the previous and next value, with the previous value nullable

### Requirement: Migration is behaviour-preserving on Phase 1 smoke gates

The Riverpod 3 migration SHALL leave the app's user-observable
behaviour unchanged on the Phase 1 verification gates.

#### Scenario: Analyzer and unit tests stay green

- **WHEN** `flutter analyze` and `flutter test` are run from `app/`
- **THEN** `flutter analyze` reports no new issues attributable to the migration
- **AND** the unit / widget test suite passes, including the rewritten `app/test/modules/school/controllers/school_selection_controller_test.dart`

#### Scenario: E2E smoke suite stays green

- **WHEN** the Phase 1 E2E smoke flows from [TIM-7](/TIM/issues/TIM-7) are run in CI against the migrated branch
- **THEN** every smoke flow passes (onboarding, calendar visibility, checklist add/edit/remove, hidden-event toggle, school selection)

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

### Requirement: No provider-package usage

The Flutter app SHALL contain no dependency on the `provider` package. There
SHALL be no `import 'package:provider/provider.dart'` line (under any alias)
anywhere in `app/lib/`, and `app/pubspec.yaml` SHALL NOT list `provider` as a
dependency.

#### Scenario: No provider-package imports remain

- **WHEN** `grep -rn "package:provider/provider.dart" app/lib --include='*.dart'` is run
- **THEN** the command produces no matches

#### Scenario: provider is absent from the pubspec

- **WHEN** `app/pubspec.yaml` and `app/pubspec.lock` are inspected
- **THEN** `app/pubspec.yaml` declares no `provider:` dependency
- **AND** `app/pubspec.lock` contains no `provider` package entry

### Requirement: SettingsProvider and CalendarProvider are exposed via Riverpod

`SettingsProvider` and `CalendarProvider` SHALL be reachable only through
Riverpod. Each SHALL be exposed by a top-level Riverpod
`ChangeNotifierProvider` declared alongside its class. `SettingsProvider`
SHALL NOT use a hand-rolled singleton (`static` instance + private
constructor + `factory`); the Riverpod container SHALL own the single
instance. Settings SHALL be initialised in `app/lib/main.dart` by reading the
`settingsProvider` from the root `ProviderContainer` and awaiting
`loadSettings` before `runApp`.

#### Scenario: Stores are exposed as Riverpod ChangeNotifierProviders

- **WHEN** `settings_provider.dart` and `calendar_provider.dart` are inspected
- **THEN** each declares a top-level `ChangeNotifierProvider` (`settingsProvider`, `calendarProvider`) imported from `package:hooks_riverpod/legacy.dart`
- **AND** `SettingsProvider` has a plain public constructor with no `static` singleton instance

#### Scenario: Settings are initialised through the root container

- **WHEN** `app/lib/main.dart` is inspected
- **THEN** settings are loaded via `container.read(settingsProvider).loadSettings(prefs)` (or equivalent read of the root container) before `runApp`
- **AND** `app/lib/app.dart` contains no `MultiProvider` / `package:provider` `ChangeNotifierProvider` wiring

#### Scenario: Consumers read the stores through ref

- **WHEN** a widget that previously used `Provider.of<SettingsProvider>` / `Provider.of<CalendarProvider>` / `Consumer<T>` is inspected after the change
- **THEN** it reads the store via `ref.watch` (where the original used `listen: true`) or `ref.read` (where the original used `listen: false`)

### Requirement: Provider-package removal is behaviour-preserving

Removing the `provider` package SHALL leave the app's user-observable
behaviour unchanged. `flutter analyze` SHALL report no new issues and
`flutter test` SHALL pass after the change.

#### Scenario: Analyzer and unit tests stay green

- **WHEN** `flutter analyze` and `flutter test` are run from `app/` after the change
- **THEN** `flutter analyze` reports no new issues attributable to the change
- **AND** the unit / widget test suite passes

#### Scenario: Planning and add-personal-event flows still work

- **WHEN** the planning view and the add-personal-event flow are smoke-tested after the change
- **THEN** the planning view renders events, tracks the current day, and honours the dark-mode setting
- **AND** the add-personal-event flow opens, applies the settings-based event-colour conversion, and saves an event

