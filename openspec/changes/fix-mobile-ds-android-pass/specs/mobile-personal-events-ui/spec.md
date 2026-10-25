## ADDED Requirements

### Requirement: The Android date/time field announces its current value

On Android, the personal-event date/time field's accessible name SHALL include both the field's localized label and its currently displayed date and time, so a screen reader that reads the focused control's label instead of its child text still announces the value. The name SHALL follow the value after a commit and SHALL be localized in French and English.

#### Scenario: The field's name includes the value

- **WHEN** the Android personal-event form shows the Starts field with a value
- **THEN** the field's accessible name is the Starts label followed by the same formatted date and time the field displays

#### Scenario: The name follows a committed change

- **WHEN** the user commits a new date and time through the native dialogs
- **THEN** the field's accessible name contains the newly displayed value
