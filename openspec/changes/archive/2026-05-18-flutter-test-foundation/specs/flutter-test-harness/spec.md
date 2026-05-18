## ADDED Requirements

### Requirement: Mocking library

The Flutter app SHALL declare `mocktail` as a dev dependency so collaborators and dependents can write isolated tests without code generation.

#### Scenario: mocktail is available to tests

- **WHEN** a test file imports `package:mocktail/mocktail.dart`
- **THEN** `flutter pub get` resolves the dependency and the import compiles

### Requirement: Test directory layout

The test suite SHALL live under `app/test/` and mirror the structure of `app/lib/modules/`, so the test for `lib/modules/<m>/<path>/<file>.dart` lives at `test/modules/<m>/<path>/<file>_test.dart`.

#### Scenario: Test file placement mirrors source

- **WHEN** a contributor adds a test for a file under `lib/modules/`
- **THEN** the test file is placed at the mirrored path under `test/modules/` and ends with `_test.dart`

### Requirement: Shared widget-test harness

The suite SHALL provide a reusable widget-test helper under `app/test/support/` that wraps a widget-under-test with `MaterialApp`, the app theme, localization delegates, and a Riverpod `ProviderScope`, and accepts a list of provider overrides.

#### Scenario: Pumping a widget with the harness

- **WHEN** a widget test calls the shared pump helper with a widget and optional provider overrides
- **THEN** the widget renders inside a `MaterialApp` with theme, localization and a `ProviderScope` applying those overrides, with no Firebase or real-network initialization

### Requirement: Documented mock strategy

The suite SHALL include `app/test/README.md` documenting the chosen patterns: mocktail for mocks, Riverpod `ProviderContainer`/`overrides` for state, the directory-mirroring convention, and how to run the tests.

#### Scenario: Contributor reads the testing guide

- **WHEN** a contributor opens `app/test/README.md`
- **THEN** it states how to run `flutter test`, where to place new tests, and how to mock dependencies and override Riverpod providers

### Requirement: Exemplar tests

The suite SHALL include at least one exemplar pure unit test and one exemplar widget test that demonstrate the patterns other tests follow.

#### Scenario: Unit-test exemplar

- **WHEN** `flutter test` runs the `ColorUtils` test
- **THEN** it exercises pure functions (`hexToColor`, `colorToHex`, `darkenColor`/`lightenColor`) with `test()`/`group()` and passes

#### Scenario: Widget-test exemplar

- **WHEN** `flutter test` runs the `CustomButton` test
- **THEN** it pumps the widget via the shared harness, verifies the label renders, verifies a tap invokes `onPressed`, and verifies a tap is ignored while `loading` is true

### Requirement: Green test run

`flutter test` SHALL complete with all tests passing when run from `app/`.

#### Scenario: Local test run

- **WHEN** a developer runs `flutter test` in `app/`
- **THEN** the command exits zero with every test passing

### Requirement: Continuous integration hook

CI SHALL run the Flutter unit/widget test suite on every push.

#### Scenario: CI runs Flutter tests

- **WHEN** a commit is pushed
- **THEN** a CI job installs Flutter and runs `flutter test` in `app/`, failing the build if any test fails
