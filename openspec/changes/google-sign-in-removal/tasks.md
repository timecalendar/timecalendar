# Tasks

Conventions for every task below:

- Flutter SDK is not on `PATH`; use `export PATH="/home/dev/flutter/bin:$PATH"`.
- All commands run from the repository root unless stated otherwise.
- This change has **zero Dart source-code edits**. If a task seems to need one, stop and escalate to FoundingEngineer — scope is wrong.
- `flutter analyze` / `flutter test` are run once at the end (group 5), not between intermediate edits.

## 1. Pre-flight verification

- [ ] 1.1 Confirm `google_sign_in` is in `app/pubspec.yaml` at `^6.1.4`:
  `grep -n "google_sign_in" app/pubspec.yaml` shows the line.
- [ ] 1.2 Confirm zero Dart imports of the plugin:
  `grep -rn "package:google_sign_in/\|GoogleSignIn" app/lib app/test app/integration_test` returns nothing.
- [ ] 1.3 Confirm the dead URL scheme lives in `app/ios/Runner/Info.plist`:
  `grep -n "com.googleusercontent.apps" app/ios/Runner/Info.plist` shows exactly one line inside the `CFBundleURLSchemes` array (`com.googleusercontent.apps.425450003183-1elevc6cg39idiukk9lh5sjtufis8h0r`).
- [ ] 1.4 Confirm `GoogleService-Info.plist` is the *other* file carrying
  this id (do not edit it):
  `grep -n "googleusercontent" app/ios/Runner/GoogleService-Info.plist` shows the `CLIENT_ID` / `REVERSED_CLIENT_ID` keys; the file will stay untouched.
- [ ] 1.5 Snapshot the 10 stale pbxproj lines for later verification:
  `grep -n "google_sign_in\|GoogleSignIn\|AppAuth\|GTMAppAuth\|GTMSessionFetcher" app/ios/Runner.xcodeproj/project.pbxproj` returns exactly 10 matches (1 inputPath + 1 outputPath for the privacy bundle, 4 inputPath + 4 outputPath for the frameworks). Save the line list — the same grep MUST return zero matches after step 3.
- [ ] 1.6 Confirm `app/ios/Runner/GeneratedPluginRegistrant.m` and `app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` are **not** tracked by git:
  `git ls-files app/ios/Runner/GeneratedPluginRegistrant.m app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` returns nothing. (They will regenerate from `flutter pub get` and are not part of the diff.)

## 2. Remove the dep from pubspec

- [ ] 2.1 In `app/pubspec.yaml`, delete the line `google_sign_in: ^6.1.4` from `dependencies:`. Do not change any other entry, the `version:`, the SDK constraint, or `dev_dependencies`.
- [ ] 2.2 From `app/`, run `flutter pub get`. It must resolve without error.
- [ ] 2.3 Confirm `app/pubspec.lock` no longer lists `google_sign_in`, `google_sign_in_android`, `google_sign_in_ios`, `google_sign_in_platform_interface`, or `google_sign_in_web`:
  `grep -n "google_sign_in" app/pubspec.lock` returns nothing.

## 3. Clean the iOS native side

- [ ] 3.1 In `app/ios/Runner/Info.plist`, inside the single `CFBundleURLTypes` → `CFBundleURLSchemes` array, delete the line
  `<string>com.googleusercontent.apps.425450003183-1elevc6cg39idiukk9lh5sjtufis8h0r</string>`. Leave the surrounding `<dict>`, the `CFBundleTypeRole` `Editor` key, and the Facebook scheme `<string>fb2272446229720075</string>` exactly as they were.
