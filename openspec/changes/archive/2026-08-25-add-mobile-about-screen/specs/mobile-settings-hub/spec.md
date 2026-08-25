## MODIFIED Requirements

### Requirement: Settings presents a grouped hierarchy of live destinations

The Settings screen SHALL be a scrollable, platform-appropriate grouped list. It SHALL
present the calendar summary followed by an Events section containing Personal events
and Hidden events, a Preferences section containing Appearance & language, Time zone,
and Notifications, and an App section containing About. Each row SHALL navigate to its
working route. It SHALL NOT render Activity, Feedback, disabled placeholders, a
duplicate Calendars row, or Changelog until corresponding requirements introduce those
live destinations.

#### Scenario: Groups contain only working routes
- **WHEN** Settings renders
- **THEN** Personal events and Hidden events appear under Events
- **AND** Appearance & language, Time zone, and Notifications appear under Preferences
- **AND** About appears under the explicit third App section
- **AND** Activity, Feedback, Changelog, and a duplicate Calendars row do not appear

#### Scenario: A row navigates through its entire touch target
- **WHEN** the user activates any destination row
- **THEN** the app navigates to that row's configured route
- **AND** the row provides platform-appropriate pressed feedback

### Requirement: Settings behavior is covered by automated and on-device proofs

The pure summary selector SHALL be covered under the 90% logic threshold, including
loading, empty, ID/name aliasing, multiple schools, unknown metadata, hidden calendars,
and order independence. The presentational screen SHALL meet the 70% floor and test
group order, route wiring including `/about`, localization, accessibility, and platform
row branches. The tab trigger, About route structure, and legacy redirect SHALL have
automated coverage. Maestro flows and the manual iOS/Android pass SHALL prove tab
navigation, calendar-management, appearance, and About destinations, safe-area/tab
behavior, screen-reader traversal, dark mode, large text, and a multi-school fixture.

#### Scenario: Automated gates verify Settings
- **WHEN** the mobile typecheck, lint, and Jest coverage suite run
- **THEN** Settings passes all gates and the selector clears the 90% logic threshold
- **AND** the About row is proven to navigate to its registered route

#### Scenario: Both platforms verify native behavior
- **WHEN** the Settings device checklist is completed on iOS and Android
- **THEN** tab/header behavior, interactions, accessibility, dark mode, and the
  multi-school summary are verified without dead destinations
- **AND** About is reachable from Settings on both platforms
