## ADDED Requirements

### Requirement: Settings preferences live in the first feature folder
The Settings feature's persisted-preferences layer SHALL live in a feature folder
`mobile/src/features/settings/`, with the preference store, typed preference types, and reactive
hooks under a `prefs/` sub-layer, establishing the feature-module shape the rest of the app
copies. This change SHALL add no Settings screen, route, or native control (those are a separate
change).

#### Scenario: Preference store lives under the feature folder
- **WHEN** the persisted preference store, its types, or its hooks are located
- **THEN** they are under `mobile/src/features/settings/prefs/`
- **AND** no `mobile/src/app/` route or screen is added for Settings by this change

### Requirement: Typed theme and language preferences persisted behind the storage seam
The app SHALL persist two user preferences — a **theme preference** (`"system" | "light" | "dark"`,
default `"system"`) and a **language preference** (`"system" | "fr" | "en"`, default `"system"`) —
through the `@/storage` seam under flat namespaced keys, and SHALL NOT import the storage backend
(`react-native-mmkv`) at the feature call site. Each preference SHALL be read through a validator
that returns the `"system"` default for any value not in the preference's union (including unset,
corrupt, or legacy values), so a read can never produce an invalid preference.

#### Scenario: Feature code reads/writes preferences through the storage seam
- **WHEN** the Settings preference store reads or writes a preference
- **THEN** it uses `@/storage` helpers
- **AND** it does not import `react-native-mmkv` directly

#### Scenario: A stored preference round-trips
- **WHEN** a valid theme or language preference is written and then read back through the store
- **THEN** the read returns the same preference value

#### Scenario: An unset or invalid stored value falls back to the default
- **WHEN** a preference key is unset, or holds a string not in the preference's union
- **THEN** reading that preference through the store returns `"system"`

### Requirement: Reactive storage read exposed by the storage seam
The `@/storage` seam SHALL expose a reactive string read (`useStoredString`) bound to its
module-scoped storage instance, so that feature code can subscribe to a stored value's changes and
re-render when it changes, without importing the storage backend directly. Writes SHALL continue to
go through the seam's existing imperative setter (a single write path).

#### Scenario: A reactive read re-renders on change
- **WHEN** a component reads a key through the seam's reactive read
- **AND** that key's value is changed through the seam
- **THEN** the component observes the new value

#### Scenario: The reactive read does not leak the backend to feature code
- **WHEN** feature code needs a reactive preference read
- **THEN** it imports the reactive read from `@/storage`
- **AND** it does not import `react-native-mmkv` directly

### Requirement: Reactive preference hooks
The Settings feature SHALL expose reactive hooks (`useThemePreference`, `useLanguagePreference`)
that return the current (validated) preference and a setter, built on the seam's reactive read and
the preference validators, so consuming UI re-renders when a preference changes.

#### Scenario: A preference hook reflects the current value and updates on set
- **WHEN** a component uses a preference hook
- **THEN** it receives the current validated preference
- **AND** calling the hook's setter persists the new preference and re-renders the hook's consumers

### Requirement: Theme preference resolved through the single color-scheme seam
The `@/hooks/use-color-scheme` seam SHALL resolve the theme preference: when the stored theme
preference is `"light"` or `"dark"`, the seam SHALL return that scheme; when it is `"system"`, the
seam SHALL return the device color scheme. The seam SHALL preserve its existing return type
(`"light" | "dark" | "unspecified"`) so that `useTheme` and the root layout inherit the override
unchanged.

#### Scenario: Explicit theme preference overrides the device scheme
- **WHEN** the stored theme preference is `"light"` or `"dark"`
- **THEN** `@/hooks/use-color-scheme` returns that scheme regardless of the device scheme
- **AND** `useTheme` resolves the corresponding token set

#### Scenario: System theme preference follows the device
- **WHEN** the stored theme preference is `"system"`
- **THEN** `@/hooks/use-color-scheme` returns the device color scheme
- **AND** the existing `unspecified → light` mapping in `useTheme` is unchanged

### Requirement: Language preference wired into i18n at startup and at runtime
The i18n runtime SHALL initialize its language from the stored language preference when that
preference is `"fr"` or `"en"`, otherwise from device locale detection. A runtime setter SHALL, when
the language preference changes, persist the new preference and switch the active i18n language
(`changeLanguage`) to the preference (or to the detected device locale when the preference is
`"system"`). The wiring SHALL not introduce an import cycle (i18n init reads only the store, not the
i18n instance).

#### Scenario: Startup locale honors a stored language preference
- **WHEN** the app initializes i18n and a stored language preference is `"fr"` or `"en"`
- **THEN** i18n initializes in that language

#### Scenario: Startup locale falls back to device detection
- **WHEN** the app initializes i18n and the stored language preference is `"system"` (or unset)
- **THEN** i18n initializes in the device-detected locale (with the EN fallback)

#### Scenario: Changing the language preference switches the active language
- **WHEN** the language preference setter is called with `"fr"` or `"en"`
- **THEN** the preference is persisted
- **AND** the active i18n language is switched to it

### Requirement: K-3 coverage threshold enforced
The unit-test configuration SHALL enforce a coverage threshold (ADR 003): at least 90% lines and
branches on logic paths (feature logic, hooks, the storage/db/theme/i18n/firebase seams) and a 70%
global floor, with presentational paths (`src/components/**`, `src/app/**`) exempt from the 90%
bar. CI SHALL fail when coverage falls below the threshold. The change SHALL include the tests
required for the logic paths to meet the threshold on landing (so the gate lands green, not red).

#### Scenario: Coverage below the logic threshold fails CI
- **WHEN** a logic path's line or branch coverage falls below 90%
- **THEN** `npm test -- --coverage` fails

#### Scenario: The gate is green on landing
- **WHEN** the change's test suite is run with coverage
- **THEN** all configured thresholds (logic 90%, global 70%) pass

### Requirement: Settings preferences wiring is verified by automated tests
The unit test suite SHALL include tests that prove the preference layer end to end: a preference
round-trips and validates to the default for bad input through the store; the reactive hooks reflect
and update preferences; the theme seam resolves an explicit preference over the device scheme and
follows the device under `"system"`; and the language setter persists and switches the active
language. These tests SHALL run under the existing `test-mobile` CI job (tsc + lint + Jest).

#### Scenario: Preference store proven in CI
- **WHEN** the proof test writes a preference and reads it back, and writes an invalid value
- **THEN** the valid value round-trips and the invalid value reads as `"system"`

#### Scenario: Theme override proven in CI
- **WHEN** the proof test sets the theme preference to `"dark"` with the device scheme `"light"`
- **THEN** `@/hooks/use-color-scheme` resolves `"dark"`