- [ ] 3.2 In `app/ios/Runner.xcodeproj/project.pbxproj`, delete these 10 lines (line numbers shown for orientation; verify by the exact string match before deleting):

  In the `[CP] Copy Pods Resources` script phase (id `5424A42C…`):
  - `inputPaths`: `"${PODS_CONFIGURATION_BUILD_DIR}/google_sign_in_ios/google_sign_in_ios_privacy.bundle",`
  - `outputPaths`: `"${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/google_sign_in_ios_privacy.bundle",`

  In the `[CP] Embed Pods Frameworks` script phase (id `9ABEF5A8…`):
  - `inputPaths`: `"${BUILT_PRODUCTS_DIR}/AppAuth/AppAuth.framework",`
  - `inputPaths`: `"${BUILT_PRODUCTS_DIR}/GTMAppAuth/GTMAppAuth.framework",`
  - `inputPaths`: `"${BUILT_PRODUCTS_DIR}/GTMSessionFetcher/GTMSessionFetcher.framework",`
  - `inputPaths`: `"${BUILT_PRODUCTS_DIR}/GoogleSignIn/GoogleSignIn.framework",`
  - `outputPaths`: `"${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/AppAuth.framework",`
  - `outputPaths`: `"${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/GTMAppAuth.framework",`
  - `outputPaths`: `"${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/GTMSessionFetcher.framework",`
  - `outputPaths`: `"${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/GoogleSignIn.framework",`

  Preserve comma placement and indentation of the remaining entries — these are pure line deletions, not edits to surrounding lines.
- [ ] 3.3 Re-grep:
  `grep -n "google_sign_in\|GoogleSignIn\|AppAuth\|GTMAppAuth\|GTMSessionFetcher" app/ios/Runner.xcodeproj/project.pbxproj` MUST return zero matches.
- [ ] 3.4 Confirm `app/ios/Runner/GoogleService-Info.plist` is unchanged
  in the working tree (`git diff app/ios/Runner/GoogleService-Info.plist` is empty).

## 4. Sanity-check the regenerated registrants

- [ ] 4.1 After `flutter pub get` (step 2.2), confirm `app/ios/Runner/GeneratedPluginRegistrant.m` no longer references `google_sign_in_ios` / `FLTGoogleSignInPlugin`:
  `grep -n "google_sign_in\|GoogleSignIn" app/ios/Runner/GeneratedPluginRegistrant.m` returns nothing.
- [ ] 4.2 Confirm `app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` no longer references `GoogleSignInPlugin`:
  `grep -n "GoogleSignIn\|google_sign_in" app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` returns nothing.
- [ ] 4.3 Both files are git-untracked (verified in 1.6), so they do not appear in the PR diff. If `git status` shows them, do not stage them — they regenerate on every `flutter pub get`.

## 5. Verify

- [ ] 5.1 From `app/`, run `flutter analyze` — no new issues.
- [ ] 5.2 From `app/`, run `flutter test` — the full unit + widget suite passes (50 tests at TIM-87 baseline; count may shift if other PRs landed in the meantime).
- [ ] 5.3 The Phase 1 E2E smoke suite (`app/integration_test/`) needs an Android emulator and is verified by CI. Ensure the PR's CI `Run E2E smoke flows` job is green before handing to Review.
- [ ] 5.4 CI's iOS build job runs `pod install --repo-update` from a clean checkout against the cleaned `Podfile`, `pubspec.lock`, and pbxproj. Confirm it is green — this is the verification of record for the pbxproj edit (the Linux Applier host has no Ruby/CocoaPods/Mac). If the iOS build fails with a missing-framework or missing-bundle error, capture the failing reference and escalate to the Reviewer / FoundingEngineer; do not retry-delete more lines speculatively.

## 6. Scope discipline

- [ ] 6.1 Confirm the final working-tree diff is exactly:
  `app/pubspec.yaml`, `app/pubspec.lock`,
  `app/ios/Runner/Info.plist`,
  `app/ios/Runner.xcodeproj/project.pbxproj`.
  No other files. (`Podfile.lock` is git-ignored.)
- [ ] 6.2 Confirm `app/ios/Runner/GoogleService-Info.plist`,
  `app/ios/Runner/GeneratedPluginRegistrant.m` (untracked), and
  `app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` (untracked) are **not** in the PR diff.
- [ ] 6.3 Confirm no edits to `server/`, `openapi/`, `web/`, `dev/`, or any other unrelated path. No Dart source-code edits anywhere.

## 7. Hand-off

- [ ] 7.1 Open the PR against `main`. CI jobs to gate on: `Run app tests`, `Run E2E smoke flows`, `Build server image`, `Build web image`, iOS build, Android build. All must be green before handing to the Simplifier / Reviewer.
- [ ] 7.2 Comment on [TIM-48](/TIM/issues/TIM-48) / the parent Apply issue with the PR URL and the final task-checklist state. Hand off per the dev-cycle chain (Applier → Simplifier → Reviewer).
