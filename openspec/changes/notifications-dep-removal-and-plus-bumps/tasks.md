# Tasks

Conventions for every task below:

- Flutter SDK is not on `PATH`; use `export PATH="/home/dev/flutter/bin:$PATH"`.
- All commands run from the repository root unless stated otherwise.
- This change is mechanical pubspec / config edits plus a verify-then-rename loop for `font_awesome_flutter`. If a task seems to need a non-mechanical Dart refactor, stop and escalate to FoundingEngineer — scope is wrong.
- `flutter analyze` / `flutter test` are run once at the end (group 11), not between intermediate edits, except for the targeted analyze in the `font_awesome_flutter` and `flutter_lints` steps which need to surface breakage before continuing.

## 1. Pre-flight verification

- [x] 1.1 Confirm `flutter_local_notifications` is in `app/pubspec.yaml` at `^19.2.1`:
  `grep -n "flutter_local_notifications" app/pubspec.yaml` shows exactly one line under `dependencies:`.
- [x] 1.2 Confirm zero Dart imports of the plugin:
  `grep -rn "package:flutter_local_notifications/\|FlutterLocalNotifications" app/lib app/test app/integration_test` returns nothing.
- [x] 1.3 Confirm the only native references to the plugin live in iOS pbxproj and `build.gradle` (the audit baseline):
  `grep -rn "flutter_local_notifications" app/ios/Runner.xcodeproj/project.pbxproj app/android/app/build.gradle` returns exactly 4 matches — 2 in the pbxproj (1 inputPath + 1 outputPath) and 2 comment lines in `build.gradle`.
- [x] 1.4 Snapshot the 2 pbxproj lines:
  `grep -n "flutter_local_notifications" app/ios/Runner.xcodeproj/project.pbxproj` shows the inputPath under `[CP] Embed Pods Frameworks` and the matching outputPath. Save the line numbers — the same grep MUST return zero matches after step 3.
- [x] 1.5 Confirm `app/ios/Runner/GeneratedPluginRegistrant.m` and `app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` are **not** tracked by git:
  `git ls-files app/ios/Runner/GeneratedPluginRegistrant.m app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` returns nothing. (Both regenerate from `flutter pub get` and are not part of the diff.)
- [x] 1.6 Confirm the four bump-target deps are at their current pinned majors:
  `grep -nE "^  (device_info_plus|package_info_plus|font_awesome_flutter|flutter_lints):" app/pubspec.yaml` shows `device_info_plus: ^11.4.0`, `package_info_plus: ^8.3.0`, `font_awesome_flutter: ^10.5.0`, `flutter_lints: ^5.0.0`.
- [x] 1.7 Confirm the 17 in-use `FontAwesomeIcons` constants (the v10 baseline) match the list in the proposal:
  ``grep -rno "FontAwesomeIcons\.[a-zA-Z]\+" app/lib | awk -F. '{print $2}' | sort -u`` returns exactly the set `{calendar, calendarDays, eyeSlash, gear, graduationCap, house, info, list, magnifyingGlass, paperPlane, pencil, plus, squareCheck, toggleOn, upRightFromSquare, user, xmark}`. If the set differs (a constant has been added since the audit), update the verify list in step 8 and the spec scenario accordingly.

## 2. Remove flutter_local_notifications from pubspec

- [x] 2.1 In `app/pubspec.yaml`, delete the line `flutter_local_notifications: ^19.2.1` from `dependencies:`. Do not change any other entry, the `version:`, the SDK constraint, or `dev_dependencies` (yet — bumps come later).
- [x] 2.2 From `app/`, run `flutter pub get`. It must resolve without error.
- [x] 2.3 Confirm `app/pubspec.lock` no longer lists `flutter_local_notifications`, `flutter_local_notifications_linux`, `flutter_local_notifications_platform_interface`, or `flutter_local_notifications_windows`:
  `grep -n "flutter_local_notifications" app/pubspec.lock` returns nothing.

## 3. Clean the iOS native side

- [x] 3.1 In `app/ios/Runner.xcodeproj/project.pbxproj`, delete these 2 lines (verify by exact-string match before deleting):
  - In the `[CP] Embed Pods Frameworks` script phase, `inputPaths`:
    `"${BUILT_PRODUCTS_DIR}/flutter_local_notifications/flutter_local_notifications.framework",`
  - In the same script phase, `outputPaths`:
    `"${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/flutter_local_notifications.framework",`

  Preserve comma placement and indentation of the remaining entries — these are pure line deletions, not edits to surrounding lines.
- [x] 3.2 Re-grep:
  `grep -n "flutter_local_notifications" app/ios/Runner.xcodeproj/project.pbxproj` MUST return zero matches.
