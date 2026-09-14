## ADDED Requirements

### Requirement: Calendar view preference is a total persisted union

The Settings preference boundary SHALL define the Calendar view as the closed string union `day | week | agenda`, store it under one namespaced key through `@/storage`, and expose imperative get/set operations plus a reactive hook. Missing, malformed, legacy, or unsupported stored strings SHALL parse to `week`. Every explicit view-menu choice SHALL persist before or with the screen's committed view replacement, while reinstall may remove the key and therefore restore the week default.

#### Scenario: Every valid Calendar view round-trips

- **WHEN** Day, Week, or Agenda is written through the preference store
- **THEN** a fresh read returns the same validated choice
- **AND** the reactive hook updates consumers through the storage seam

#### Scenario: Missing or corrupt preference recovers to week

- **WHEN** the Calendar view key is absent or contains a value outside `day | week | agenda`
- **THEN** imperative and reactive reads return `week`
- **AND** Calendar opens without exposing an invalid view

#### Scenario: Only mode survives a fresh process

- **WHEN** Calendar initializes after restart with a valid persisted view
- **THEN** it restores that Day, Week, or Agenda choice
- **AND** the selected date and timeline clock offset are derived from fresh-open policy rather than preference storage
