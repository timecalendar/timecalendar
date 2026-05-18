## Why

The Flutter app (`app/`) has no automated test coverage — `test/widget_test.dart` is an empty stub and there is no mocking library, no harness, and no agreed pattern. Before we can safely upgrade dependencies or ship features, we need a testing foundation so regressions are caught and future tests (A3) can be scaled from a proven pattern.

## What Changes

- Add `mocktail` as a dev dependency in `app/pubspec.yaml` (no codegen; chosen over `mockito` to avoid `build_runner` coupling for mocks).
- Establish a test directory layout under `app/test/` that mirrors `app/lib/modules/`.
- Add a shared widget-test harness (`app/test/support/`) providing a `pumpWidget` wrapper that supplies `MaterialApp`, theme, localization, and Riverpod `ProviderScope` overrides.
- Document the mock strategy (mocktail + Riverpod `ProviderContainer`/`overrides`) in `app/test/README.md`.
- Replace the empty `test/widget_test.dart` stub with two exemplar tests:
  - a pure unit test for `ColorUtils` (`shared/utils/color_utils.dart`),
  - a widget test for `CustomButton` (`shared/widgets/ui/custom_button.dart`) covering render and tap/`loading` behaviour.
- Ensure `flutter test` runs green locally.
- Add a CI job that runs `flutter test` (the existing `.github/workflows/build.yaml` has no Flutter job today).

Non-goals: broad coverage of existing modules (that is A3 — `TIM-6`), E2E/integration smoke tests (that is A2 — `TIM-5`), and any dependency upgrades.

## Capabilities

### New Capabilities
- `flutter-test-harness`: the unit/widget test infrastructure for the Flutter app — test layout, mocking strategy, shared pump helper, the exemplar tests, and the CI hook that runs them.

### Modified Capabilities
<!-- None — no existing OpenSpec specs cover app testing. -->

## Impact

- `app/pubspec.yaml` — new `dev_dependencies` entry (`mocktail`).
- `app/test/` — new directory tree, `support/` harness, `README.md`, exemplar tests; removes the empty `test/widget_test.dart` stub.
- `.github/workflows/build.yaml` — new `test-app` job running `flutter test`.
- No production (`lib/`) code changes; behaviour of the app is unchanged.
