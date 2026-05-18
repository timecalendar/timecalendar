## Context

`app/` is a Flutter app last maintained ~2 years ago. It uses `hooks_riverpod` (Riverpod) as the primary state-management approach, with some legacy `provider`/`ChangeNotifier` (`SettingsProvider`, `CalendarProvider`) and `state_notifier`. HTTP goes through `dio` and a generated `timecalendar_api` client; storage uses `sembast`/`shared_preferences`/`pref`; Firebase is initialized in `main()`.

There is currently no test infrastructure: `test/widget_test.dart` is an empty stub, `integration_test/app_test.dart` boots the full app, and `pubspec.yaml` has no mocking library. This change builds the unit/widget foundation only; E2E is `TIM-5` and broad coverage is `TIM-6`.

## Goals / Non-Goals

**Goals:**
- A mocking library and a documented, idiomatic mock strategy that fits Riverpod.
- A test layout and shared widget harness that A3 can scale without redesign.
- Two exemplar tests proving the unit and widget patterns.
- `flutter test` green locally and wired into CI.

**Non-Goals:**
- Coverage of existing modules beyond the exemplars.
- Integration/E2E tests (needs the NestJS backend — `TIM-5`).
- Touching production `lib/` code or upgrading dependencies.

## Decisions

**Mocking: `mocktail` over `mockito`.** `mockito`'s null-safe mode requires `build_runner` codegen (`@GenerateMocks`); the app already runs `build_runner` for `freezed`/`json_serializable`/`built_value`, and adding generated mocks worsens an already slow codegen step. `mocktail` needs no codegen, has the cleanest API for Riverpod-style tests, and is actively maintained. There is no `bloc` in the app, so `bloc_test` is not needed.

**State in tests: Riverpod `ProviderScope` overrides.** Widget tests pump under a `ProviderScope(overrides: [...])`; pure provider logic is tested with a `ProviderContainer`. Legacy `ChangeNotifier` providers are supplied via `ChangeNotifierProvider` in the same harness when a widget needs them. This matches `app.dart`, which already nests `ProviderScope` over `MultiProvider`.

**Test layout mirrors `lib/`.** `test/modules/<m>/...` mirrors `lib/modules/<m>/...`, file suffix `_test.dart`. Predictable location; trivial to find the test for any source file.

**Shared harness in `test/support/`.** A single `pumpApp(tester, widget, {overrides})` helper wraps the widget-under-test in `MaterialApp` (theme + localization delegates + `fr`/`en` locales) and a `ProviderScope`. Keeping it out of `lib/` (unlike the existing `lib/modules/shared/test_utils/`, which `integration_test` imports) keeps test-only code out of the shipped app. The existing in-`lib` `test_utils.dart` is left untouched for the E2E task.

**CI: a dedicated `test-app` job.** `.github/workflows/build.yaml` has no Flutter job. Add one job that checks out, installs Flutter (pinned stable via `subosito/flutter-action`), runs `flutter pub get` and `flutter test` in `app/`. It runs independently of the server build/test jobs.

**Exemplars chosen for zero external setup.** `ColorUtils` is pure (no Firebase, no async, no locale) → ideal unit exemplar. `CustomButton` is a `StatelessWidget` needing only `Theme`/`MaterialApp` → ideal widget exemplar, and its `loading` guard gives a meaningful interaction assertion. A mocktail mock is shown in `test/README.md` rather than forced into an exemplar, since no shared widget has a clean injectable dependency without `lib/` changes.

## Risks / Trade-offs

- [`flutter test` may surface plugin-channel calls (Firebase, shared_preferences) for widgets that transitively touch them] → Exemplars are deliberately plugin-free; the harness documents `TestWidgetsFlutterBinding` mock-channel setup for when A3 hits plugin-backed widgets.
- [Pinned Flutter version in CI can drift from local] → Pin an explicit stable version string in the workflow and the test README so both move together.
- [Codegen artifacts (`*.g.dart`, `freezed`) must exist before `flutter test`] → CI runs `flutter pub get` (and `build_runner` if needed) before `flutter test`; documented in the README.
- [Legacy `provider` + Riverpod coexisting could confuse contributors] → The README states the rule: new code/tests use Riverpod; legacy providers are mocked as-is, not migrated here.

## Migration Plan

Additive only — new files plus one `pubspec.yaml` dev dependency and one CI job. No rollback concern; reverting the change removes the test scaffold without affecting the app. The empty `test/widget_test.dart` stub is deleted and replaced by the exemplar tests.

## Open Questions

- Coverage reporting (e.g. `--coverage` + Codecov) is deferred; CI runs tests without uploading coverage until a target is agreed.
