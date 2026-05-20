# flutter-dependency-hygiene Specification

## Purpose
TBD - created by archiving change remove-dead-and-stale-flutter-deps. Update Purpose after archive.
## Requirements
### Requirement: No dead direct dependencies

The app's direct dependencies in `app/pubspec.yaml` SHALL NOT include packages
that have zero `package:` imports in `app/lib/`. The B3 wave SHALL remove
`tuple`, `frontend_server_client`, and `state_notifier` from the
`dependencies:` section. The `StateNotifier` and `StateNotifierProvider` symbols
SHALL remain available through `hooks_riverpod`'s re-export without any source
change.

#### Scenario: Dead packages are gone from pubspec

- **WHEN** `app/pubspec.yaml` is inspected after the change
- **THEN** `tuple`, `frontend_server_client`, and `state_notifier` are absent from `dependencies:`
- **AND** `app/pubspec.lock` no longer lists them as direct dependencies

#### Scenario: Riverpod state-notifier symbols still resolve

- **WHEN** `flutter analyze` is run after `state_notifier` is removed
- **THEN** every existing use of `StateNotifier` and `StateNotifierProvider` resolves with no new analyzer error

### Requirement: No discontinued packages, swaps preserve behaviour

The app SHALL NOT depend on the discontinued/stale packages `flutter_image`,
`color`, `reorderables`, `enum_to_string`, and `flutter_material_color_picker`.
The B3 wave SHALL replace each with a native Flutter API or a maintained
package, preserving the observable behaviour of every affected screen and
utility. `cached_network_image` and `flutter_colorpicker` SHALL be the only new
direct dependencies introduced.

#### Scenario: Stale packages are replaced in pubspec

- **WHEN** `app/pubspec.yaml` is inspected after the change
- **THEN** `flutter_image`, `color`, `reorderables`, `enum_to_string`, and `flutter_material_color_picker` are absent from `dependencies:`
- **AND** `cached_network_image` and `flutter_colorpicker` are present as direct dependencies

#### Scenario: Remote images still load with retry and caching

- **WHEN** a school logo is displayed via `FadeInImage` after the swap
- **THEN** the image is provided by `CachedNetworkImageProvider` and renders the placeholder while loading

#### Scenario: Color math is unchanged

- **WHEN** `ColorUtils.darkenColor` / `lightenColor` are called on an in-app event color
- **THEN** the result matches the pre-change output, computed via native `HSLColor` with lightness clamped to `0.0..1.0`

#### Scenario: Checklist reorder still works

- **WHEN** a checklist item is long-press dragged to a new position
- **THEN** the native `SliverReorderableList` reorders the items and `ChecklistItemNotifier.reorderItems` persists the new order

#### Scenario: Enum persistence round-trips

- **WHEN** `CalendarViewType` is written to and read from `SharedPreferences`
- **THEN** the persisted string matches `Enum.name` and an unknown stored value falls back to the default without throwing

#### Scenario: Event color picker still works

- **WHEN** the user opens the color picker on the add-personal-event screen
- **THEN** `flutter_colorpicker`'s `MaterialPicker` is shown and the chosen color flows through the existing confirm/cancel dialog flow

### Requirement: pref is retained with a documented decision

The B3 wave SHALL keep the `pref` package as a direct dependency. `pref` is the
settings-screen UI framework rather than a leaf utility; it is stale but still
published and SDK-compatible, so it is out of scope for B3's
dead/discontinued-package cleanup. Any migration off `pref` SHALL be tracked as
a separate change.

#### Scenario: pref remains in pubspec

- **WHEN** `app/pubspec.yaml` is inspected after the change
- **THEN** `pref` is still present in `dependencies:`
- **AND** the settings screen continues to build on `pref` widgets unchanged

### Requirement: The change lands analyze-clean and test-green

The B3 swaps SHALL NOT introduce analyzer issues or test failures.

#### Scenario: Analyze and tests pass

- **WHEN** `flutter analyze` and `flutter test` are run on the changed app
- **THEN** `flutter analyze` reports no new issues attributable to the change
- **AND** the unit and widget test suite passes
- **AND** the Phase 1 E2E smoke suite passes in CI

### Requirement: No zombie plugin-dependencies with stale native artifacts

The app SHALL NOT declare a Flutter plugin dependency that has zero
`package:` imports across `app/lib/`, `app/test/`, and
`app/integration_test/` and that ships native iOS / Android side-effects
(plugin frameworks, URL schemes, build-phase entries). Removing such a
zombie plugin SHALL also remove its native artifacts in the same change,
so that `app/ios/` and `app/android/` do not carry dead config for a
plugin that no longer exists.

