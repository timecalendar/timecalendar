## REMOVED Requirements

### Requirement: Provider-package consolidation is out of scope

**Reason**: Superseded by TIM-76. The `provider`-package consolidation that
this requirement deferred to TIM-50/Phase 3 is now being done here; the
"out of scope" constraint is replaced by the "No provider-package usage" and
"SettingsProvider and CalendarProvider are exposed via Riverpod" requirements
added below.

**Migration**: Code that previously read `SettingsProvider` / `CalendarProvider`
via `package:provider` (`Provider.of<T>(context)`, `Consumer<T>`) now reads
them via Riverpod (`ref.watch(settingsProvider)`, `ref.watch(calendarProvider)`).

## ADDED Requirements

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
