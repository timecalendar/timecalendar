## ADDED Requirements

### Requirement: The chrome date/time picker takes device-local Dates on both platforms

The chrome date/time picker SHALL accept and report device-local Dates on iOS and Android alike. On Android, a date picker (date mode, or the date-only rendering of datetime mode, as a dialog or inline) SHALL open on the value's device-local calendar day. A picked day SHALL be reported as that device-local day with the value's device-local time of day. The conversion to and from the native control's UTC-day representation SHALL happen inside the chrome seam, so no consumer converts days itself. Minimum and maximum dates, the time picker, and iOS SHALL pass through unchanged. An invalid or epoch Date from the native control SHALL reach the consumer unchanged.

#### Scenario: The Android date dialog opens on the local day in a UTC− zone

- **WHEN** an Android date picker is given the value 23:30 local on 2 January in a zone behind UTC
- **THEN** the native date control receives 2 January (UTC midnight of that day), not 3 January

#### Scenario: The Android picked day keeps the local day and time

- **WHEN** the native date control confirms 5 January as its UTC-midnight day and the picker's value is 09:30 local on 2 January
- **THEN** the consumer receives 09:30 local on 5 January in every device zone

#### Scenario: The gallery date story shows the picked day

- **WHEN** the gallery date picker story on Android confirms a day in a zone behind UTC
- **THEN** its row shows the confirmed day, not the day before

#### Scenario: The seam fails loudly when the native contract changes

- **WHEN** the installed `@expo/ui` Android date control stops treating its initial value and picked value as UTC-midnight days
- **THEN** a repository test that pins the native source fails
