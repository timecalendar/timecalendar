## ADDED Requirements

### Requirement: Typed startup-tab preference persists behind the storage seam

The Settings feature SHALL define `StartupTabPreference` as the closed union `"home" | "calendar"`, persist it under the flat namespaced key `settings.startupTabPreference` through `@/storage`, and classify the key as environment-independent. Imperative get/set functions and a reactive hook SHALL use one total parser that returns `home` for unset, malformed, unknown, legacy, or downgrade values. Feature code SHALL NOT import `react-native-mmkv` directly.

#### Scenario: Valid values round-trip

- **WHEN** Home or Calendar is written through the Settings setter and read through the getter or reactive hook
- **THEN** the same typed value is returned

#### Scenario: Missing and invalid values default to Home

- **WHEN** the key is absent or contains any value other than exact `home` or `calendar`
- **THEN** the getter and reactive hook return `home`

#### Scenario: Backend reset preserves the preference

- **WHEN** backend-bound storage is cleared during an environment switch
- **THEN** `settings.startupTabPreference` remains stored

### Requirement: Phase 09 has a safe Flutter startup-screen mapping target

The Settings preference layer SHALL export a pure Flutter `startup_screen` mapper and an imperative setter target. The mapper SHALL accept unknown input, map only exact `home` and `calendar` strings to their matching RN values, and map every other input to Home without throwing. The setter SHALL persist the mapped value through the ordinary startup-tab setter. It SHALL NOT read native Flutter preferences or implement the Phase 09 importer.

#### Scenario: Flutter values map exactly

- **WHEN** the mapper receives `home` or `calendar`
- **THEN** it returns the matching typed RN preference

#### Scenario: Unsupported Flutter value maps safely

- **WHEN** the mapper receives an absent, non-string, mixed-case, or unknown value
- **THEN** it returns `home` without throwing

#### Scenario: Import setter uses the ordinary write path

- **WHEN** Phase 09 calls the exported setter target with a Flutter value
- **THEN** the mapped preference is persisted through `setStartupTabPreference`
