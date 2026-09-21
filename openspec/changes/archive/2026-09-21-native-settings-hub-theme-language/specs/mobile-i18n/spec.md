## MODIFIED Requirements

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
