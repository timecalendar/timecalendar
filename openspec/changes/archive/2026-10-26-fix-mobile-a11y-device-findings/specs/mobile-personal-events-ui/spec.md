## ADDED Requirements

### Requirement: Date and time display follows the device clock setting

Personal-event date/time text SHALL follow the device's 12/24-hour preference in the app's language: the Android date/time field's displayed value, its accessible "label, value" name and the personal-events list ranges SHALL render 12-hour time when the device uses a 12-hour clock and 24-hour time otherwise. The iOS native date/time picker SHALL receive no locale override, so it follows the device's language and hour cycle.

#### Scenario: A 12-hour device on Android

- **WHEN** the device uses a 12-hour clock and the Starts field holds 25 Oct 22:40 in English
- **THEN** the field displays the time with a 12-hour clock and an AM/PM marker
- **AND** its accessible name is "Starts, " followed by that same displayed value

#### Scenario: A 24-hour device on Android

- **WHEN** the device uses a 24-hour clock
- **THEN** the field displays "25 Oct 22:40"

#### Scenario: The iOS picker follows the device

- **WHEN** the app language is French and the device uses a 12-hour clock
- **THEN** the iOS picker receives no locale and renders with the device language and hour cycle

#### Scenario: The list follows the same setting

- **WHEN** the personal-events list renders on a 12-hour device
- **THEN** each event's start–end range uses 12-hour times

### Requirement: Color swatches announce color names and selection

Each personal-event color swatch SHALL announce a translated human color name (FR/EN), never a hex code, together with its selection state using the platform's native semantics: a checked or unchecked radio button inside the color radio group on Android, and a button with the selected trait on iOS. Every preset color SHALL have a name.

#### Scenario: Android swatch semantics

- **WHEN** the color picker renders on Android in English with pink selected
- **THEN** the pink swatch is a radio with the name "Pink" and checked state, and the other swatches are unchecked radios with their names

#### Scenario: iOS swatch semantics

- **WHEN** the color picker renders on iOS in French with pink selected
- **THEN** the pink swatch is a button named "Rose" with the selected state

#### Scenario: No swatch announces a hex code

- **WHEN** any swatch renders in either language
- **THEN** its accessible name contains no "#" character
