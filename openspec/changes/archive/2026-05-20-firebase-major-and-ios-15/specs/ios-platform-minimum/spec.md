## ADDED Requirements

### Requirement: iOS deployment target is 15.0

The iOS deployment minimum SHALL be 15.0. This drops iOS 13–14 devices
(iPhone 5s / 6 / 6+) from future builds and unblocks Firebase iOS SDK
v12, which is the native backend of FlutterFire v4. The board approved
the device drop on 2026-05-20 (see [TIM-3](/TIM/issues/TIM-3)).

#### Scenario: Podfile declares iOS 15

- **WHEN** `app/ios/Podfile` is inspected after the change
- **THEN** the top-line `platform :ios, ...` directive is `15.0`
- **AND** the `post_install` block pins
  `config.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = "15.0"`

#### Scenario: AppFrameworkInfo.plist declares iOS 15

- **WHEN** `app/ios/Flutter/AppFrameworkInfo.plist` is inspected after
  the change
- **THEN** the `MinimumOSVersion` value is `15.0`

### Requirement: All Xcode base build configurations declare iOS 15

Every `IPHONEOS_DEPLOYMENT_TARGET` entry in `app/ios/Runner.xcodeproj/project.pbxproj` SHALL be `15.0`. The three base XCBuildConfiguration sections (Debug, Release, Profile) currently declare `10.0`; these MUST be aligned to `15.0` so the Xcode project file is self-consistent with the Podfile and the framework's `MinimumOSVersion`. No stale `10.0` or `13.0` iOS-minimum reference SHALL remain anywhere in the iOS module.

#### Scenario: pbxproj base configurations are aligned

- **WHEN** `app/ios/Runner.xcodeproj/project.pbxproj` is searched for
  `IPHONEOS_DEPLOYMENT_TARGET`
- **THEN** every match is `IPHONEOS_DEPLOYMENT_TARGET = 15.0`
- **AND** no `10.0` or `13.0` iOS-minimum reference remains anywhere in
  `app/ios/`

### Requirement: Pods resolve cleanly under iOS 15

`pod install --repo-update` SHALL resolve all Firebase-related Pods (`FirebaseCore`, `FirebaseAnalytics`, `FirebaseCrashlytics`, `FirebaseMessaging`, `FirebaseAuth`, `FirebaseInstallations`, plus their transitive dependencies) after the iOS-minimum raise and the suite bump, and the iOS build SHALL succeed. The Firebase iOS SDK v12 line (carried by `firebase_core` v4) requires `IPHONEOS_DEPLOYMENT_TARGET >= 15.0`, which Task 2 satisfies.

#### Scenario: pod install resolves

- **WHEN** `Podfile.lock` is removed and `pod install --repo-update` is
  run from `app/ios/`
- **THEN** CocoaPods resolves the Pod graph without an iOS-deployment-
  target conflict
- **AND** `Podfile.lock` is regenerated with Firebase iOS SDK v12.x Pods

#### Scenario: iOS build succeeds in CI

- **WHEN** the iOS build job in CI runs after the change
- **THEN** the app builds and links successfully against iOS 15 as the
  base deployment target
- **AND** the Phase 1 E2E smoke suite passes on the iOS runner
