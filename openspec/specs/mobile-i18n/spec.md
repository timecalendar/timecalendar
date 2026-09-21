# mobile-i18n Specification

## Purpose
TBD - created by archiving change add-mobile-i18n. Update Purpose after archive.
## Requirements
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
The app SHALL resolve its active locale from the persisted language preference. Explicit `fr` or `en` SHALL remain authoritative regardless of device locale changes. `system` SHALL select the first supported French or English device locale and SHALL fall back to English when none is supported. One app-lifetime observer SHALL refresh the effective language when the device locales change in system mode, without adding OS app-language integration or a new locale dependency.

#### Scenario: Explicit language overrides device changes
- **WHEN** the stored preference is French or English and the device locale list changes
- **THEN** the active language remains the explicit stored choice
- **AND** i18next receives no device-driven language change

#### Scenario: System mode follows a supported runtime change
- **WHEN** the stored preference is `system` and the preferred supported device locale changes from English to French
- **THEN** the active language changes once to French
- **AND** mounted translated screens and native-control labels update without losing selection

#### Scenario: Unsupported system locale falls back to English
- **WHEN** system mode resolves a device locale list containing neither French nor English
- **THEN** the effective language is English

#### Scenario: Duplicate locale events are inert
- **WHEN** system mode receives repeated locale updates that resolve to the already-active supported language
- **THEN** i18next is not changed again

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
The unit suite SHALL prove synchronous startup selection, manual preference changes, and app-lifetime system-locale refresh through the installed public `expo-localization` contract. Tests SHALL cover all three stored choices, supported and unsupported locale lists, duplicate updates, current-page translation, explicit-override protection, and listener cleanup. Mocks SHALL model `getLocales()` and `useLocales()` as installed and SHALL NOT invent a public event emitter that the package does not export.

#### Scenario: Public reactive locale contract drives refresh
- **WHEN** the mocked `useLocales()` result changes while preference is `system`
- **THEN** the synchronizer resolves the new list through the production resolver
- **AND** calls `changeLanguage` only if the supported result differs

#### Scenario: Listener lifetime is bounded by the app root
- **WHEN** the root synchronizer unmounts
- **THEN** the public Expo hook's subscription lifecycle is released
- **AND** the app installs no second locale listener

#### Scenario: Startup and manual behavior remain compatible
- **WHEN** the app starts or the user explicitly selects Use device language, Français, or English
- **THEN** the existing synchronous startup fallback and persisted setter behavior remain correct
- **AND** English remains the fallback for unsupported device locales

