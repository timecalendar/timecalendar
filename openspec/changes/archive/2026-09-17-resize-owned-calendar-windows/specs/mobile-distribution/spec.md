## REMOVED Requirements

### Requirement: iPad support remains portrait-only

**Reason**: T07 deliberately fires ADR 042's revisit condition and replaces portrait-only full-screen behavior with supported landscape orientation and resizable iPad windows.

**Migration**: Use the new resizable iPhone/iPad native window policy below. Existing installed binaries retain their old native policy and must not receive this native-affecting change as an OTA update.

## ADDED Requirements

### Requirement: iPhone and iPad builds support landscape and resized windows

The mobile app SHALL preserve iPhone and iPad support in development, preview, and production while declaring the Expo all-orientation policy and allowing iPad windows outside full-screen presentation. `mobile/app.config.ts` SHALL remain the source of truth, retain `ios.supportsTablet: true`, retain the iOS 16.4 and Android API 24 floors, and SHALL NOT require iOS full-screen presentation. Generated native projects SHALL remain disposable and uncommitted.

#### Scenario: Every Expo variant declares the resizable policy

- **WHEN** development, preview, and production Expo configurations are resolved
- **THEN** each configuration declares the same all-orientation policy, `ios.supportsTablet: true`, and no full-screen-only iPad requirement
- **AND** each retains the configured iOS 16.4 and Android API 24 floors

#### Scenario: Clean prebuild preserves families and orientations

- **WHEN** the clean disposable preview native project is generated and inspected
- **THEN** the iOS application target resolves device families `1,2`, supports portrait and both landscape orientations, and does not effectively require full screen
- **AND** the generated deployment target remains iOS 16.4 with no generated project committed as source

#### Scenario: Android is not portrait locked

- **WHEN** the resolved source contract and applicable disposable Android output are inspected
- **THEN** the main application is not locked to portrait or explicitly marked non-resizable
- **AND** Android API 24 remains the minimum supported SDK

### Requirement: Resizable native policy refreshes compatible runtime evidence

The implementation SHALL resolve and record the post-change SDK 56 runtime fingerprints for every affected preview/production platform lane using repository-prescribed commands, compare them with the accepted predecessor, and preserve the fingerprint input set. It SHALL identify this orientation/full-screen change as requiring a fresh compatible native binary and SHALL NOT perform an OTA-only delivery to an older shell or weaken `.fingerprintignore` to preserve an old result.

#### Scenario: Native-affecting fingerprints are reproducible

- **WHEN** the documented fingerprint commands run against the applied source contract
- **THEN** exact results and the predecessor comparison are recorded for the affected lanes
- **AND** the native-policy input remains included in fingerprint calculation

#### Scenario: Device testing names the compatible binary

- **WHEN** actual rotation and resized-window evidence is collected
- **THEN** it names the exact source revision, runtime fingerprint, native binary/build, device, and OS
- **AND** a JS reload or OTA update on the accepted T06 binary does not count as T07 native-policy evidence

#### Scenario: Engineering does not imply release deployment

- **WHEN** the compatible test artifact and evidence are prepared
- **THEN** no store submission, upload, promotion, or production rollout is implied by completing T07
- **AND** any credential-bound install or console step is recorded through the repository's dated human inbox-note convention
