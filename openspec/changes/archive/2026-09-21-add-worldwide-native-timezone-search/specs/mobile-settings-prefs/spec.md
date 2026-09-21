## ADDED Requirements

### Requirement: Display-timezone intent accepts supplied worldwide identifiers without destructive normalization
The Settings preference boundary SHALL keep `settings.timezonePreference` as the active compatibility key, where `"system"` selects automatic mode and an exact identifier supplied by the versioned catalog selects manual mode. It SHALL preserve the selected identifier or alias byte-for-byte and SHALL NOT replace it with a display group's representative name. Reads SHALL classify unset, corrupt, catalog-valid, and runtime-unsupported values without throwing or rewriting storage.

#### Scenario: Existing curated identifier survives the widened boundary
- **WHEN** any identifier accepted by the previous curated picker is already stored
- **THEN** the widened preference read returns the same exact identifier in manual mode
- **AND** no migration rewrites the key

#### Scenario: Supported alias is preserved
- **WHEN** a runtime-supported catalog alias is selected
- **THEN** that exact alias is persisted and returned
- **AND** its tzdb group representative is not substituted

#### Scenario: Unsupported or corrupt stored intent is non-destructive
- **WHEN** the active key contains a catalog identifier unsupported by the current runtime, or a corrupt value
- **THEN** preference resolution does not throw
- **AND** the raw stored value is not deleted or rewritten by the read

### Requirement: Automatic mode and remembered manual selection persist independently
The Settings preference boundary SHALL persist the last explicit manual identifier under a separate environment-independent key. Turning automatic mode on SHALL retain the available manual choice; turning it off SHALL restore the remembered identifier when runtime-supported. If no remembered manual choice exists, first manual use SHALL start from the effective device zone, with the existing safe fallback when the device supplies no selectable zone. A runtime-unsupported remembered value SHALL remain recoverable and SHALL NOT be erased merely to activate a usable fallback.

#### Scenario: Automatic round-trip restores manual choice
- **WHEN** a user selects `Europe/Paris`, enables automatic mode, and later disables automatic mode
- **THEN** `Europe/Paris` is restored as the active manual identifier

#### Scenario: First manual use starts from the device zone
- **WHEN** no manual identifier has ever been remembered and the user disables automatic mode
- **THEN** the current effective device identifier becomes the initial manual choice when selectable

#### Scenario: Unsupported remembered value is retained
- **WHEN** the remembered identifier is absent from the current runtime database and manual mode needs a usable fallback
- **THEN** the app activates a supported device or safe fallback without crashing
- **AND** it does not erase the unsupported remembered identifier until the user explicitly chooses another zone

### Requirement: Display-timezone selection validates catalog and runtime support before writing
The preference write used by the chooser SHALL accept only an exact identifier present in the generated catalog and accepted by the current runtime time-zone database. A failed validation SHALL leave both the active and remembered values unchanged. Explicit successful selection SHALL update both values through the `@/storage` seam.

#### Scenario: Available catalog identifier saves atomically from the user's perspective
- **WHEN** the user selects a catalog identifier accepted by `Intl`
- **THEN** the active and remembered preferences both contain that exact identifier before the chooser closes

#### Scenario: Unavailable selection does not mutate preferences
- **WHEN** selection is attempted for an identifier rejected by the runtime
- **THEN** neither active nor remembered preference changes
- **AND** the chooser remains open with an unavailable state

### Requirement: Effective-zone consumers retain one total resolver
The Settings preference layer SHALL remain the sole resolver of the effective display zone. An available manual identifier SHALL win; automatic, corrupt, or runtime-unavailable intent SHALL resolve to the supported device zone and then `Europe/Paris`. Calendar display, personal-event input, and notification registration SHALL continue consuming this resolver rather than interpreting preference storage independently.

#### Scenario: Available manual identifier wins
- **WHEN** manual mode stores a runtime-supported identifier different from the device zone
- **THEN** the effective display zone is the exact stored identifier

#### Scenario: Runtime-unavailable manual intent falls back safely
- **WHEN** manual intent names a catalog identifier unsupported by the current runtime
- **THEN** the effective display zone is the supported device zone or `Europe/Paris`
- **AND** the unavailable stored intent remains recoverable for a newer runtime
