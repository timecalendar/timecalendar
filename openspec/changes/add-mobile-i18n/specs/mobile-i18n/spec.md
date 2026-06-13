## ADDED Requirements

### Requirement: i18n runtime initialized at startup
The mobile app SHALL initialize an i18next runtime (via `react-i18next`) once at application startup, with FR and EN catalogs loaded, before any screen renders user-facing text. Initialization SHALL be synchronous from bundled catalogs (no network fetch, no loading gate).

#### Scenario: App boots with i18n available
- **WHEN** the app launches and the root layout mounts
- **THEN** the i18next instance is initialized with `fr` and `en` resources
- **AND** components rendered under the root may call `t()` and receive translated strings, not raw keys

#### Scenario: Single instance, no re-init
- **WHEN** the app re-renders or navigates between routes
- **THEN** the i18next instance is not re-initialized (one module-scoped instance for the app lifetime)

### Requirement: Locale follows the device with EN fallback
The app SHALL resolve the active locale from the device locale (via `expo-localization`), selecting `fr` or `en` when the device's preferred locale matches one of them, and SHALL fall back to `en` otherwise. There SHALL be no in-app language switcher and no persisted locale override in this capability.

#### Scenario: French device
- **WHEN** the device's preferred locale is French
- **THEN** the active locale is `fr` and UI text renders in French

#### Scenario: English device
- **WHEN** the device's preferred locale is English
- **THEN** the active locale is `en` and UI text renders in English

#### Scenario: Unsupported device locale
- **WHEN** the device's preferred locale is neither French nor English (e.g. German)
- **THEN** the active locale falls back to `en`

### Requirement: Flat, greppable translation keys
Translation keys SHALL be flat literal dotted strings, identical in source code and in the catalog JSON. The i18next runtime SHALL be configured with `keySeparator: false` and `nsSeparator: false` so a key string is never split into nested object lookups or namespace lookups.

#### Scenario: Key string matches catalog key verbatim
- **WHEN** a developer searches the codebase for a key such as `profile.tab.label`
- **THEN** the same literal string is found both at the `t()` call site and as a top-level key in the catalog JSON

#### Scenario: No nested resolution
- **WHEN** a key contains dots (e.g. `schools.list.error`)
- **THEN** the runtime resolves it as one flat key, not by walking nested objects or splitting a namespace

### Requirement: Translation keys are type-checked
The set of valid translation keys SHALL be derived from the EN catalog via a `react-i18next` module augmentation, so that passing a key not present in the catalog to `t()` is a TypeScript compile error. The FR catalog SHALL be type-constrained to the same key set so that a missing or extra FR key fails type checking.

#### Scenario: Unknown key rejected at compile time
- **WHEN** code calls `t()` with a key absent from the catalog
- **THEN** `tsc --noEmit` reports a type error

#### Scenario: FR/EN key parity enforced by types
- **WHEN** the FR catalog is missing a key present in EN (or has an extra key)
- **THEN** `tsc --noEmit` reports a type error

### Requirement: FR and EN catalogs complete for all shipped strings
Every user-facing string rendered by the app SHALL have both a FR and an EN translation in the catalog. No user-facing string SHALL be hardcoded.

#### Scenario: Surviving screens are fully translated
- **WHEN** the Home (Accueil) and Profile (Profil) tab stubs, the tab bar labels, and the schools screen render in either locale
- **THEN** all their user-facing text comes from the catalog and is present in both `fr.json` and `en.json`

### Requirement: no-hardcoded-strings rule enforced without per-file suppressions
The `i18next/no-literal-string` lint rule SHALL remain active as an error, and there SHALL be no `eslint-disable i18next/no-literal-string` suppressions in application source (the test-file exemption is retained, as test fixtures assert literal strings intentionally). `npm run lint` SHALL pass with zero warnings.

#### Scenario: Suppressions removed
- **WHEN** the change is complete
- **THEN** no application source file contains a `TODO(i18n-step-6)` / `eslint-disable i18next/no-literal-string` header
- **AND** `npm run lint` exits clean with `--max-warnings 0`

#### Scenario: New hardcoded string is rejected
- **WHEN** a developer adds a literal user-facing JSX string instead of a `t()` call
- **THEN** the lint rule reports an error and CI fails

### Requirement: i18n wiring is verified by an automated test
The unit test suite SHALL include a test that renders a localized component through the real i18next instance and asserts that a translated string (not the raw key) is displayed, so the wiring is proven in CI rather than merely present.

#### Scenario: Translated string renders in test
- **WHEN** the i18n proof test renders a component that calls `t()` for a known key under the default locale
- **THEN** the rendered output contains the translated value, not the key string
