## Context

The Phase 2 B1 audit ([TIM-36](/TIM/issues/TIM-36), Group D) listed
`google_sign_in` as a candidate for a 6→7 major bump. The TIM-91 re-audit
disproved the premise:

- `grep -rn "package:google_sign_in/" app/lib app/test app/integration_test`
  returns nothing.
- There is no auth screen anywhere in the app — onboarding pastes a
  schedule URL and the app talks to its own backend, which has no Google
  OAuth path either.
- The plugin's iOS side ships four extra frameworks (`GoogleSignIn`,
  `AppAuth`, `GTMAppAuth`, `GTMSessionFetcher`) plus a privacy bundle, all
  embedded into the app binary purely to support a feature that doesn't
  exist.
- The reverse-client-id URL scheme
  (`com.googleusercontent.apps.425450003183-1elevc6cg39idiukk9lh5sjtufis8h0r`)
  in `app/ios/Runner/Info.plist` is registered only to handle the OAuth
  callback for `google_sign_in`. With the plugin gone, the OS never calls
  the app on that scheme.

Removing the dep cleans up dependency-graph debt, app binary size, and a
dead native callback surface. The change is small and well-scoped: one
pubspec edit, one Info.plist edit, ten lines in the iOS pbxproj. There are
zero Dart source-code edits.

The safety net is the same as B3 ([TIM-38](/TIM/issues/TIM-38)) and the
Firebase change ([TIM-87](/TIM/issues/TIM-87)): the unit/widget suite
(`flutter test`) and the Phase 1 E2E smoke suite (`app/integration_test/`,
run in CI). The iOS build is verified by CI's iOS build job — the Linux
Applier host has no Ruby/CocoaPods/Mac, so `pod install` is deferred to CI
(precedent from TIM-88).

## Goals / Non-Goals

**Goals:**

- `google_sign_in` is gone from `app/pubspec.yaml` and the resolved
  `pubspec.lock`.
- The dead OAuth URL scheme is gone from `app/ios/Runner/Info.plist`.
- The iOS pbxproj no longer carries stale Pods-script-phase entries for
  the Google Sign-In framework stack, so the CI iOS build resolves
  without missing-input-file errors after `pod install` regenerates the
  Pods folder.
- `flutter analyze` clean, `flutter test` green, Phase 1 E2E smoke green
  in CI.

**Non-Goals:**

- Any new sign-in feature, any Firebase Auth refactor, any
  FlutterFire-CLI re-run.
- Removal of `firebase_auth` (which has zero Dart call sites today). That
  package is part of the FlutterFire v4 suite locked in `firebase-sdk` and
  is intentionally kept in lockstep with the rest of the suite. Removing
  it is a separate, larger decision.
- Removal of `CLIENT_ID` / `REVERSED_CLIENT_ID` from
  `app/ios/Runner/GoogleService-Info.plist`. See Decisions below.
- Any Android Gradle / Java edits beyond what `flutter pub get`
  regenerates automatically.
- Refactors beyond what the dep removal strictly requires.

## Decisions

### Modify `flutter-dependency-hygiene`, do not create a new capability

The B3 wave already created `flutter-dependency-hygiene` for "no dead
direct dependencies, swaps preserve behaviour". A zombie plugin with a
native iOS surface is the same shape of debt — just discovered after B3
shipped. The right move is to extend that capability with one new
requirement, not stand up a new `mobile-dependencies` capability. This
keeps the spec surface tight and the precedent obvious: any future zombie
plugin lands under the same capability.

*Alternative considered:* a new `ios-native-config-hygiene` capability to
own the Info.plist URL-scheme rule. Rejected — Info.plist cleanup here is
a *consequence* of removing a Flutter plugin, not a standalone iOS
platform decision. Coupling it to `flutter-dependency-hygiene` makes the
linkage explicit.

### Drop the OAuth URL scheme, keep `GoogleService-Info.plist`

`app/ios/Runner/Info.plist` carries two URL schemes:

- `fb2272446229720075` — Facebook login callback. Used by the
  `flutter_facebook_auth` / SDK flow elsewhere in the app — out of scope,
  leave alone.
- `com.googleusercontent.apps.425450003183-1elevc6cg39idiukk9lh5sjtufis8h0r`
  — reverse-client-id for Google Sign-In OAuth. iOS routes the OAuth
  callback to this scheme. With `google_sign_in` gone, nothing in the
  app handles this scheme — it is dead config and a small attack surface
  (any other app declaring the same scheme would intercept; the risk is
  low but the line is unused).

`GoogleService-Info.plist` is a different file. It is emitted by the
FlutterFire CLI and contains:

- Firebase keys (`API_KEY`, `GCM_SENDER_ID`, `GOOGLE_APP_ID`, `BUNDLE_ID`,
  `PROJECT_ID`, `STORAGE_BUCKET`) — required by `firebase_core` /
  `firebase_messaging` / `firebase_crashlytics`. Touching anything here is
  out of scope and dangerous.
- `CLIENT_ID` and `REVERSED_CLIENT_ID` — historically tied to Google
  Sign-In but emitted regardless by FlutterFire when the Firebase project
  has a configured iOS OAuth client. Whether they are referenced at
  runtime by anything other than `google_sign_in` is unknown; the safe
  call is to leave them in place. The PR is reversible by a one-line
  re-add if it turns out anything in Firebase notification routing or
  future Google Sign-In wiring needs them; the cost of accidentally
  breaking Firebase by editing this file is much higher than the cost of
  leaving two unused keys.

### Hand-edit the pbxproj (10 lines)

