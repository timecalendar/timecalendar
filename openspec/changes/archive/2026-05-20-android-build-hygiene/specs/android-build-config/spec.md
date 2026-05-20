## ADDED Requirements

### Requirement: Android build references only live, maintained repositories

The `allprojects` repositories block in `app/android/build.gradle` SHALL NOT
reference `jcenter()`. JCenter is a shut-down repository. The block SHALL
declare exactly `google()` and `mavenCentral()`.

#### Scenario: jcenter is gone from the Android build

- **WHEN** `app/android/build.gradle` is inspected after the change
- **THEN** `jcenter()` is absent from the `allprojects` repositories block
- **AND** `google()` and `mavenCentral()` are the declared repositories

#### Scenario: No jcenter reference remains anywhere

- **WHEN** the repository is searched for `jcenter`
- **THEN** no Gradle file references it

### Requirement: Firebase Crashlytics Gradle plugin is on the maintained 3.x line

`app/android/settings.gradle` SHALL pin `com.google.firebase.crashlytics` to a
`3.x` version rather than the superseded `2.9.9`.

#### Scenario: Crashlytics Gradle plugin is bumped

- **WHEN** the `plugins` block of `app/android/settings.gradle` is inspected
- **THEN** `com.google.firebase.crashlytics` is declared at version `3.0.3`
- **AND** the other plugin pins are unchanged

### Requirement: The change is build-green and behaviour-neutral

The Android build-config cleanup SHALL NOT change app behaviour and SHALL keep
the Android build resolvable.

#### Scenario: Android build still resolves and assembles

- **WHEN** the Android app is assembled in CI after the change
- **THEN** Gradle resolves all plugins and dependencies with `jcenter()` removed
- **AND** the app builds successfully
- **AND** the Phase 1 E2E smoke suite passes