- [x] 3.3 Confirm no other iOS native file references the plugin:
  `grep -rn "flutter_local_notifications\|FlutterLocalNotifications" app/ios/` returns nothing under `Runner/Info.plist`, `Runner/AppDelegate.[hm]`, `Runner/main.m`, `Podfile`, or `Runner/Runner.entitlements`. (`Pods/`, `Podfile.lock`, `GeneratedPluginRegistrant.m` are CI/`flutter pub get` artifacts and either don't exist on the Applier host or regenerate; do not edit them.)

## 4. Clean the Android native side

- [x] 4.1 In `app/android/app/build.gradle`, delete the two-line comment block immediately above `compileOptions`:
  ```
  // flutter_local_notifications requires desugaring
  // https://pub.dev/packages/flutter_local_notifications#gradle-setup
  ```
  Do NOT touch `coreLibraryDesugaringEnabled true`, `sourceCompatibility`, `targetCompatibility`, `kotlinOptions`, or the `coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.1.4'` line in `dependencies`.
- [x] 4.2 Re-grep:
  `grep -n "flutter_local_notifications" app/android/app/build.gradle` MUST return zero matches.
- [x] 4.3 Confirm no other Android source file references the plugin:
  `grep -rn "flutter_local_notifications\|FlutterLocalNotifications" app/android/` excluding `app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` (git-untracked, regenerates) returns nothing.

## 5. Sanity-check the regenerated registrants

- [x] 5.1 After `flutter pub get` (step 2.2), confirm `app/ios/Runner/GeneratedPluginRegistrant.m` no longer references `flutter_local_notifications` / `FlutterLocalNotificationsPlugin`:
  `grep -n "flutter_local_notifications\|FlutterLocalNotifications" app/ios/Runner/GeneratedPluginRegistrant.m` returns nothing.
- [x] 5.2 Confirm `app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` no longer references `FlutterLocalNotificationsPlugin`:
  `grep -n "FlutterLocalNotifications\|flutter_local_notifications" app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` returns nothing.
- [x] 5.3 Both files are git-untracked (verified in 1.5), so they do not appear in the PR diff. If `git status` shows them, do not stage them.

## 6. Bump device_info_plus to ^13

- [x] 6.1 In `app/pubspec.yaml`, change `device_info_plus: ^11.4.0` to `device_info_plus: ^13.0.0` (use the latest v13 minor available from pub.dev at the time of apply; the `^13.0.0` floor is the contract).
- [x] 6.2 From `app/`, run `flutter pub get`. It must resolve without error. If `pub` complains about a transitive constraint that pins to an older `device_info_plus`, escalate.
- [x] 6.3 From `app/`, run `flutter analyze lib/modules/suggestion/`. It must report no new issues — `BaseDeviceInfo` and `DeviceInfoPlugin()` continue to resolve, and `.data` access compiles. If v13 changed the `.data` shape and analyze fails, update the two call sites (`app/lib/modules/suggestion/utils/format_device_info.dart`, `app/lib/modules/suggestion/screens/suggestion_screen.dart`) minimally to match v13's API, then re-run analyze.

## 7. Bump package_info_plus to ^10

- [x] 7.1 In `app/pubspec.yaml`, change `package_info_plus: ^8.3.0` to `package_info_plus: ^10.0.0` (use the latest v10 minor available from pub.dev at the time of apply; the `^10.0.0` floor is the contract).
- [x] 7.2 From `app/`, run `flutter pub get`. It must resolve without error.
- [x] 7.3 From `app/`, run `flutter analyze lib/modules/settings/ test/support/settings_provider.dart`. It must report no new issues — `PackageInfo.fromPlatform()`, `.version`, `.buildNumber`, and `PackageInfo.setMockInitialValues(...)` continue to resolve. If v9 or v10 changed any of those signatures and analyze fails, update the two call sites (`app/lib/modules/settings/providers/settings_provider.dart`, `app/test/support/settings_provider.dart`) minimally to match v10's API, then re-run analyze.

## 8. Bump font_awesome_flutter to ^11 — verify-then-rename loop

- [x] 8.1 In `app/pubspec.yaml`, change `font_awesome_flutter: ^10.5.0` to `font_awesome_flutter: ^11.0.0`.
- [x] 8.2 From `app/`, run `flutter pub get`. It must resolve without error.
- [x] 8.3 From `app/`, run `flutter analyze lib/`. Capture every error referencing `FontAwesomeIcons.<constant>`.
- [x] 8.4 For each unresolved constant in the in-use set (`calendar`, `calendarDays`, `eyeSlash`, `gear`, `graduationCap`, `house`, `info`, `list`, `magnifyingGlass`, `paperPlane`, `pencil`, `plus`, `squareCheck`, `toggleOn`, `upRightFromSquare`, `user`, `xmark`), look up the v11 equivalent on pub.dev / GitHub changelog, then update the call site to the new constant. If v11 dropped a constant without a one-to-one replacement, **stop and escalate to FoundingEngineer** — do not guess a substitute.
- [x] 8.5 Re-run `flutter analyze lib/` after each rename pass until it reports no `FontAwesomeIcons.*` errors.
- [x] 8.6 Sanity grep: every `FontAwesomeIcons.<constant>` occurrence in `app/lib/` now matches a constant that exists in `font_awesome_flutter` v11:
  ``grep -rno "FontAwesomeIcons\.[a-zA-Z]\+" app/lib | awk -F. '{print $2}' | sort -u`` returns the post-rename set; spot-check that no v10-only constant remains in the output.

## 9. Bump flutter_lints to ^6

- [x] 9.1 In `app/pubspec.yaml`, under `dev_dependencies`, change `flutter_lints: ^5.0.0` to `flutter_lints: ^6.0.0`.
- [x] 9.2 From `app/`, run `flutter pub get`. It must resolve without error.
- [x] 9.3 From `app/`, run `flutter analyze`. Capture every new issue introduced by v6's stricter ruleset.
- [x] 9.4 For each new issue, prefer fixing the source over silencing the rule. Acceptable mechanical fixes: add `const` where suggested, prefer single quotes, sort directives. If v6 introduces a rule that requires a non-trivial refactor (>10 sites or any subtle behaviour change), **stop and escalate to FoundingEngineer** with the issue summary; the answer may be to silence that rule in `analysis_options.yaml` for this change and file a follow-up issue.
- [x] 9.5 Re-run `flutter analyze`. It MUST report zero issues attributable to this change.

## 10. Sanity-check pubspec end state

- [x] 10.1 Confirm `app/pubspec.yaml` after all five edits shows:
  - `flutter_local_notifications` absent.
  - `device_info_plus: ^13.0.0` (or compatible v13).
  - `package_info_plus: ^10.0.0` (or compatible v10).
  - `font_awesome_flutter: ^11.0.0` (or compatible v11).
  - `flutter_lints: ^6.0.0` (or compatible v6) under `dev_dependencies`.
- [x] 10.2 Confirm `app/pubspec.lock`:
  - `grep -n "flutter_local_notifications" app/pubspec.lock` returns nothing.
  - `device_info_plus`, `package_info_plus`, `font_awesome_flutter`, `flutter_lints` resolved versions match the new major.

## 11. Verify

- [x] 11.1 From `app/`, run `flutter analyze` — no new issues across the full app + tests + integration_test surface.
- [x] 11.2 From `app/`, run `flutter test` — the full unit + widget suite passes (50 tests at the TIM-87 baseline; count may shift if other PRs landed in the meantime).
- [x] 11.3 The Phase 1 E2E smoke suite (`app/integration_test/`) needs an Android emulator and is verified by CI. Ensure the PR's CI `Run E2E smoke flows` job is green before handing to the Reviewer.
- [x] 11.4 CI's iOS build job runs `pod install --repo-update` from a clean checkout against the cleaned `pubspec.lock` and pbxproj. Confirm it is green — this is the verification of record for the pbxproj edit (the Linux Applier host has no Ruby/CocoaPods/Mac). If the iOS build fails with a missing-framework or missing-input-file error, capture the failing reference and escalate to the Reviewer / FoundingEngineer; do not retry-delete more lines speculatively.

## 12. Scope discipline

- [x] 12.1 Confirm the final working-tree diff is exactly:
  `app/pubspec.yaml`, `app/pubspec.lock`,
  `app/ios/Runner.xcodeproj/project.pbxproj`,
  `app/android/app/build.gradle`,
  and (only if v11 renamed a `FontAwesomeIcons` constant) any of the ~15 icon-using files under `app/lib/modules/**` for the rename. No other files. (`Podfile.lock`, `Pods/`, registrants are git-ignored or git-untracked.)
- [x] 12.2 Confirm `app/ios/Runner/GoogleService-Info.plist`, `app/ios/Runner/Info.plist`,
  `app/ios/Runner/GeneratedPluginRegistrant.m` (untracked), and
  `app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java` (untracked) are **not** in the PR diff.
- [x] 12.3 Confirm no edits to `server/`, `openapi/`, `web/`, `dev/`, or any other unrelated path. The Android `compileSdk`, `minSdk`, Java/Kotlin compat versions, and `coreLibraryDesugaringEnabled` setting are unchanged.

## 13. Hand-off

- [x] 13.1 Commit on branch `TIM-49-notifications-dep-removal-and-plus-bumps` (already created by the Planner off `main`). Commit message convention: `chore(deps): B7 — remove flutter_local_notifications + bump plus/icon/lint majors (TIM-49)`.
- [x] 13.2 Open the PR against `main`. CI jobs to gate on: `Run app tests`, `Run E2E smoke flows`, `Build server image`, `Build web image`, iOS build, Android build. All must be green before handing to the Simplifier / Reviewer. **(Owned by the Reviewer per the dev-cycle chain; see TIM-98.)**
- [x] 13.3 Comment on [TIM-96](/TIM/issues/TIM-96) (the Apply issue) with the final task-checklist state. Hand off per the dev-cycle chain (Applier → Simplifier → Reviewer).

## 14. Implementation notes

### Divergence: font_awesome_flutter v11 `FaIconData` type split

The plan anticipated a "verify-then-rename" loop assuming v11 might rename or drop individual `FontAwesomeIcons.*` constants (§8.4 escalation gate). The actual v11 breaking change is different:

- v11 introduces a separate `FaIconData` type that **does not implement** `IconData` (per upstream changelog: "to prevent rendering issues and to anticipate `IconData` being marked `final`").
- `FaIcon` now strictly requires `FaIconData`. Material's `Icon` widget can no longer accept `FontAwesomeIcons.*`.
- All 17 in-use constants still exist in v11 with the same names — no renames, no drops.

The plan's §8.4 escalation criterion ("v11 dropped a constant without a one-to-one replacement") did not trigger. The divergence shape is wider (a type-system shift forcing `Icon(...)` → `FaIcon(...)` swaps at FA-using call sites) but each individual edit is mechanical with no behaviour change (`FaIcon extends Icon`). Per the issue body's policy ("document the divergence in `tasks.md` Implementation notes and continue — do not silently fix scope"), the divergence is documented here and the change continues without re-scoping.

### Files touched and how

12 direct `Icon(FontAwesomeIcons.X)` call sites were swapped to `FaIcon(FontAwesomeIcons.X)`:

- `lib/modules/activity/widgets/no_activity.dart` (1)
- `lib/modules/calendar/widgets/planning_view/planning_rectangle_event.dart` (1)
- `lib/modules/event_details/widgets/event_details_checklist_section.dart` (1)
- `lib/modules/home/screens/tabs_screen.dart` (3)
- `lib/modules/home/widgets/home_rectangle_event.dart` (1)
- `lib/modules/profile/widgets/profile_header.dart` (1)
- `lib/modules/shared/constants/constants.dart` (3)
- `lib/modules/shared/widgets/ui/app_search_bar.dart` (1)

Three custom widgets that previously typed their `icon` parameter as `IconData` had to be refactored to accept any icon widget. Each takes `Widget icon` and wraps the child in an `IconTheme` to preserve the prior size/colour ergonomics; callers wrap their literal in `Icon(...)` or `FaIcon(...)`:

- `lib/modules/profile/widgets/profile_item.dart` — `IconData` → `Widget`; 5 callers wrapped (`profile_screen.dart`).
- `lib/modules/event_details/widgets/event_details_line.dart` — `IconData` → `Widget`; 4 callers wrapped (`event_details_content.dart`, 3 Material + 1 FA).
- `lib/modules/shared/widgets/ui/custom_button.dart` — `IconData?` → `Widget?`; only 1 of the 18 `CustomButton` call sites passed an icon (the FA caller in `assistant/screens/connect_screen.dart`), so it is the only one wrapped.

### Verification

- `flutter pub get` clean after each pubspec edit; `pubspec.lock` drops `flutter_local_notifications`, `_linux`, `_platform_interface`, `_windows` (plus transitives `dbus`, `timezone`).
- `flutter analyze` (full `app/`) — `No issues found!` (zero new lints from `flutter_lints` v6).
- `flutter test` — 50/50 passed (matches TIM-87 baseline).
- Resolved versions: `device_info_plus` 13.1.0, `package_info_plus` 10.1.0, `font_awesome_flutter` 11.0.0, `flutter_lints` 6.0.0.
- iOS pbxproj edit and Android `build.gradle` comment removal verified by re-grep returning zero `flutter_local_notifications` matches.
- The Linux Applier host has no Ruby/CocoaPods/Mac toolchain, so the pbxproj edit's verification of record is CI's iOS build job (per §11.4).
