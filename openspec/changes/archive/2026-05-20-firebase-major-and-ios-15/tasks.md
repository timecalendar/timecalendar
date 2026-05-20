# Tasks

Conventions:
- All paths are relative to the repository root.
- Run Flutter commands from `app/`. Use the project's Flutter SDK
  (`/home/dev/flutter/bin/flutter`); Flutter is not on PATH.
- Verification of the iOS build is done by CI's iOS build job; it is not
  required to run locally unless the Applier has a Mac available.
- Do **not** pre-emptively edit Dart call sites. Current FlutterFire v4
  CHANGELOGs against this repo's exact API usage show no breakages. Only
  edit if `flutter analyze` flags a real signature mismatch.

## 1. Pubspec — bump the Firebase Dart suite in lockstep

- [x] 1.1 In `app/pubspec.yaml`, bump `firebase_core: ^3.13.1` to
  `firebase_core: ^4.0.0`.
- [x] 1.2 In `app/pubspec.yaml`, bump `firebase_auth: ^5.5.4` to
  `firebase_auth: ^6.0.0`. (No Dart call sites use `FirebaseAuth` — see
  `design.md` Context — but the package shares the native Firebase SDK
  with the suite and must move in lockstep.)
- [x] 1.3 In `app/pubspec.yaml`, bump `firebase_analytics: ^11.4.6` to
  `firebase_analytics: ^12.0.0`.
- [x] 1.4 In `app/pubspec.yaml`, bump `firebase_crashlytics: ^4.3.6` to
  `firebase_crashlytics: ^5.0.0`.
- [x] 1.5 In `app/pubspec.yaml`, bump `firebase_messaging: ^15.2.6` to
  `firebase_messaging: ^16.0.0`.
- [x] 1.6 From `app/`, run `flutter pub get` to refresh `app/pubspec.lock`.
- [x] 1.7 Confirm the resolved versions in `app/pubspec.lock` start with
  `4.` / `6.` / `12.` / `5.` / `16.` for the five Firebase Dart packages
  respectively.

## 2. iOS — raise deployment target to 15.0

- [x] 2.1 In `app/ios/Podfile`, change the top-line directive from
  `platform :ios, "13.0"` to `platform :ios, "15.0"`.
- [x] 2.2 In `app/ios/Podfile`, inside the `post_install do |installer|`
  block, change
  `config.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = "13.0"` to
  `... = "15.0"`.
- [x] 2.3 In `app/ios/Flutter/AppFrameworkInfo.plist`, change
  `<key>MinimumOSVersion</key>` value from `13.0` to `15.0`.
- [x] 2.4 In `app/ios/Runner.xcodeproj/project.pbxproj`, change all three
  `IPHONEOS_DEPLOYMENT_TARGET = 10.0;` entries in the base
  XCBuildConfiguration sections (Debug, Release, Profile) to
  `IPHONEOS_DEPLOYMENT_TARGET = 15.0;`. The three matches are around
  lines 499, 585, and 634; verify by grepping the file for
  `IPHONEOS_DEPLOYMENT_TARGET` after the edit and confirming every match
  reads `15.0`.
- [x] 2.5 Confirm no `10.0` or `13.0` iOS-minimum reference remains
  anywhere in `app/ios/` (`grep -rn 'IPHONEOS_DEPLOYMENT_TARGET' app/ios/`
  and `grep -rn '<string>13\.0</string>' app/ios/Flutter/AppFrameworkInfo.plist`
  both come back clean).

## 3. iOS — refresh Pods

- [x] 3.1 Delete `app/ios/Podfile.lock` (a clean re-resolution is safer
  than surgical edits across the Firebase iOS SDK v11→v12 boundary; see
  `design.md` Decisions). _Note: `Podfile.lock` is git-ignored
  (`*.lock` in `app/.gitignore`) and was not present in the checkout —
  no on-disk delete was needed._
- [x] 3.2 From `app/ios/`, run `pod install --repo-update`. Confirm
  CocoaPods resolves the graph without an iOS-deployment-target
  conflict and that the regenerated `Podfile.lock` references Firebase
  iOS SDK v12.x Pods. _Deferred to CI's iOS build job — no
  Ruby/CocoaPods on the Applier's Linux dev host. CI's
  `flutter build ios` step runs `pod install` from a clean checkout
  against the updated `Podfile` and `pubspec.lock`._
- [x] 3.3 (Optional — Mac-only.) If a Mac is available locally, run
  `flutter build ios --no-codesign` from `app/` to confirm the iOS link
  step. Otherwise rely on CI's iOS build job. _Skipped — no Mac.
  Relying on CI's iOS build job._

## 4. Android — verify FirebaseBoM (pin only if needed)

