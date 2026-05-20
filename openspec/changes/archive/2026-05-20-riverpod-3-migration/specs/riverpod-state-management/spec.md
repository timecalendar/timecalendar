## ADDED Requirements

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

### Requirement: Provider-package consolidation is out of scope

This migration SHALL NOT modify usages of the unrelated `provider:`
package (`ChangeNotifierProvider`, `SettingsProvider`,
`CalendarProvider`). Consolidating the two state-management packages
is deferred to [TIM-50](/TIM/issues/TIM-50) / Phase 3.

#### Scenario: provider: package call sites are untouched

- **WHEN** the change's diff is reviewed
- **THEN** `app/lib/app.dart` lines that wire `ChangeNotifierProvider(create: (_) => SettingsProvider())` and `ChangeNotifierProvider(create: (_) => CalendarProvider())` are unchanged
- **AND** no `import 'package:provider/provider.dart'` line in `app/lib/` is added, removed, or rewritten
