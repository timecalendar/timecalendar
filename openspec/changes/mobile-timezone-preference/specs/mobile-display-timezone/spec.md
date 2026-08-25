# mobile-display-timezone — delta

## ADDED Requirements

### Requirement: Display-timezone preference persisted as a curated closed union
The app SHALL persist a display-timezone preference under the `@/storage` seam as a flat namespaced key (`settings.timezonePreference`) in the settings prefs layer, typed as `"system" | <curated zone>` with default `"system"`. The curated zone set SHALL be exactly: `Europe/Paris`, `America/Guadeloupe`, `America/Martinique`, `America/Cayenne`, `America/Miquelon`, `Indian/Reunion`, `Indian/Mayotte`, `Pacific/Noumea`, `Pacific/Wallis`, `Pacific/Tahiti`. Reads SHALL go through a total parser that returns `"system"` for any unset, corrupt, legacy, or out-of-union value and never throws. A reactive hook SHALL expose the validated preference and a setter.

#### Scenario: Preference round-trips
- **WHEN** a curated zone is written through the store and read back
- **THEN** the read returns that zone

#### Scenario: Invalid stored value falls back
- **WHEN** the stored value is not `"system"` and not in the curated set (e.g. an arbitrary IANA string or garbage)
- **THEN** the read returns `"system"` without throwing

### Requirement: Effective display zone resolved at one seam
The settings prefs layer SHALL expose the effective display zone through a single resolution (`resolveTimezone`): an explicit curated preference wins; `"system"` resolves to the device IANA zone from `expo-localization`, falling back to `"Europe/Paris"` when the device yields none. Both an imperative read and a reactive hook SHALL be exposed; the reactive read SHALL update when the preference changes and, under `"system"`, when the device zone changes. No display or notification code SHALL resolve the zone by any other path.

#### Scenario: Explicit preference wins
- **WHEN** the preference is `Indian/Reunion` and the device zone is `America/Montreal`
- **THEN** the effective display zone is `Indian/Reunion`

#### Scenario: System follows the device
- **WHEN** the preference is `"system"` and the device zone is `America/Montreal`
- **THEN** the effective display zone is `America/Montreal`

#### Scenario: Device zone unavailable
- **WHEN** the preference is `"system"` and expo-localization yields no zone
- **THEN** the effective display zone is `Europe/Paris`

### Requirement: Every rendered event time formats in the effective display zone
All user-visible event times and event dates — calendar grid tiles, agenda list, calendar screen header, event details, home dashboard (welcome card, upcoming section, today timeline, upcoming scroller), hidden-events list, and personal-events list — SHALL be produced by zone-aware formatters in the calendar data format seam that take the effective display zone as an explicit parameter. No screen or feature code SHALL format an event time via device-local `Date` fields, `toLocaleString`, or a formatter that ignores the zone.

#### Scenario: Event time re-projects to the chosen zone
- **WHEN** an event starts at `2026-03-02T08:00:00Z` and the effective display zone is `Europe/Paris`
- **THEN** every surface renders its start as 09:00 regardless of the device zone

#### Scenario: Preference change re-renders
- **WHEN** the user changes the timezone preference while event times are on screen
- **THEN** the displayed times update to the new zone without an app restart

### Requirement: Day bucketing follows the display zone
Day-level grouping and boundaries — day keys, "today" resolution, agenda section ranges, the calendar grid's initial date and fetched event window, and the now-indicator position — SHALL be computed in the effective display zone, and the calendar renderer SHALL receive the zone (calendar-kit `timeZone` prop) so its internal day division agrees. There SHALL be exactly one timed-event day-key helper (zone-aware), replacing the duplicated device-local copies.

#### Scenario: Event lands on the zone's day, not the device's
- **WHEN** an event starts at `2026-03-01T23:30:00Z`, the display zone is `Europe/Paris` (00:30 next day), and the device zone is UTC
- **THEN** the event is bucketed and displayed under March 2, on every surface

#### Scenario: Now indicator uses the zone's wall clock
- **WHEN** the display zone differs from the device zone
- **THEN** the now indicator sits at the display zone's current minute-of-day in the grid

### Requirement: All-day events stay floating
Date-only (all-day) events SHALL keep the existing UTC-day-key floating-date path and SHALL NOT be shifted by the display-timezone preference on any surface.

#### Scenario: All-day date is stable across zones
- **WHEN** an all-day event is stored for March 2 and the display zone is `Pacific/Tahiti`
- **THEN** it renders on March 2 in the all-day lane, same as under `"system"`

### Requirement: Personal-event input interprets wall-clock in the display zone
The personal-event date-time fields SHALL interpret the picked wall-clock date/time in the effective display zone when constructing the stored instant, and SHALL echo field values through the zone-aware formatters, so an entered time reads back identically everywhere. Under `"system"` this SHALL be behavior-identical to device-local input.

#### Scenario: Entered time reads back unchanged
- **WHEN** the display zone is `Europe/Paris` and the user picks 14:00 for a personal event
- **THEN** the field, the personal-events list, and the calendar all render it at 14:00

### Requirement: Greeting stays device-local
The home greeting (good-morning/afternoon/evening selection and weekend variant) SHALL keep using the device zone's current time, independent of the display-timezone preference.

#### Scenario: Display zone does not flip the greeting
- **WHEN** it is 08:00 at the device and the display zone's wall clock reads 20:00
- **THEN** the greeting is the morning variant

### Requirement: Timezone picker in Settings
The settings hub SHALL present a timezone destination row opening a dedicated picker screen (feature `ui/` component behind a thin `src/app/` route) offering "Automatic" plus the ten curated zones as a single-select list; selecting an option SHALL persist immediately through the preference hook with no separate confirm step. All strings, including zone display labels, SHALL exist in both `en.json` and `fr.json`, and controls SHALL carry accessible labels and selected state.

#### Scenario: Selecting a zone persists and applies
- **WHEN** the user selects `La Réunion` in the picker
- **THEN** the preference is persisted as `Indian/Reunion` and event times across the app re-render in it

#### Scenario: Automatic restores device behavior
- **WHEN** the user selects Automatic
- **THEN** the preference is persisted as `"system"` and times render in the device zone again

### Requirement: Zone-aware rendering proven in CI
The unit test suite SHALL pin a non-device curated zone against fixtures that cross a local midnight boundary and assert: formatters re-project instants correctly, day bucketing lands events on the zone's day, all-day events do not shift, the resolution seam's preference/system/fallback branches, and personal-event input round-trips. These tests SHALL run under the existing coverage gate (`npm test -- --coverage`).

#### Scenario: Midnight boundary fixture
- **WHEN** the proof tests run with a fixture at `23:30Z` and display zone `Europe/Paris`
- **THEN** formatting and bucketing tests assert the next-day placement and pass under the coverage gate
