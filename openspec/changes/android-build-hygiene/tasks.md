# Tasks

Conventions:
- All paths are relative to the repository root.
- This change is Android build-configuration only — no Dart, no `flutter pub`.
- Verification of the Android build is done by CI (Android build job); it is
  not run locally between edits.

## 1. Remove dead `jcenter()`

- [x] 1.1 In `app/android/build.gradle`, in the `allprojects { repositories { } }`
  block, replace `jcenter()` with `mavenCentral()`. Keep `google()`. Final
  block declares exactly `google()` + `mavenCentral()`.
- [x] 1.2 Confirm no other `jcenter()` reference exists anywhere in the repo
  (`grep -rn jcenter` returns nothing).

## 2. Bump the Firebase Crashlytics Gradle plugin

- [x] 2.1 In `app/android/settings.gradle`, in the `plugins { }` block, change
  `id "com.google.firebase.crashlytics" version "2.9.9" apply false` to
  version `3.0.3`.
- [x] 2.2 Leave the other plugin pins (`com.android.application` 8.7.0,
  `org.jetbrains.kotlin.android` 2.1.0, `com.google.gms.google-services` 4.4.0,
  `dev.flutter.flutter-plugin-loader` 1.0.0) untouched — out of scope.

## 3. Verify

- [x] 3.1 Confirm the diff is limited to `app/android/build.gradle` and
  `app/android/settings.gradle` — no Dart, pubspec, backend, `openapi/`, or iOS
  changes.
- [ ] 3.2 Ensure the PR's CI Android build job is green (Gradle resolves with
  `jcenter()` removed and the `3.x` Crashlytics plugin) and the Phase 1 E2E
  smoke suite passes, before handing to Review.

## 4. Confirm scope

- [x] 4.1 Confirm the Firebase Dart suite bump and the iOS deployment-target
  raise are NOT in this change — they remain in [TIM-45](/TIM/issues/TIM-45),
  blocked on the [TIM-3](/TIM/issues/TIM-3) board decision.

## Implementation notes

- `app/android/build.gradle`'s `allprojects` block had `google()` + `jcenter()`
  and no `mavenCentral()`; `jcenter()` was replaced with `mavenCentral()` so a
  live general-purpose Maven repository is still available.
- 3.1 verified clean; 3.2 is the CI gate and is checked on the open PR.
