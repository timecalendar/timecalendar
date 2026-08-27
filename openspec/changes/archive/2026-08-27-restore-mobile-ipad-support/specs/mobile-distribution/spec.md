## ADDED Requirements

### Requirement: iOS builds preserve the iPhone and iPad device-family contract

The mobile app SHALL support both iPhone and iPad for development, preview, and production iOS configurations. Expo source configuration SHALL remain the authority for that contract, and a clean production-identity prebuild SHALL generate application-target device families `1,2`. Generated native projects SHALL remain disposable and uncommitted.

#### Scenario: Every Expo variant declares tablet support

- **WHEN** development, preview, and production Expo configurations are resolved
- **THEN** each configuration has `ios.supportsTablet` set to `true`
- **AND** each configuration retains the same iPhone+iPad product support contract

#### Scenario: Preview prebuild generates both device families

- **WHEN** a clean iOS prebuild is generated with `OTA_CHANNEL=preview`
- **THEN** the generated application target resolves `TARGETED_DEVICE_FAMILY` to `1,2`
- **AND** no generated `mobile/ios/` project is committed as source

### Requirement: iPad support remains portrait-only

The app SHALL retain top-level Expo orientation `portrait` while supporting tablets and SHALL set `ios.requireFullScreen` to `true`. A clean iOS prebuild SHALL require full-screen presentation, expose only portrait orientations for iPad, and SHALL NOT enable either iPad landscape orientation. Side-by-side iPad multitasking is intentionally outside the supported contract because it requires landscape orientations.

#### Scenario: Source configuration retains portrait intent

- **WHEN** development, preview, and production Expo configurations are resolved
- **THEN** each resolved configuration has `orientation` equal to `portrait`
- **AND** each has `ios.requireFullScreen` set to `true`

#### Scenario: Generated iPad orientations exclude landscape

- **WHEN** the clean preview iOS prebuild is inspected
- **THEN** `UIRequiresFullScreen` is true
- **AND** the effective iPad-supported orientation list uses its iPad-specific value when present or the generic fallback and contains portrait orientation values only
- **AND** `UIInterfaceOrientationLandscapeLeft` and `UIInterfaceOrientationLandscapeRight` are absent

### Requirement: Restored iPad support refreshes runtime compatibility evidence

The repository SHALL resolve and record the post-change SDK 56 iOS runtime fingerprints for preview and production using the project-local managed-workflow commands. Documentation SHALL state that the native device-family change requires a fresh signed iOS binary and SHALL NOT be delivered to the rejected or previous shell as an OTA update. Fingerprint protection SHALL NOT be weakened to preserve an old hash.

#### Scenario: Authoritative fingerprint tables match the corrected source

- **WHEN** the documented iOS preview and production fingerprint commands run on the applied change
- **THEN** their exact results match the values recorded in the Architecture Book and operator guide
- **AND** no broad `.fingerprintignore` excludes native configuration

#### Scenario: Engineering completion does not submit a build

- **WHEN** this change is completed
- **THEN** documentation identifies a fresh signed iOS preview binary as the next release requirement
- **AND** no EAS build, upload, App Store Connect submission, or store-console mutation has been performed by this ticket
