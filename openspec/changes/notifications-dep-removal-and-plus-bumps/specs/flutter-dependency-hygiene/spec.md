## ADDED Requirements

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
