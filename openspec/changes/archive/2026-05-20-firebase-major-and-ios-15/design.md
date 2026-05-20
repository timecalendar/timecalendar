## Context

B1 ([TIM-36](/TIM/issues/TIM-36)) audited the platform/store configuration
and the Firebase Dart suite. Audit slice B4 ([TIM-45](/TIM/issues/TIM-45))
bundled three coupled items: Android Gradle hygiene (B8), the Firebase Dart
suite major bump, and the iOS deployment-target raise. B8 is already
shipped ([PR #48](https://github.com/timecalendar/timecalendar/pull/48))
and is OUT of this change.

The remaining two items are coupled in one direction: the Firebase iOS SDK
shipped by `firebase_core` v4 requires `IPHONEOS_DEPLOYMENT_TARGET >= 15.0`.
You cannot bump the Dart suite without also raising the iOS minimum, and
raising the iOS minimum on its own delivers no product value. They must
ship as one change.

Current state, captured from the working tree at proposal time:

- `app/pubspec.yaml` declares `firebase_core: ^3.13.1`, `firebase_auth:
  ^5.5.4`, `firebase_analytics: ^11.4.6`, `firebase_crashlytics: ^4.3.6`,
  `firebase_messaging: ^15.2.6`.
- `app/ios/Podfile` declares `platform :ios, "13.0"` and pins
  `IPHONEOS_DEPLOYMENT_TARGET = "13.0"` in `post_install`.
- `app/ios/Flutter/AppFrameworkInfo.plist` has `MinimumOSVersion = 13.0`.
- `app/ios/Runner.xcodeproj/project.pbxproj` has `IPHONEOS_DEPLOYMENT_TARGET = 10.0`
  in the three base XCBuildConfiguration entries (Debug, Release, Profile).
  The Runner-target configurations inherit from base via xcconfig and so
  effectively follow whatever `Podfile`'s `post_install` sets — but the
  stale `10.0` in the base entries is still a misconfiguration that
  contradicts the Podfile and must be corrected for consistency.
- Dart-side Firebase usage in `app/lib/`:
  - `firebase_core`: `Firebase.initializeApp(options:)` in `main.dart`;
    `Firebase.initializeApp()` in
    `modules/firebase/services/notification/background_handler.dart`;
    `FirebaseOptions` in the generated `firebase_options.dart`.
  - `firebase_auth`: **no direct call sites in `app/lib/`**. The package is
    declared and pulled into Pods but never imported. Authentication uses
    `google_sign_in` only.
  - `firebase_analytics`: `FirebaseAnalytics.instance`,
    `FirebaseAnalyticsObserver`, `analytics.setUserProperty(name:, value:)`,
    `analytics.logEvent(name:, parameters:)`, `analytics.logScreenView(screenName:)`.
  - `firebase_crashlytics`: `FirebaseCrashlytics.instance.recordFlutterFatalError(details)`,
    `FirebaseCrashlytics.instance.recordError(error, stack, fatal: true)`.
  - `firebase_messaging`: `FirebaseMessaging.instance`,
    `FirebaseMessaging.onMessage.listen`, `_firebaseMessaging.getAPNSToken()`,
    `_firebaseMessaging.getToken()`, `_firebaseMessaging.requestPermission(...)`,
    `RemoteMessage`, plus a commented-out `FirebaseMessaging.onBackgroundMessage(...)`
    wired to `firebaseMessagingBackgroundHandler` in
    `modules/firebase/services/notification/background_handler.dart`.

Per current FlutterFire v4 CHANGELOGs, none of these call signatures are
broken across the 3→4 / 5→6 / 11→12 / 4→5 / 15→16 boundary. The bump is
expected to be pubspec-and-Pods only, with no Dart-side edits — but this
is a verification, not an assumption. The Applier confirms via
`flutter analyze` + `flutter test` and only edits if a real signature
mismatch is hit.

## Goals / Non-Goals

**Goals:**
- Five Firebase Dart packages on the v4-series majors, in lockstep, with
  the Android FirebaseBoM (34.x) and Firebase iOS SDK (12.x) carried
  transitively.
- iOS deployment minimum is 15.0 in every place it is declared — Podfile
  top-line, Podfile `post_install` block, `AppFrameworkInfo.plist`
  `MinimumOSVersion`, and the three base Xcode configurations in
  `project.pbxproj`. No surviving `13.0` or `10.0` iOS-minimum reference
  in the iOS module.
- `flutter analyze`, `flutter test`, the Phase 1 E2E smoke suite, the
  Android build job, and the iOS build job (Podfile resolves, Pods install,
  app links) all stay green.
- App runtime behaviour is unchanged. The only observable change is the
  store-side device drop (iOS 13/14), which is board-approved.

**Non-Goals:**
- No re-run of the FlutterFire CLI on `firebase_options.dart`. The file is
  platform-configuration only and unaffected by the Dart suite bump. The
  Applier may regenerate it only if the v4 packages refuse to read the
  existing schema at compile time — not a default step.
- No Android Gradle plugin / Kotlin / AGP / `com.google.gms.google-services`
  bumps — already current and out of scope (B8 territory).
- No `jcenter`/Crashlytics Gradle plugin work — already shipped in B8
  ([PR #48](https://github.com/timecalendar/timecalendar/pull/48)).
- No non-Firebase Dart dep bumps — those live in B2 ([TIM-37](/TIM/issues/TIM-37)),
  B3 ([TIM-38](/TIM/issues/TIM-38)), or future slices.
- No backend / `openapi/` / web changes.
- No introduction of a `FirebaseAuth.*` call site. The package stays declared
  for now because removing it is out of the agreed B4 scope and would invite
  a separate audit conversation; a future change may drop it if it stays
  unused.

## Decisions

- **Bump the whole Firebase Dart suite together, even though only some
  packages are actually invoked.** Reason: FlutterFire ships interop
  between sibling packages at the native layer; mixing v3 `firebase_core`
  with v4 siblings breaks Pod / Gradle resolution. Lockstep is the path of
  least resistance and matches the FlutterFire team's own release
  cadence. `firebase_auth` ^6.0 is bumped despite zero Dart call sites for
  the same reason: it shares the native Firebase iOS SDK / Android BoM with
  the other packages.
- **Use caret ranges, not pinned exact versions.** The current pubspec
  uses caret ranges (e.g. `^3.13.1`). The bump should also use caret
  ranges seeded from the lowest stable v4-series release of each package
  (`firebase_core: ^4.0.0`, `firebase_auth: ^6.0.0`,
  `firebase_analytics: ^12.0.0`, `firebase_crashlytics: ^5.0.0`,
  `firebase_messaging: ^16.0.0`). The exact resolved patch is what
  `flutter pub get` picks; lock file captures it. Alternative considered:
  pin to the latest known-good patch; rejected because it would force
  follow-up bumps for each patch release and breaks our prior B2 / B3
  caret-range convention.
- **Verify the Android FirebaseBoM transitively rather than pinning by
  default.** The `firebase_core` Android plugin's `build.gradle` pins a
  current BoM each release (the v4 line ships with FirebaseBoM 34.x). The
  Applier runs `./gradlew :app:dependencies` after `flutter pub get` and
  inspects the resolved BoM. Only if it lags the v4-expected line does the
  Applier add an explicit pin under
  `dependencies { implementation platform('com.google.firebase:firebase-bom:34.x.y') }`
  in `app/android/app/build.gradle`. Alternative considered: always pin
  explicitly. Rejected because it adds a maintenance burden FlutterFire
  already carries.
- **Align all three base Xcode build configurations to 15.0, not just the
  Podfile.** The `10.0` entries in `project.pbxproj` are silently shadowed
  today by Podfile's `post_install` (which writes `13.0`), so they don't
  visibly bite. But they will once we want to consume an iOS-15-min API
  in any non-Pods code path, and they make the project file self-
  contradictory. Aligning all three to `15.0` is a one-time hygiene fix
  that costs nothing and removes the contradiction.
- **Refresh `Podfile.lock` by deleting it and re-running `pod install
  --repo-update`, not by editing it.** The lock file is a deterministic
  derivative of the Podfile; surgical edits are error-prone and the
  Firebase iOS SDK v11→v12 transition reaches deep into the Pod graph
  (FirebaseCore, FirebaseInstallations, GoogleUtilities). A clean
  resolution is safer and matches Flutter community practice.
- **Don't pre-emptively edit Dart call sites.** Current FlutterFire v4
  CHANGELOGs against our exact API usage show no breakages. The Applier's
  contract is: do the pubspec + iOS edits, run `flutter pub get`,
  `flutter analyze`, `flutter test`; if analyze flags a specific call
  signature, fix it then. This avoids speculative refactors.

## Risks / Trade-offs

- **Risk: A future FlutterFire patch introduces a Dart call-site break we
  haven't seen yet.** → Mitigation: the Applier reads the v4 CHANGELOG for
  each package against this repo's actual call surface (enumerated in
  Context) before claiming "no Dart edits needed", and `flutter analyze`
  is the gate. If a real break exists, the Applier follows the CHANGELOG
  migration guidance and records the edit in `tasks.md` implementation
  notes.
- **Risk: The Android FirebaseBoM resolved by `firebase_core` v4 is
  unexpectedly old.** → Mitigation: explicit `./gradlew :app:dependencies`
  check (Task 3.3); pin under `app/android/app/build.gradle` only if
  needed; document in implementation notes.
- **Risk: `pod install --repo-update` fails on the developer machine due
  to CocoaPods cache drift.** → Mitigation: documented `rm Podfile.lock &&
  pod install --repo-update` sequence; CI re-runs from a clean checkout so
  any local-only issues don't reach review.
- **Risk: iOS 13/14 users are blocked from app updates.** → Accepted
  trade-off, board-approved 2026-05-20 (see [TIM-3](/TIM/issues/TIM-3)).
  Older app versions stay installable from the App Store's "last
  compatible version" fallback, so users do not lose the app.
- **Trade-off: shipping the suite + iOS bump as one PR, not two.** They
  are coupled (see Context) and splitting would force an intermediate
  state where neither side compiles. Bundling is the simpler and safer
  shape.

## Migration Plan

This is a code-only change; no data migration, no user-facing migration.
The deploy steps are:

1. Applier merges this change's PR to `main`.
2. CI builds new Android AAB and iOS IPA against iOS 15 base.
3. Beta channel (TestFlight / Play internal) gets the new build first;
   any v4 regression visible there reverts the PR before public release.
4. Public release proceeds on the next regular store push.

Rollback: revert the change's commit on `main`; CI restores the prior
iOS 13 / Firebase v3 build. No data migration to reverse.

## Open Questions

None. The board decision (iOS 15 minimum) is recorded in
[TIM-3](/TIM/issues/TIM-3). The Android FirebaseBoM pin question is a
verification step the Applier resolves in-flight, not an outstanding
decision for review.
