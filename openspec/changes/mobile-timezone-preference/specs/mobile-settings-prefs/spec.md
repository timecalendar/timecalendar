# mobile-settings-prefs — delta

## MODIFIED Requirements

### Requirement: Typed theme and language preferences persisted behind the storage seam
The app SHALL persist three user preferences — a **theme preference** (`"system" | "light" | "dark"`,
default `"system"`), a **language preference** (`"system" | "fr" | "en"`, default `"system"`), and a
**display-timezone preference** (`"system" | <curated IANA zone>`, default `"system"`; the curated
set is defined by the `mobile-display-timezone` capability) —
through the `@/storage` seam under flat namespaced keys, and SHALL NOT import the storage backend
(`react-native-mmkv`) at the feature call site. Each preference SHALL be read through a validator
that returns the `"system"` default for any value not in the preference's union (including unset,
corrupt, or legacy values), so a read can never produce an invalid preference.

#### Scenario: Feature code reads/writes preferences through the storage seam
- **WHEN** the Settings preference store reads or writes a preference
- **THEN** it uses `@/storage` helpers
- **AND** it does not import `react-native-mmkv` directly

#### Scenario: A stored preference round-trips
- **WHEN** a valid theme, language, or timezone preference is written and then read back through the store
- **THEN** the read returns the same preference value

#### Scenario: An unset or invalid stored value falls back to the default
- **WHEN** a preference key is unset, or holds a string not in the preference's union
- **THEN** reading that preference through the store returns `"system"`

### Requirement: Reactive preference hooks
The Settings feature SHALL expose reactive hooks (`useThemePreference`, `useLanguagePreference`,
`useTimezonePreference`) that return the current (validated) preference and a setter, built on the
seam's reactive read and the preference validators, so consuming UI re-renders when a preference
changes.

#### Scenario: A preference hook reflects the current value and updates on set
- **WHEN** a component uses a preference hook
- **THEN** it receives the current validated preference
- **AND** calling the hook's setter persists the new preference and re-renders the hook's consumers