The B6 wave ([TIM-48](/TIM/issues/TIM-48)) SHALL remove `google_sign_in`
from `app/pubspec.yaml`, drop its reverse-client-id OAuth URL scheme
(`com.googleusercontent.apps.425450003183-1elevc6cg39idiukk9lh5sjtufis8h0r`)
from `app/ios/Runner/Info.plist`, and purge its Pods-managed input/output
path entries (`google_sign_in_ios`, `GoogleSignIn`, `AppAuth`,
`GTMAppAuth`, `GTMSessionFetcher`) from
`app/ios/Runner.xcodeproj/project.pbxproj`. The
`GoogleService-Info.plist` file (Firebase-emitted) SHALL be left
untouched.

#### Scenario: google_sign_in is gone from pubspec

- **WHEN** `app/pubspec.yaml` is inspected after the change
- **THEN** `google_sign_in` is absent from `dependencies:`
- **AND** `app/pubspec.lock` no longer lists `google_sign_in`,
  `google_sign_in_android`, `google_sign_in_ios`,
  `google_sign_in_platform_interface`, or `google_sign_in_web` as
  resolved packages

#### Scenario: Dead OAuth URL scheme is gone from Info.plist

- **WHEN** `app/ios/Runner/Info.plist` is inspected after the change
- **THEN** the `CFBundleURLTypes` array no longer contains
  `com.googleusercontent.apps.425450003183-1elevc6cg39idiukk9lh5sjtufis8h0r`
- **AND** the Facebook OAuth scheme `fb2272446229720075` in the same
  array is unchanged

#### Scenario: Stale Pods entries are gone from pbxproj

- **WHEN** `app/ios/Runner.xcodeproj/project.pbxproj` is searched after
  the change for any of `google_sign_in`, `GoogleSignIn`, `AppAuth`,
  `GTMAppAuth`, `GTMSessionFetcher`
- **THEN** zero matches are returned
- **AND** the `[CP] Copy Pods Resources` and `[CP] Embed Pods Frameworks`
  script-phase entries for the remaining Pods (Firebase frameworks,
  `permission_handler_apple`, etc.) are otherwise unchanged

#### Scenario: GoogleService-Info.plist is untouched

- **WHEN** `app/ios/Runner/GoogleService-Info.plist` is inspected after
  the change
- **THEN** all keys, including `CLIENT_ID` and `REVERSED_CLIENT_ID`, are
  byte-identical to before the change

#### Scenario: No Dart source-code edits

- **WHEN** the change's diff is inspected
- **THEN** zero files under `app/lib/`, `app/test/`, or
  `app/integration_test/` are modified
- **AND** no backend (`server/`), `openapi/`, `web/`, or CI files are
  modified

#### Scenario: Change is analyze-clean and test-green

- **WHEN** `flutter analyze` and `flutter test` are run on the changed
  app
- **THEN** `flutter analyze` reports no new issues attributable to the
  change
- **AND** the unit and widget test suite passes
- **AND** the Phase 1 E2E smoke suite passes in CI
- **AND** the iOS build job in CI completes successfully against the
  edited pbxproj

### Requirement: B7 zombie notifications plugin and its iOS artifacts are removed

The app SHALL NOT declare `flutter_local_notifications` as a direct
dependency, given that the plugin has zero `package:` imports across
`app/lib/`, `app/test/`, and `app/integration_test/`, all push handling
goes through `firebase_messaging`, and no local scheduling exists. The
B7 wave ([TIM-49](/TIM/issues/TIM-49)) SHALL remove
`flutter_local_notifications` from `app/pubspec.yaml` and purge its
Pods-managed `flutter_local_notifications.framework` input/output path
entries from `app/ios/Runner.xcodeproj/project.pbxproj`. The stale
`// flutter_local_notifications requires desugaring` comment in
`app/android/app/build.gradle` SHALL be removed; the
`coreLibraryDesugaringEnabled true` setting and the `desugar_jdk_libs`
dependency line SHALL be left in place as a conservative default.

#### Scenario: flutter_local_notifications is gone from pubspec

- **WHEN** `app/pubspec.yaml` is inspected after the change
- **THEN** `flutter_local_notifications` is absent from `dependencies:`
- **AND** `app/pubspec.lock` no longer lists
  `flutter_local_notifications`, `flutter_local_notifications_linux`,
  `flutter_local_notifications_platform_interface`, or
  `flutter_local_notifications_windows` as resolved packages

