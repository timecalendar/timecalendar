## ADDED Requirements

### Requirement: Crashlytics identifies the running OTA bundle
At startup the app SHALL install Crashlytics custom keys `otaUpdateId`, `otaChannel`, `otaRuntimeVersion`, `otaCreatedAt`, and `otaIsEmbedded` once per JavaScript runtime. The values SHALL be derived from `useUpdates().currentlyRunning`, represented as strings, and use deterministic fallbacks: `"embedded"` for a missing update id, empty strings for a missing channel, runtime version, or creation time, ISO-8601 for a present creation time, and `String(isEmbeddedLaunch)` for the embedded flag.

#### Scenario: Downloaded update identity is attached
- **WHEN** the running update exposes an id, channel, runtime version, creation time, and `isEmbeddedLaunch: false`
- **THEN** all five corresponding Crashlytics keys carry those exact string values
- **AND** the creation time is serialized with `toISOString()`

#### Scenario: Embedded or development identity is deterministic
- **WHEN** Expo Updates omits update id, channel, runtime version, and creation time
- **THEN** `otaUpdateId` is `"embedded"`
- **AND** `otaChannel`, `otaRuntimeVersion`, and `otaCreatedAt` are empty strings
- **AND** `otaIsEmbedded` is the string form of Expo's `isEmbeddedLaunch` value

#### Scenario: Startup installation runs once per JavaScript runtime
- **WHEN** the OTA runtime component renders or remounts more than once in one JavaScript runtime
- **THEN** the five Crashlytics keys are installed only once

### Requirement: OTA Crashlytics attributes stay behind the Firebase seam
Application runtime and layout code SHALL set OTA Crashlytics keys through an owned `@/firebase` helper that delegates to the modular RNFirebase v24 `setAttributes(getCrashlytics(), attributes)` API. No feature, layout, or OTA runtime module SHALL import RNFirebase directly, and the existing top-level FCM background-message registration SHALL remain intact and Jest-safe.

#### Scenario: Firebase helper forwards all attributes
- **WHEN** the owned helper receives the five OTA string attributes
- **THEN** it resolves Crashlytics lazily and calls the modular `setAttributes` function with the native instance and complete attribute map

#### Scenario: Existing FCM registration is preserved
- **WHEN** `@/firebase` is imported under Jest after the attribute helper is added
- **THEN** `setBackgroundMessageHandler` is still registered exactly once
- **AND** the new Crashlytics helper does not run at module import

#### Scenario: Attribute installation rejection is bounded
- **WHEN** installing OTA attributes rejects
- **THEN** the error is recorded through `recordUnknownError` with the constant context `ota/attributes`
- **AND** the installation is not retried in that JavaScript runtime
