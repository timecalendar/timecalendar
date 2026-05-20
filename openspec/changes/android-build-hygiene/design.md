## Context

B1 ([TIM-36](/TIM/issues/TIM-36)) audited the platform/store configuration.
Group B (build hygiene) flagged the Android Gradle build: `app/android/build.gradle`
still declares `jcenter()`, and `app/android/settings.gradle` pins the Firebase
Crashlytics Gradle plugin at `2.9.9`.

B8 was originally folded into B4 ([TIM-45](/TIM/issues/TIM-45)) alongside the
Firebase suite major bump and the iOS deployment-target raise. Those two items
are gated on a board product decision ([TIM-3](/TIM/issues/TIM-3) — raising the
iOS minimum from 13 to 15 drops older devices). The Android build-config
cleanup has no such dependency, so it is split into this standalone change and
ships independently.

## Goals / Non-Goals

**Goals:**
- No dead repository (`jcenter()`) remains in the Android Gradle build.
- The Firebase Crashlytics Gradle plugin is on the maintained `3.x` line.
- The Android build still resolves and assembles; no behaviour change.

**Non-Goals:**
- The Firebase Dart suite major bump (`firebase_core` 3→4 etc.) — board-gated,
  stays in [TIM-45](/TIM/issues/TIM-45).
- The iOS deployment-target raise 13→15 — board-gated, stays in
  [TIM-45](/TIM/issues/TIM-45).
- Bumping `com.android.application`, Kotlin, or `com.google.gms.google-services`
  — the audit found them reasonably current; out of scope here.

## Decisions

- **`jcenter()` → `mavenCentral()`, not a bare removal.** The audit's stated end
  state is `google()` + `mavenCentral()`. The `allprojects` block currently has
  only `google()` + `jcenter()`, so `jcenter()` is replaced (not deleted) to
  keep Maven Central available for any transitive artifact not mirrored on
  Google's Maven. `app/android/settings.gradle` already declares
  `mavenCentral()` for plugin resolution; this aligns the project repositories.
- **Crashlytics Gradle plugin → `3.0.3`.** The `3.x` line is the maintained
  successor to `2.9.9`; `3.x` requires AGP 8+, satisfied by the project's
  `8.7.0`. `3.0.3` is a stable `3.0.x` release; the exact patch is verified by
  CI's Android build job at apply time.

## Risks / Trade-offs

- **Low risk.** `jcenter()` is already non-functional as a source of new
  artifacts; removing it cannot break a build that resolves today. The
  Crashlytics plugin bump is a build-tooling change (mapping-file upload), not
  an app-runtime change.
- **Verification:** the Android build job in CI plus the Phase 1 E2E smoke
  suite ([TIM-7](/TIM/issues/TIM-7)) confirm Gradle still resolves and the app
  still builds and runs.