#### Scenario: Stale Pods entries are gone from pbxproj

- **WHEN** `app/ios/Runner.xcodeproj/project.pbxproj` is searched after
  the change for `flutter_local_notifications`
- **THEN** zero matches are returned
- **AND** the `[CP] Embed Pods Frameworks` script-phase entries for the
  remaining Pods (Firebase frameworks, `device_info_plus`,
  `package_info_plus`, `mobile_scanner`, `integration_test`,
  `permission_handler_apple`, etc.) are otherwise unchanged

#### Scenario: Android build.gradle no longer references the dead plugin

- **WHEN** `app/android/app/build.gradle` is inspected after the change
- **THEN** there are no references to `flutter_local_notifications`
- **AND** the `coreLibraryDesugaringEnabled true` setting is unchanged
- **AND** the `coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.1.4'`
  dependency line is unchanged

#### Scenario: No Dart edits attributable to the deletion

- **WHEN** the change's diff is inspected for files under `app/lib/`,
  `app/test/`, and `app/integration_test/`
- **THEN** zero Dart files are modified solely because
  `flutter_local_notifications` was removed (there were no callers to
  begin with)

### Requirement: B7 plus-plugin, icon, and lint majors land together

The B7 wave SHALL bump four direct dependencies in `app/pubspec.yaml` to
their new majors in a single change: `device_info_plus` to `^13`,
`package_info_plus` to `^10`, `font_awesome_flutter` to `^11`, and
`flutter_lints` (dev) to `^6`. Each bump SHALL be verified analyze-clean
and test-green together — they share the same regression gate (Phase 1
E2E smoke) and merge story with the
`flutter_local_notifications` deletion. The 17 distinct
`FontAwesomeIcons` constants currently in use (`calendar`,
`calendarDays`, `eyeSlash`, `gear`, `graduationCap`, `house`, `info`,
`list`, `magnifyingGlass`, `paperPlane`, `pencil`, `plus`, `squareCheck`,
`toggleOn`, `upRightFromSquare`, `user`, `xmark`) SHALL all resolve in
v11; if `font_awesome_flutter` v11 renames or drops any constant, its
call sites SHALL be updated in the same change.

#### Scenario: pubspec carries the bumped versions

- **WHEN** `app/pubspec.yaml` is inspected after the change
- **THEN** `device_info_plus` is at `^13`
- **AND** `package_info_plus` is at `^10`
- **AND** `font_awesome_flutter` is at `^11`
- **AND** `flutter_lints` (under `dev_dependencies`) is at `^6`

#### Scenario: Plus-plugin call sites still resolve

- **WHEN** `flutter analyze` is run after the bumps
- **THEN** `app/lib/modules/suggestion/utils/format_device_info.dart`
  and `app/lib/modules/suggestion/screens/suggestion_screen.dart`
  compile with `device_info_plus` v13 — `DeviceInfoPlugin()` and the
  `BaseDeviceInfo.data` map access continue to work as before
- **AND** `app/lib/modules/settings/providers/settings_provider.dart`
  and `app/test/support/settings_provider.dart` compile with
  `package_info_plus` v10 — `PackageInfo.fromPlatform()`, `.version`,
  `.buildNumber`, and `PackageInfo.setMockInitialValues(...)` continue
  to resolve as before

#### Scenario: All in-use FontAwesome icons resolve in v11

- **WHEN** `flutter analyze` is run after the `font_awesome_flutter`
  bump
- **THEN** each of the 17 in-use constants (`calendar`, `calendarDays`,
  `eyeSlash`, `gear`, `graduationCap`, `house`, `info`, `list`,
  `magnifyingGlass`, `paperPlane`, `pencil`, `plus`, `squareCheck`,
  `toggleOn`, `upRightFromSquare`, `user`, `xmark`) resolves to a valid
  v11 symbol — directly, or via a rename applied at the call site in
  this same change

#### Scenario: flutter_lints v6 has no new unresolved analyzer issues

- **WHEN** `flutter analyze` is run with `flutter_lints` at `^6`
- **THEN** zero new issues are reported attributable to the bump — any
  new v6 lints surfaced have been resolved in this same change

#### Scenario: Combined change is analyze-clean and test-green

- **WHEN** `flutter analyze` and `flutter test` are run on the app
  after the deletion and the four bumps
- **THEN** `flutter analyze` reports no new issues attributable to the
  change
- **AND** the unit and widget test suite passes
- **AND** the Phase 1 E2E smoke suite passes in CI
- **AND** the iOS build job in CI completes successfully against the
  edited pbxproj

