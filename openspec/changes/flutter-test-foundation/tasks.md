## 1. Dependencies

- [x] 1.1 Add `mocktail` to `dev_dependencies` in `app/pubspec.yaml`
- [x] 1.2 Run `flutter pub get` and confirm it resolves cleanly

## 2. Test harness

- [x] 2.1 Create `app/test/support/pump_app.dart` with a `pumpApp` helper that wraps a widget in `MaterialApp` (theme + localization delegates + `fr`/`en` locales) and a Riverpod `ProviderScope` accepting `overrides`
- [x] 2.2 Create `app/test/README.md` documenting: how to run `flutter test`, the `test/` mirrors `lib/modules/` convention, the mocktail mock strategy, Riverpod `ProviderContainer`/`overrides` usage, and the codegen prerequisite

## 3. Exemplar tests

- [x] 3.1 Delete the empty stub `app/test/widget_test.dart`
- [x] 3.2 Add `app/test/modules/shared/utils/color_utils_test.dart` — pure unit test for `ColorUtils` (`hexToColor`, `colorToHex`, `darkenColor`/`lightenColor`)
- [x] 3.3 Add `app/test/modules/shared/widgets/ui/custom_button_test.dart` — widget test for `CustomButton` using `pumpApp`: renders label, tap invokes `onPressed`, tap ignored while `loading`

## 4. Verification & CI

- [x] 4.1 Run `flutter test` in `app/` and confirm all tests pass
- [x] 4.2 Run `flutter analyze` and confirm no new issues from the added files
- [x] 4.3 Add a `test-app` job to `.github/workflows/build.yaml` that installs Flutter and runs `flutter pub get` + `flutter test` in `app/`
