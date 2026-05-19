## ADDED Requirements

### Requirement: Shared domain-object fixtures

The test suite SHALL provide reusable fixture builders under `app/test/support/`
that construct core domain objects (calendar events, school list entries) with
sensible defaults, so tests do not repeat long required-argument lists.

#### Scenario: A test builds a calendar event fixture

- **WHEN** a test calls the shared `buildCalendarEvent` helper with zero or more overrides
- **THEN** it receives a valid `CalendarEvent` (which implements `EventInterface`) with all required fields populated and any overrides applied

### Requirement: Calendar logic coverage

The `calendar` module's pure logic SHALL have nominal regression tests:
the event helpers, the `EventForUI` column-layout algorithm, and the model
serialization round-trips.

#### Scenario: Event helper functions are exercised

- **WHEN** `flutter test` runs the `calendar/helpers` tests
- **THEN** `eventsOverlap` is verified for overlapping and disjoint events, `eventStartsAtHour`/`eventEndsAtHour` are verified for fractional hours, `getEventsForWeekView` is verified to bucket events into the correct day of the requested week, and `getEventsForPlanningView` is verified to group events per day and return an empty list for empty input

#### Scenario: Overlapping-event layout is exercised

- **WHEN** `flutter test` runs the `EventForUI` test
- **THEN** `EventForUI.listFromEvents` is verified to leave non-overlapping events at a single column and to assign two overlapping events to distinct columns with a column count of two

#### Scenario: Calendar model serialization round-trips

- **WHEN** `flutter test` runs the `calendar/models` tests
- **THEN** `CalendarEvent`, `EventTag` and `CalendarEventCustomFields` are each verified to round-trip through their `fromInternalDb`/`fromDb` and `toDbMap` methods without losing field values

### Requirement: Event-details coverage

The `event_details` module SHALL have nominal regression tests for the
`ChecklistItem` model, the `ChecklistFocusController`, and the
`EventDetailsChecklistItem` widget.

#### Scenario: Checklist item model and focus controller are exercised

- **WHEN** `flutter test` runs the `event_details` model and controller tests
- **THEN** `ChecklistItem` is verified to round-trip through `fromMap`/`toMap` and to auto-generate a `uuid` when none is supplied, and `ChecklistFocusController` is verified to invoke registered listeners on `focusItem` and to stop invoking a listener after `removeListener`

#### Scenario: Checklist item widget is exercised

- **WHEN** `flutter test` runs the `EventDetailsChecklistItem` widget test
- **THEN** the widget is verified to render the item content, to reflect the item's checked state, and to invoke its callbacks when the checkbox and the remove control are tapped

### Requirement: School selection coverage

The `school` module SHALL have nominal regression tests for the happy path of
`SchoolSelectionController` and `schoolFilteredProvider`.

#### Scenario: School fetch and filter are exercised

- **WHEN** `flutter test` runs the `school` controller test
- **THEN** `SchoolSelectionController.fetch()` is verified, with a mocked API client, to populate state with the returned schools, and `schoolFilteredProvider` is verified to filter the school list by both school name and school code

### Requirement: Settings provider coverage

The `settings` module's `SettingsProvider` SHALL have nominal regression tests
for its default-loading logic and its pure color/theme helper methods.

#### Scenario: Settings defaults and helpers are exercised

- **WHEN** `flutter test` runs the `SettingsProvider` test with mocked plugin values
- **THEN** `loadSettings` is verified to populate the documented default values, and `getEventColorToSave`, `getEventColorToDisplay` and `getEventInterfaceColor` are verified for their nominal inputs

### Requirement: Onboarding screen coverage

The `onboarding` module's `OnboardingScreen` SHALL have a nominal widget test
covering rendering and carousel navigation.

#### Scenario: Onboarding screen renders and advances

- **WHEN** `flutter test` runs the `OnboardingScreen` widget test
- **THEN** the first onboarding page and its skip/next controls are verified to render, and advancing the carousel via the next control is verified to move to the second page
