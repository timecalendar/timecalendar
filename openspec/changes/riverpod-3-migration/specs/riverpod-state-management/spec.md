## ADDED Requirements

### Requirement: Riverpod 3 baseline

The Flutter app SHALL declare `hooks_riverpod: ^3.3.1` (or any later
v3 line) in `app/pubspec.yaml`, and `app/pubspec.lock` SHALL resolve
`hooks_riverpod` to a version starting with `3.`. The transitive
`state_notifier` package SHALL no longer appear in `app/pubspec.lock`.

#### Scenario: Pubspec and lockfile reflect the v3 baseline

- **WHEN** `flutter pub get` is run after the bump
- **THEN** `app/pubspec.yaml` carries `hooks_riverpod: ^3.3.1` (or higher within the 3.x line)
- **AND** `app/pubspec.lock` resolves `hooks_riverpod` to a version whose major is `3`
- **AND** `app/pubspec.lock` contains no `state_notifier` entry

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

Providers in `app/lib/` SHALL preserve their Riverpod 2 lifetime under Riverpod 3's new `autoDispose`-by-default behaviour. Every provider that previously relied on the v2 default `keepAlive` lifetime (i.e., declared without the `.autoDispose` modifier) SHALL explicitly call `ref.keepAlive()` inside its `build()` body (for `Notifier` / `AsyncNotifier`) or inside its factory function (for `Provider` / `StateProvider` / `FutureProvider`). Providers that already declared `.autoDispose` in the v2 codebase SHALL retain autoDispose semantics and MAY drop the now-redundant modifier.

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

Every `AsyncNotifier` subclass in `app/lib/` SHALL explicitly override
the v3 retry policy to `null` (no automatic retry) so that a failed
`build()` surfaces `AsyncValue.error` to the listening widgets on the
first failure, matching the Riverpod 2 default behaviour the screens
were built against.

#### Scenario: Failed load surfaces error immediately

- **GIVEN** an `AsyncNotifier`-backed provider whose `build()` throws on the first call
- **WHEN** a widget listens to that provider via `ref.watch`
- **THEN** the widget observes an `AsyncValue.error` synchronously after the failure
- **AND** the `AsyncNotifier` does not automatically re-invoke `build()` after the failure

#### Scenario: No AsyncNotifier subclass omits the retry override

- **WHEN** `grep -rn 'extends AsyncNotifier' app/lib --include='*.dart'` is paired with `grep -rn 'get retry' app/lib --include='*.dart'`
- **THEN** every file that declares `extends AsyncNotifier<…>` also declares a `retry` getter (or equivalent override) that evaluates to `null`

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

### Requirement: Provider-package consolidation is out of scope

This migration SHALL NOT modify usages of the unrelated `provider:`
package (`ChangeNotifierProvider`, `SettingsProvider`,
`CalendarProvider`). Consolidating the two state-management packages
is deferred to [TIM-50](/TIM/issues/TIM-50) / Phase 3.

#### Scenario: provider: package call sites are untouched

- **WHEN** the change's diff is reviewed
- **THEN** `app/lib/app.dart` lines that wire `ChangeNotifierProvider(create: (_) => SettingsProvider())` and `ChangeNotifierProvider(create: (_) => CalendarProvider())` are unchanged
- **AND** no `import 'package:provider/provider.dart'` line in `app/lib/` is added, removed, or rewritten
