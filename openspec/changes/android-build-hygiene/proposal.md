## Why

Phase 2 ([TIM-3](/TIM/issues/TIM-3)) is the dependency-upgrade & maintenance
phase. The B1 audit ([TIM-36](/TIM/issues/TIM-36), Group B — build hygiene)
found two stale items in the Android Gradle build:

- `app/android/build.gradle` still lists `jcenter()`. JCenter has been
  **shut down** (read-only since 2021, fully sunset) — it is a dead repository
  that should never resolve a dependency and only adds build risk and noise.
- The Firebase Crashlytics Gradle plugin is pinned at `2.9.9`, long superseded
  by the maintained `3.x` line.

This is audit item **B8**, folded into B4 ([TIM-45](/TIM/issues/TIM-45)). It is
deliberately split out here because it is **board-independent**: unlike the
Firebase Dart suite major bump and the iOS deployment-target raise (13→15) —
both gated on the [TIM-3](/TIM/issues/TIM-3) board confirmation — the Android
build-config cleanup has no product or store-compliance impact and can ship
now that Wave 1 (B2 [TIM-37](/TIM/issues/TIM-37), B3
[TIM-38](/TIM/issues/TIM-38)) is green.

## What Changes

- **Remove dead `jcenter()`** from the `allprojects` repositories block in
  `app/android/build.gradle`, replacing it with `mavenCentral()` so the two
  standard live repositories `google()` + `mavenCentral()` remain.
- **Bump the Firebase Crashlytics Gradle plugin** in `app/android/settings.gradle`
  from `2.9.9` to `3.0.3` (the maintained `3.x` line). AGP `8.7.0` and Kotlin
  `2.1.0` already satisfy the `3.x` plugin's requirements.

Out of scope (stays in [TIM-45](/TIM/issues/TIM-45), blocked on the
[TIM-3](/TIM/issues/TIM-3) board decision): the Firebase Dart suite major bump
(`firebase_core` 3→4 and siblings) and the iOS deployment-target raise.

## Capabilities

### New Capabilities
- `android-build-config`: records the requirement that the Android Gradle build
  references only live, maintained repositories and keeps the Firebase
  Crashlytics Gradle plugin on a current major.

### Modified Capabilities
<!-- None — independent of the Flutter dependency capabilities (B2/B3). -->

## Impact

- `app/android/build.gradle` — `jcenter()` → `mavenCentral()`.
- `app/android/settings.gradle` — Crashlytics Gradle plugin `2.9.9` → `3.0.3`.
- No Dart / `app/pubspec.yaml`, backend, `openapi/`, or iOS changes. No app
  behaviour change — this is build-configuration hygiene only.
