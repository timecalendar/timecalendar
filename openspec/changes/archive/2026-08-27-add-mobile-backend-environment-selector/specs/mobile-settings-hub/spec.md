## MODIFIED Requirements

### Requirement: Settings presents a grouped hierarchy of live destinations

The Settings screen SHALL be a scrollable, platform-appropriate grouped list. It SHALL present the calendar summary followed by an Events section containing Personal events and Hidden events, a Preferences section containing Appearance & language, Time zone, and Notifications, an App section containing About, a Support section containing Feedback, and—only when the normalized backend capability is development or preview—an ordinary Environment control. Each destination row SHALL navigate to its working route. The environment control SHALL expose only choices allowed by the capability and SHALL require destructive confirmation before invoking the reset. Production or malformed capability SHALL render no environment control. Settings SHALL NOT render a hidden tap ritual, free-text URL, Activity, disabled placeholder, duplicate Calendars row, or Changelog until corresponding requirements introduce those live destinations.

#### Scenario: Switchable builds show the ordinary environment control

- **WHEN** Settings renders with a valid development or preview backend capability
- **THEN** a localized accessible Environment control is visible with only allowed named choices
- **AND** selecting a different choice opens the destructive confirmation before any state changes

#### Scenario: Production exposes no selector

- **WHEN** Settings renders with production, missing, or malformed backend capability
- **THEN** no environment control, hidden unlock, or custom URL field is rendered
- **AND** invoking any retained deep link or handler cannot activate another backend

#### Scenario: Existing groups contain only working routes

- **WHEN** Settings renders after the environment feature ships
- **THEN** Personal events and Hidden events appear under Events
- **AND** Appearance & language, Time zone, and Notifications appear under Preferences
- **AND** About appears under App and Feedback appears under Support
- **AND** Activity, Changelog, and a duplicate Calendars row do not appear

#### Scenario: Feedback row opens the root feedback route

- **WHEN** the user activates the full-width accessible Feedback row
- **THEN** the app navigates to `/feedback` without iCal context parameters
- **AND** the row provides platform-appropriate pressed feedback, a localized label and hint, and a minimum 44pt iOS / 48dp Android target

#### Scenario: A row navigates through its entire touch target

- **WHEN** the user activates any destination row
- **THEN** the app navigates to that row's configured route
- **AND** the row provides platform-appropriate pressed feedback

## ADDED Requirements

### Requirement: Environment confirmation and reset status are accessible

The Environment UI SHALL localize choice labels, current-value text, destructive confirmation, cancellation, reset progress, and recovery failure in French and English. Controls SHALL expose roles, labels, state, focus order, large-text resilience, and minimum 44pt iOS / 48dp Android targets. While reset is active, duplicate activation SHALL be disabled and an accessible status SHALL be exposed.

#### Scenario: Confirmation describes the destructive effect

- **WHEN** a tester requests a different environment
- **THEN** the confirmation explicitly says the session and local calendar/app data will be cleared
- **AND** confirm and cancel actions are localized and accessible

#### Scenario: Reset failure remains recoverable

- **WHEN** the reset protocol reports failure
- **THEN** a localized accessible recovery surface blocks normal app use and offers retry
