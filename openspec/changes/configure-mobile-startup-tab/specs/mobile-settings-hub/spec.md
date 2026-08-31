## MODIFIED Requirements

### Requirement: Settings presents a grouped hierarchy of live destinations

The Settings screen SHALL be a scrollable, platform-appropriate grouped list. It SHALL present the calendar summary followed by an Events section containing Activity, Personal events, and Hidden events, a Preferences section containing Appearance & language, Startup screen, Time zone, and Notifications, an App section containing About, a Support section containing Feedback, and—only when the normalized backend capability is development or preview—an ordinary Environment control. Each destination row SHALL navigate to its working route. The Startup screen row SHALL navigate to `/startup-settings`. The Activity row SHALL be first in the Events section, SHALL be present regardless of notification preferences or held-calendar count, and SHALL carry the reactive unread badge defined by the `mobile-activity-ui` capability. The environment control SHALL expose only choices allowed by the capability and SHALL require destructive confirmation before invoking the reset. Production or malformed capability SHALL render no environment control. Settings SHALL NOT render a hidden tap ritual, free-text URL, disabled placeholder, duplicate Calendars row, or Changelog until corresponding requirements introduce those live destinations.

#### Scenario: Switchable builds show the ordinary environment control

- **WHEN** Settings renders with a valid development or preview backend capability
- **THEN** a localized accessible Environment control is visible with only allowed named choices
- **AND** selecting a different choice opens the destructive confirmation before any state changes

#### Scenario: Production exposes no selector

- **WHEN** Settings renders with production, missing, or malformed backend capability
- **THEN** no environment control, hidden unlock, or custom URL field is rendered
- **AND** invoking any retained deep link or handler cannot activate another backend

#### Scenario: Existing groups contain only working routes

- **WHEN** Settings renders after the startup preference ships
- **THEN** Activity, Personal events, and Hidden events appear under Events, in that order
- **AND** Appearance & language, Startup screen, Time zone, and Notifications appear under Preferences, in that order
- **AND** About appears under App and Feedback appears under Support
- **AND** Changelog and a duplicate Calendars row do not appear

#### Scenario: The Startup screen row opens the preference route

- **WHEN** the user activates the full-width accessible Startup screen row
- **THEN** the app navigates to `/startup-settings`
- **AND** the row provides platform-appropriate pressed feedback, a localized label and hint, and a minimum 44pt iOS / 48dp Android target

#### Scenario: The Activity row opens the Activity route

- **WHEN** the user activates the full-width accessible Activity row
- **THEN** the app navigates to `/activity`
- **AND** the row provides platform-appropriate pressed feedback, a localized label and hint, and a minimum 44pt iOS / 48dp Android target

#### Scenario: Feedback row opens the root feedback route

- **WHEN** the user activates the full-width accessible Feedback row
- **THEN** the app navigates to `/feedback` without iCal context parameters
- **AND** the row provides platform-appropriate pressed feedback, a localized label and hint, and a minimum 44pt iOS / 48dp Android target

#### Scenario: A row navigates through its entire touch target

- **WHEN** the user activates any destination row
- **THEN** the app navigates to that row's configured route
- **AND** the row provides platform-appropriate pressed feedback