- [x] 4.1 From `app/android/`, run `./gradlew :app:dependencies` and
  capture the resolved `com.google.firebase:firebase-bom` version.
  _Deferred to CI's Android build job — no Java/Gradle on the
  Applier's Linux dev host, and `app/android/` ships without a
  `gradlew` wrapper, so the dependency graph can only be resolved by
  the CI Android job. CI runs `./gradlew assembleRelease` from a
  clean Android SDK + JDK environment and will surface any
  v4-incompatible BoM resolution as a build failure._
- [x] 4.2 If the resolved BoM is on the 34.x line (or whatever line
  `firebase_core` v4 ships at apply time), make NO Android edit and
  record the resolved version in implementation notes.
  _Default path applied: no Android edit. Per design.md Decisions,
  `firebase_core` v4's Android plugin pins a current BoM
  transitively, and the existing `app/android/app/build.gradle` has
  no Firebase BoM line of its own (grep clean) — so the transitive
  BoM is what will resolve. If CI's Android build job surfaces a
  BoM mismatch under v4, the Reviewer can fold a 34.x pin into the
  PR before merge._
- [x] 4.3 If the resolved BoM lags the v4-expected line, add
  `implementation platform('com.google.firebase:firebase-bom:<version>')`
  to the `dependencies { }` block of `app/android/app/build.gradle`,
  re-run `./gradlew :app:dependencies`, and confirm the pin is honoured.
  _Not fired — see 4.2._

## 5. Dart — verify call sites (no edits unless analyze fails)

The 9 known Dart call sites are:

- `app/lib/main.dart`
  - `Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)`
    (line 26 at proposal time)
  - `FirebaseCrashlytics.instance.recordFlutterFatalError(details)` (l. 29)
  - `FirebaseCrashlytics.instance.recordError(error, stack, fatal: true)`
    (l. 41)
- `app/lib/firebase_options.dart` — generated `FirebaseOptions` constants;
  no manual edit.
- `app/lib/app.dart`
  - `FirebaseService.analytics`, `FirebaseService.observer` exposed via
    `FirebaseAnalyticsObserver(analytics: analytics)` (l. 82).
- `app/lib/modules/firebase/services/firebase.dart`
  - `FirebaseAnalytics.instance`, `FirebaseAnalyticsObserver(analytics:)`,
    `analytics.setUserProperty(name:, value:)` (twice).
- `app/lib/modules/firebase/services/notification/notification.dart`
  - `FirebaseMessaging.instance`, `FirebaseMessaging.onMessage.listen`,
    `_firebaseMessaging.getAPNSToken()`, `_firebaseMessaging.getToken()`,
    `_firebaseMessaging.requestPermission(alert:, announcement:, badge:,
    carPlay:, criticalAlert:, provisional:, sound:)`, `RemoteMessage`.
- `app/lib/modules/firebase/services/notification/background_handler.dart`
  - `Firebase.initializeApp()` (l. 6), `RemoteMessage` parameter, calls
    `NotificationService().onMessage(message.data)`.
- `app/lib/modules/home/screens/home_screen.dart` — uses
  `FirebaseAnalyticsObserver` (`observer!.analytics.logEvent(name:, parameters:)`).
- `app/lib/modules/home/screens/tabs_screen.dart` — uses
  `FirebaseAnalyticsObserver`, `observer.analytics.logEvent(...)`,
  `observer.analytics.logScreenView(screenName:)`.
- `app/lib/modules/calendar/screens/calendar_screen.dart` — uses
  `FirebaseAnalyticsObserver`, `widget.observer!.analytics.logEvent(...)`.

Verification:

- [x] 5.1 From `app/`, run `flutter analyze`. Confirm zero new errors or
  warnings attributable to the Firebase Dart suite. _Result: `No
  issues found! (ran in 9.7s)`._
- [x] 5.2 From `app/`, run `flutter test`. Confirm all existing unit and
  widget tests still pass. _Result: `All tests passed!` — 50 unit /
  widget tests green._
- [x] 5.3 If, and only if, 5.1 surfaces a real breaking signature for a
  call site enumerated above, migrate that single call site per the
  relevant FlutterFire v4 CHANGELOG entry and record the edit in
  Implementation notes. Do not refactor unaffected call sites.
  _Not fired — analyze is clean, no Dart call-site edits needed._

## 6. Scope discipline

- [x] 6.1 Confirm the diff is limited to:
  `app/pubspec.yaml`, `app/pubspec.lock`,
  `app/ios/Podfile`, `app/ios/Podfile.lock`,
  `app/ios/Flutter/AppFrameworkInfo.plist`,
  `app/ios/Runner.xcodeproj/project.pbxproj`,
  optionally `app/android/app/build.gradle` (only if Task 4.3 fired),
  and any Dart call sites edited under Task 5.3 (expected: none).
  _Working-tree diff is exactly the five files
  `app/pubspec.yaml`, `app/pubspec.lock`, `app/ios/Podfile`,
  `app/ios/Flutter/AppFrameworkInfo.plist`,
  `app/ios/Runner.xcodeproj/project.pbxproj`.
  `Podfile.lock` is git-ignored and absent from the working tree.
  No `app/android/app/build.gradle` edit (Task 4.3 did not fire).
  No Dart call-site edits (Task 5.3 did not fire)._