The 10 Pods-managed input/output paths in
`app/ios/Runner.xcodeproj/project.pbxproj` would normally be rewritten by
`pod install` on a Mac after the pubspec change. The Linux Applier host
cannot run `pod install` (no Ruby/CocoaPods, no Mac). CI runs `pod
install` from a clean checkout in the iOS build job, but CI builds in a
sandbox and does **not** commit pbxproj changes back. So if the committed
pbxproj keeps the stale entries, the CI iOS Xcode build will validate the
`inputPaths` of the script phases against the freshly-regenerated `Pods/`
folder, find `${BUILT_PRODUCTS_DIR}/GoogleSignIn/GoogleSignIn.framework`
missing, and fail.

The fix is a mechanical 10-line delete on the Applier host:

- 1 line in `[CP] Copy Pods Resources` inputPaths
  (`${PODS_CONFIGURATION_BUILD_DIR}/google_sign_in_ios/google_sign_in_ios_privacy.bundle`)
- 1 line in `[CP] Copy Pods Resources` outputPaths
  (`${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/google_sign_in_ios_privacy.bundle`)
- 4 lines in `[CP] Embed Pods Frameworks` inputPaths
  (`AppAuth.framework`, `GTMAppAuth.framework`,
  `GTMSessionFetcher.framework`, `GoogleSignIn.framework`)
- 4 lines in `[CP] Embed Pods Frameworks` outputPaths
  (matching the four above)

The Applier identifies the lines via the exact grep listed in `tasks.md`
and deletes them, preserving comma placement of the surrounding entries.
Re-grep after the edit MUST return zero matches for
`google_sign_in|GoogleSignIn|AppAuth|GTMAppAuth|GTMSessionFetcher` inside
`app/ios/Runner.xcodeproj/project.pbxproj`.

This is idempotent and reversible (revert the PR to restore). It is the
same risk class as the Firebase change's pbxproj edits to
`IPHONEOS_DEPLOYMENT_TARGET`.

*Alternative considered:* defer the whole PR until someone with a Mac can
run `pod install`. Rejected — the personal-project autonomy memo
(`timecalendar-autonomy`) says pure-eng tradeoffs land autonomously, and
the edit is mechanical. CI iOS build is the verification of record.

### Do not touch the Android registrant

`app/android/app/src/main/java/io/flutter/plugins/GeneratedPluginRegistrant.java`
currently registers `GoogleSignInPlugin`. The file is git-untracked (per
`git ls-files`) and is rewritten by `flutter pub get`. After the pubspec
edit, the registration line disappears automatically. No manual Android
edit. The Android Gradle build picks up the plugin removal through the
regenerated `.flutter-plugins-dependencies` file (also untracked).

### Do not touch `firebase_auth`

`firebase_auth` is in the Dart suite at `^6.0.0`, locked in lockstep with
the rest of the FlutterFire v4 suite by `firebase-sdk`. It has zero Dart
call sites today (the audit noted this), but removing it is a *separate*
decision from removing `google_sign_in`:

- It breaks the "no version drift inside the FlutterFire v4 suite"
  invariant in `firebase-sdk`. Re-adding `firebase_auth` later would mean
  re-resolving the entire suite.
- The native FirebaseAuth framework is still embedded by the Firebase
  iOS SDK BoM and would remain even with the Dart package removed, so the
  size win is small.

Out of scope; tracked separately if/when someone proposes it.

## Risks / Trade-offs

- **pbxproj hand-edit breaks Xcode parser** → Mitigation: only line
  deletions; whitespace and comma placement of adjacent lines preserved;
  CI iOS build job is the verification gate. If CI rejects, the Reviewer
  reverts in-PR.
- **Hidden runtime dependency on `CLIENT_ID` / `REVERSED_CLIENT_ID`** →
  Mitigation: keep `GoogleService-Info.plist` untouched. The PR does not
  change any key in that file.
- **Some other component handles the dead URL scheme** → Mitigation:
  manual `grep -rn "com.googleusercontent.apps"` across `app/ios/` is
  part of the Applier pre-flight; the only hit is in `Info.plist` and
  `GoogleService-Info.plist`. The PR removes only the Info.plist instance.
- **Android registrant doesn't regenerate cleanly** → Mitigation:
  `flutter analyze` and `flutter test` will surface registrant-level
  errors; the Applier re-runs `flutter pub get` if the registrant lags.
- **CI iOS build still fails after pbxproj edit** → Mitigation: defer
  iOS verification to the Reviewer or Mac-equipped operator. Worst case
  is to add a `pre_install`/`post_install` hook to the Podfile that
  prunes stale entries on Mac — but this is unnecessary if the 10-line
  delete is done correctly.
- **AppAuth/GTMAppAuth/GTMSessionFetcher are needed by another pod** →
  Mitigation: `grep` of `app/ios/Pods/Manifest.lock` (CI-generated) and
  pubspec inspection confirm the only consumer of those four frameworks
  is `google_sign_in_ios`. The audit shows no other pod in the current
  graph pulls them. If CI surfaces a missing-framework link error after
  the edit, those frameworks are pulled by something else and the
  delete-line set needs to be narrower (likely just the
  `google_sign_in_ios` privacy bundle + `GoogleSignIn.framework` pair);
  the Reviewer adjusts in-PR.

## Migration Plan

Single PR, applied in the order of `tasks.md`. Rollback is a straight
revert — no data migration, no persisted format change, no user-visible
behaviour change.

## Open Questions

- Are `CLIENT_ID` / `REVERSED_CLIENT_ID` in `GoogleService-Info.plist`
  referenced by anything other than `google_sign_in`? Out of scope for
  this change (kept). If a follow-up issue confirms they are pure
  Sign-In artifacts, removing them is a one-line edit in that future PR.
