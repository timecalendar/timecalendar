## MODIFIED Requirements

### Requirement: Appearance & language is reachable from Settings and via a deep link
The Appearance & language route SHALL be registered as a `Stack` sibling of the `(tabs)` group
(so a non-tab route is navigable). The Settings tab SHALL provide an accessible
Appearance & language entry that navigates to `/appearance-settings`, declaring an
accessibility role and a translated accessibility label and providing a touch
target of at least 44pt (iOS) / 48dp (Android). The screen SHALL remain reachable
via the development deep link `timecalendar-dev://appearance-settings`.

#### Scenario: Appearance settings is registered under the root Stack
- **WHEN** the root layout declares its routes
- **THEN** `appearance-settings` is a `Stack` screen sibling of the `(tabs)` group

#### Scenario: An accessible Settings control navigates to Settings
- **WHEN** the Settings tab renders its Appearance & language entry
- **THEN** the control declares an accessibility role and a translated accessibility label
- **AND** activating it navigates to the Appearance & language route

#### Scenario: Appearance settings is reachable via the dev deep link
- **WHEN** the development-variant app is cold-launched with `timecalendar-dev://appearance-settings`
- **THEN** the Appearance & language screen is shown

### Requirement: Settings UI strings are fully localized (FR + EN)
Every user-facing string on the Settings screen and its Settings entry control SHALL be
a translation key with complete FR and EN catalog entries. This covers the title,
each control's label, each option's label, and the Settings Appearance & language entry
label. Localization SHALL be enforced by the no-hardcoded-strings lint rule and by
`tsc`-typed bidirectional FR/EN parity (a missing or extra key in either catalog
fails the typecheck).

#### Scenario: No hardcoded user-facing string on the screen
- **WHEN** the Settings screen or its Settings entry control renders text or an accessibility label
- **THEN** that string comes from a translation key
- **AND** the no-hardcoded-strings lint rule passes

#### Scenario: FR and EN catalogs are complete and in parity
- **WHEN** a Settings or Settings-entry UI key is added to one catalog
- **THEN** the same key exists in the other catalog
- **AND** `tsc` fails if a key is missing or extra in either direction
