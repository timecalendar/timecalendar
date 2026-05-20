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

- [ ] 1.1 In `app/pubspec.yaml`, bump `firebase_core: ^3.13.1` to
  `firebase_core: ^4.0.0`.
- [ ] 1.2 In `app/pubspec.yaml`, bump `firebase_auth: ^5.5.4` to
  `firebase_auth: ^6.0.0`. (No Dart call sites use `FirebaseAuth` — see
  `design.md` Context — but the package shares the native Firebase SDK
  with the suite and must move in lockstep.)
- [ ] 1.3 In `app/pubspec.yaml`, bump `firebase_analytics: ^11.4.6` to
  `firebase_analytics: ^12.0.0`.
- [ ] 1.4 In `app/pubspec.yaml`, bump `firebase_crashlytics: ^4.3.6` to
  `firebase_crashlytics: ^5.0.0`.
- [ ] 1.5 In `app/pubspec.yaml`, bump `firebase_messaging: ^15.2.6` to
  `firebase_messaging: ^16.0.0`.
- [ ] 1.6 From `app/`, run `flutter pub get` to refresh `app/pubspec.lock`.
- [ ] 1.7 Confirm the resolved versions in `app/pubspec.lock` start with
  `4.` / `6.` / `12.` / `5.` / `16.` for the five Firebase Dart packages
  respectively.

## 2. iOS — raise deployment target to 15.0

- [ ] 2.1 In `app/ios/Podfile`, change the top-line directive from
  `platform :ios, "13.0"` to `platform :ios, "15.0"`.
- [ ] 2.2 In `app/ios/Podfile`, inside the `post_install do |installer|`
  block, change
  `config.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = "13.0"` to
  `... = "15.0"`.
- [ ] 2.3 In `app/ios/Flutter/AppFrameworkInfo.plist`, change
  `<key>MinimumOSVersion</key>` value from `13.0` to `15.0`.
- [ ] 2.4 In `app/ios/Runner.xcodeproj/project.pbxproj`, change all three
  `IPHONEOS_DEPLOYMENT_TARGET = 10.0;` entries in the base
  XCBuildConfiguration sections (Debug, Release, Profile) to
  `IPHONEOS_DEPLOYMENT_TARGET = 15.0;`. The three matches are around
  lines 499, 585, and 634; verify by grepping the file for
  `IPHONEOS_DEPLOYMENT_TARGET` after the edit and confirming every match
  reads `15.0`.
- [ ] 2.5 Confirm no `10.0` or `13.0` iOS-minimum reference remains
  anywhere in `app/ios/` (`grep -rn 'IPHONEOS_DEPLOYMENT_TARGET' app/ios/`
  and `grep -rn '<string>13\.0</string>' app/ios/Flutter/AppFrameworkInfo.plist`
  both come back clean).

## 3. iOS — refresh Pods

- [ ] 3.1 Delete `app/ios/Podfile.lock` (a clean re-resolution is safer
  than surgical edits across the Firebase iOS SDK v11→v12 boundary; see
  `design.md` Decisions).
- [ ] 3.2 From `app/ios/`, run `pod install --repo-update`. Confirm
  CocoaPods resolves the graph without an iOS-deployment-target
  conflict and that the regenerated `Podfile.lock` references Firebase
  iOS SDK v12.x Pods.
- [ ] 3.3 (Optional — Mac-only.) If a Mac is available locally, run
  `flutter build ios --no-codesign` from `app/` to confirm the iOS link
  step. Otherwise rely on CI's iOS build job.

## 4. Android — verify FirebaseBoM (pin only if needed)

- [ ] 4.1 From `app/android/`, run `./gradlew :app:dependencies` and
  capture the resolved `com.google.firebase:firebase-bom` version.
- [ ] 4.2 If the resolved BoM is on the 34.x line (or whatever line
  `firebase_core` v4 ships at apply time), make NO Android edit and
  record the resolved version in implementation notes.
- [ ] 4.3 If the resolved BoM lags the v4-expected line, add
  `implementation platform('com.google.firebase:firebase-bom:<version>')`
  to the `dependencies { }` block of `app/android/app/build.gradle`,
  re-run `./gradlew :app:dependencies`, and confirm the pin is honoured.

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

- [ ] 5.1 From `app/`, run `flutter analyze`. Confirm zero new errors or
  warnings attributable to the Firebase Dart suite.
- [ ] 5.2 From `app/`, run `flutter test`. Confirm all existing unit and
  widget tests still pass.
- [ ] 5.3 If, and only if, 5.1 surfaces a real breaking signature for a
  call site enumerated above, migrate that single call site per the
  relevant FlutterFire v4 CHANGELOG entry and record the edit in
  Implementation notes. Do not refactor unaffected call sites.

## 6. Scope discipline

- [ ] 6.1 Confirm the diff is limited to:
  `app/pubspec.yaml`, `app/pubspec.lock`,
  `app/ios/Podfile`, `app/ios/Podfile.lock`,
  `app/ios/Flutter/AppFrameworkInfo.plist`,
  `app/ios/Runner.xcodeproj/project.pbxproj`,
  optionally `app/android/app/build.gradle` (only if Task 4.3 fired),
  and any Dart call sites edited under Task 5.3 (expected: none).
- [ ] 6.2 Confirm `app/lib/firebase_options.dart` is **not** modified.
  The file is FlutterFire CLI-generated platform config; the suite bump
  does not require a re-run.
- [ ] 6.3 Confirm no edits to `server/`, `openapi/`, `web/`, or other
  unrelated paths.

## 7. Verification gate

- [ ] 7.1 PR is opened against `main`; CI's Android build job, iOS build
  job, `flutter analyze`, `flutter test`, and Phase 1 E2E smoke suite are
  all green before handing to Review.
- [ ] 7.2 Beta channel (TestFlight / Play internal) gets the new build
  first; any v4 regression visible there is grounds to revert before
  public release.

## Implementation notes

<!-- Applier fills this in as it executes:
- Resolved patch versions of the five Firebase packages from
  app/pubspec.lock.
- Resolved Android FirebaseBoM version from `./gradlew :app:dependencies`
  (and whether Task 4.3 fired, with the chosen pin if so).
- Any Dart call site edited under 5.3, with a one-line "what changed and
  why" referencing the FlutterFire v4 CHANGELOG entry that forced it.
- Whether a local `flutter build ios --no-codesign` was run (Task 3.3),
  or whether CI's iOS build job was the only iOS verification. -->
