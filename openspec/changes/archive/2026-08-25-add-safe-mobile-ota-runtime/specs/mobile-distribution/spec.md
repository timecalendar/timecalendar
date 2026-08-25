## ADDED Requirements

### Requirement: Expo Updates launch fallback is explicitly non-blocking
The app configuration SHALL set `updates.fallbackToCacheTimeout` to `0` while preserving the existing update URL, fingerprint runtime-version policy, app identities, Firebase files, and EAS profile/channel configuration.

#### Scenario: Production config retains the safe OTA shape
- **WHEN** Expo resolves the production app configuration
- **THEN** `updates.fallbackToCacheTimeout` is `0`
- **AND** the existing `updates.url` and fingerprint runtime-version policy are unchanged
- **AND** the production app id and Firebase file selection are unchanged

#### Scenario: Development config retains its identity
- **WHEN** Expo resolves the configuration with `APP_VARIANT=development`
- **THEN** `updates.fallbackToCacheTimeout` is `0`
- **AND** the development app id, Firebase files, and network exceptions remain selected
