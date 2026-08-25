## MODIFIED Requirements

### Requirement: Settings presents a grouped hierarchy of live destinations

The Settings screen SHALL be a scrollable, platform-appropriate grouped list. It SHALL present the calendar summary followed by an Events section containing Personal events and Hidden events, a Preferences section containing Appearance & language, Display timezone, and Notifications, and a Support section containing Feedback. Each row SHALL navigate to its existing live route. It SHALL NOT render Activity, About, disabled placeholders, or a duplicate Calendars row until corresponding requirements introduce those live destinations.

#### Scenario: Groups contain only working routes
- **WHEN** Settings renders after the feedback feature ships
- **THEN** Personal events and Hidden events appear under Events
- **AND** Appearance & language, Display timezone, and Notifications appear under Preferences
- **AND** Feedback appears under Support and Activity, About, and a duplicate Calendars row do not appear

#### Scenario: Feedback row opens the root feedback route
- **WHEN** the user activates the full-width accessible Feedback row
- **THEN** the app navigates to `/feedback` without iCal context parameters
- **AND** the row provides platform-appropriate pressed feedback, a localized label and hint, and a minimum 44pt iOS / 48dp Android target

#### Scenario: A row navigates through its entire touch target
- **WHEN** the user activates any destination row
- **THEN** the app navigates to that row's configured route
- **AND** the row provides platform-appropriate pressed feedback
