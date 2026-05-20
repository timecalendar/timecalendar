## ADDED Requirements

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
