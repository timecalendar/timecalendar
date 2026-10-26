## MODIFIED Requirements

### Requirement: Primary create actions follow the platform idiom

A screen whose primary action is "add" SHALL show it as a trailing header action on iOS and as a
`FloatingAction` on Android. On each platform the two SHALL share one accessibility label. The
calendar, user calendars and personal-events list screens SHALL follow this rule. Home SHALL show
the floating action on Android and keep its in-content glass add button on iOS.

#### Scenario: The calendar add action on both platforms

- **WHEN** the calendar screen renders on iOS and then on Android
- **THEN** iOS shows a trailing "Add an event" header item, Android shows an "Add an event"
  floating action, and neither platform shows both

#### Scenario: The personal-events list add action on both platforms

- **WHEN** the personal-events list renders on iOS and then on Android
- **THEN** iOS shows a trailing "Add event" header item, Android shows an "Add event" floating
  action, both with `personal-events-add`, and neither platform shows both or an in-content Add

#### Scenario: The E2E flow adds through the shared label

- **WHEN** Maestro flow 02 taps "Add an event" on the calendar
- **THEN** the personal-event form opens on both iOS and Android through the same flow step