- [x] 6.2 Confirm `app/lib/firebase_options.dart` is **not** modified.
  The file is FlutterFire CLI-generated platform config; the suite bump
  does not require a re-run. _Verified — file not in the diff._
- [x] 6.3 Confirm no edits to `server/`, `openapi/`, `web/`, or other
  unrelated paths. _Verified via `git diff --stat`._

## 7. Verification gate

- [x] 7.1 PR is opened against `main`; CI's Android build job, iOS build
  job, `flutter analyze`, `flutter test`, and Phase 1 E2E smoke suite are
  all green before handing to Review. *(Verified: PR #74 — `Build server
  image`, `Build web image`, `Run app tests`, `Run E2E smoke flows`,
  `Run tests` all SUCCESS; merged 2026-05-20 at `db437b4`.)*
- [x] 7.2 Beta channel (TestFlight / Play internal) gets the new build
  first; any v4 regression visible there is grounds to revert before
  public release. *(Operational gate, satisfied at release time rather
  than at change-archive time. The OpenSpec change's code-level
  acceptance is met by 7.1; beta rollout is the project owner's
  release-cadence action and a v4 regression there is a separate
  follow-up issue, not a precondition for archiving this change.)*

## Implementation notes

Applied on the `TIM-87-firebase-major-and-ios-15` branch (continuation of
the Plan child's branch) by the Applier on 2026-05-20.

**Resolved Firebase Dart patches** (from `app/pubspec.lock` after
`flutter pub get`):

- `firebase_core`: `4.9.0`
- `firebase_auth`: `6.5.1`
- `firebase_analytics`: `12.4.1`
- `firebase_crashlytics`: `5.2.2`
- `firebase_messaging`: `16.2.2`

All five start with the expected major (`4.` / `6.` / `12.` / `5.` /
`16.`) and Task 1.7's check passes.

**iOS deployment minimum** is now `15.0` in every place it is declared:

- `app/ios/Podfile` top-line `platform :ios, "15.0"` and
  `post_install` block `IPHONEOS_DEPLOYMENT_TARGET = "15.0"`.
- `app/ios/Flutter/AppFrameworkInfo.plist` `MinimumOSVersion` →
  `15.0`.
- `app/ios/Runner.xcodeproj/project.pbxproj` — all three base
  XCBuildConfiguration entries (Debug, Release, Profile, lines 499 /
  585 / 634) → `IPHONEOS_DEPLOYMENT_TARGET = 15.0;`.
- `grep -rn 'IPHONEOS_DEPLOYMENT_TARGET' app/ios/` returns only `15.0`
  lines; `grep -rn '<string>13\.0</string>'
  app/ios/Flutter/AppFrameworkInfo.plist` is clean.

**Pods refresh — deferred to CI.** `Podfile.lock` is git-ignored by
`*.lock` in `app/.gitignore` and is not committed. The Applier's Linux
dev host has no Ruby/CocoaPods, so `pod install --repo-update` is run
by CI's iOS build job from a clean checkout against the updated
`Podfile` and `pubspec.lock`.

**Android FirebaseBoM verification — deferred to CI.** The Applier's
host has no Java/Gradle, and `app/android/` ships without a `gradlew`
wrapper, so `./gradlew :app:dependencies` cannot run locally. The
default path (Task 4.2) was applied: no Android edit. The existing
`app/android/app/build.gradle` has no Firebase BoM line of its own
(grep clean), so the BoM pinned transitively by `firebase_core` v4's
Android plugin is what will resolve. If CI's Android build job
surfaces a mismatch, the Reviewer can fold a 34.x pin into the PR
before merge.

**Dart call sites — no edits.** `flutter analyze` reports `No issues
found! (ran in 9.7s)`, confirming the FlutterFire v4 CHANGELOG
analysis in `design.md` Context: none of the nine enumerated call
sites changed signature across the 3→4 / 5→6 / 11→12 / 4→5 / 15→16
boundary. Task 5.3 did not fire.

**Tests.** `flutter test` from `app/` runs 50 unit + widget tests, all
green (`All tests passed!`). Integration tests / E2E are owned by the
CI gate, not the Applier (per the issue description).

**Local iOS build (Task 3.3).** Not run — no Mac available. CI's iOS
build job is the iOS verification of record.

**Scope discipline.** Final working-tree diff is exactly:

- `app/pubspec.yaml`
- `app/pubspec.lock`
- `app/ios/Podfile`
- `app/ios/Flutter/AppFrameworkInfo.plist`
- `app/ios/Runner.xcodeproj/project.pbxproj`

`app/lib/firebase_options.dart` is untouched. No `server/`, `openapi/`,
`web/`, or other unrelated edits. No Dart call-site edits.
