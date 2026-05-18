# Flutter tests

Unit and widget tests for the TimeCalendar app. End-to-end / integration tests
live in `../integration_test/` and are out of scope here.

## Running the tests

```sh
cd app
flutter pub get          # also runs build_runner-generated code if missing
flutter test             # whole suite
flutter test test/modules/shared/utils/color_utils_test.dart   # one file
```

If a test fails to compile because of missing generated files (`*.g.dart`,
`*.freezed.dart`), regenerate them first:

```sh
dart run build_runner build --delete-conflicting-outputs
```

## Layout

`test/` mirrors `lib/`. The test for
`lib/modules/<m>/<path>/<file>.dart` lives at
`test/modules/<m>/<path>/<file>_test.dart`.

```
test/
  support/      # shared test infrastructure (not mirrored from lib/)
    pump_app.dart
  modules/      # mirrors lib/modules/
    shared/utils/color_utils_test.dart
    shared/widgets/ui/custom_button_test.dart
  README.md
```

## Patterns

The two exemplar tests are the templates to copy:

- **Pure unit test** — `modules/shared/utils/color_utils_test.dart`.
  For classes/functions with no Flutter binding: plain `group`/`test`,
  arrange → act → assert. No `pumpWidget`.

- **Widget test** — `modules/shared/widgets/ui/custom_button_test.dart`.
  Use the `pumpApp` harness from `support/pump_app.dart`. It wraps the widget
  in a `MaterialApp` with the app theme, localization delegates and a Riverpod
  `ProviderScope`, so widgets render as they do in production without booting
  Firebase. Pattern: `pumpApp` → `find` → interact → `expect`.

## Mocking

Use [`mocktail`](https://pub.dev/packages/mocktail) — no code generation.

```dart
class MockCalendarRepository extends Mock implements CalendarRepository {}

final repo = MockCalendarRepository();
when(() => repo.fetch()).thenAnswer((_) async => []);
// ...
verify(() => repo.fetch()).called(1);
```

Register fallback values for non-primitive argument matchers once, in
`setUpAll`:

```dart
setUpAll(() => registerFallbackValue(FakeEvent()));
```

## State management in tests

The app uses **Riverpod** (`hooks_riverpod`) as the primary state solution,
with some legacy `provider`/`ChangeNotifier` classes. New code and tests use
Riverpod; legacy providers are mocked as-is rather than migrated here.

- **Provider logic** — test with a `ProviderContainer`:

  ```dart
  final container = ProviderContainer(overrides: [
    repositoryProvider.overrideWithValue(MockRepo()),
  ]);
  addTearDown(container.dispose);
  expect(container.read(someProvider), ...);
  ```

- **Widgets that read providers** — pass `overrides` to `pumpApp`:

  ```dart
  await tester.pumpApp(
    const MyWidget(),
    overrides: [repositoryProvider.overrideWithValue(MockRepo())],
  );
  ```

## CI

`flutter test` runs in the `test-app` job of `.github/workflows/build.yaml`
on every push.
