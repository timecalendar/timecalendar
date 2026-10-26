## MODIFIED Requirements

### Requirement: The chrome date/time picker takes device-local Dates on both platforms

The chrome date/time picker SHALL accept and report device-local Dates on iOS and Android alike. On Android, a date picker (date mode, or the date-only rendering of datetime mode, as a dialog or inline) SHALL open on the value's device-local calendar day. A picked day SHALL be reported as that device-local day with the value's device-local time of day. The event reported with a converted Date SHALL describe that same Date: its `nativeEvent.timestamp` SHALL equal the Date's time and its `nativeEvent.utcOffset` SHALL equal the Date's device offset in minutes, and the deprecated change event SHALL keep its `type`. The conversion to and from the native control's UTC-day representation SHALL happen inside the chrome seam, so no consumer converts days or timestamps itself. Minimum and maximum dates, the time picker, and iOS SHALL pass through unchanged. An invalid or epoch Date from the native control SHALL reach the consumer unchanged, with its event unchanged.

#### Scenario: The Android date dialog opens on the local day in a UTC− zone

- **WHEN** an Android date picker is given the value 23:30 local on 2 January in a zone behind UTC
- **THEN** the native date control receives 2 January (UTC midnight of that day), not 3 January

#### Scenario: The Android picked day keeps the local day and time

- **WHEN** the native date control confirms 5 January as its UTC-midnight day and the picker's value is 09:30 local on 2 January
- **THEN** the consumer receives 09:30 local on 5 January in every device zone

#### Scenario: The Android event agrees with the picked Date

- **WHEN** the native date control confirms 5 January with an event whose timestamp is UTC midnight of 5 January
- **THEN** the consumer's event timestamp equals the reported local Date's time and its UTC offset equals that Date's device offset, in every device zone
- **AND** a deprecated change event keeps its `set` or `dismissed` type

#### Scenario: The gallery date story shows the picked day

- **WHEN** the gallery date picker story on Android, opened on 2 January, confirms 5 January in any device zone
- **THEN** its row shows 5 January, not the day it opened on and not the day before

#### Scenario: The seam fails loudly when the native contract changes

- **WHEN** the installed `@expo/ui` Android date control stops treating its initial value and picked value as UTC-midnight days
- **THEN** a repository test that pins the native source fails
