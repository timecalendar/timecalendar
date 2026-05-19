## ADDED Requirements

### Requirement: Per-flow process isolation

Each end-to-end flow SHALL run in its own `flutter test` process so that
`Firebase.initializeApp` runs exactly once per flow and flows cannot leak
process-global state into one another.

#### Scenario: Each flow file runs as a separate process

- **WHEN** the harness runs the E2E flow suite
- **THEN** every `app/integration_test/*_flow_test.dart` file is run as its own `flutter test` invocation, and the suite fails if any flow file fails

#### Scenario: A new flow needs no harness change

- **WHEN** a contributor adds a new `*_flow_test.dart` file under `app/integration_test/`
- **THEN** `run_e2e.sh` and the CI job pick it up automatically with no edit to the harness script

### Requirement: Onboarding and add-school smoke flow

The app SHALL have an end-to-end test that exercises the onboarding screens and
entry into the add-school flow against the live backend.

#### Scenario: A new user walks onboarding to school selection

- **WHEN** the app boots with no local calendar
- **THEN** the onboarding screens show, advancing through them reaches the school-selection screen, the two seeded schools load over a real `GET /schools` request, and tapping a school advances the add-school assistant flow to its next native screen

### Requirement: Calendar, event-details and settings smoke flow

The app SHALL have an end-to-end test that, starting from a seeded calendar,
exercises viewing the calendar, opening an event, and reaching settings.

#### Scenario: A returning user views a calendar, an event, and settings

- **WHEN** the app boots with a local calendar whose token matches a backend-seeded calendar
- **THEN** the app routes to the main tabs, the calendar tab renders the events synced from `POST /calendars/sync`, opening a seeded event shows the event-details screen with its title and location, and the settings screen is reachable and a preference can be toggled

### Requirement: Deterministic calendar data without external network

The E2E suite SHALL exercise the calendar and event-details flows against
backend-seeded calendar data, with no dependency on external university iCal
sources.

#### Scenario: Seeded calendar events sync from the backend

- **WHEN** the calendar flow runs against the harness backend
- **THEN** a `Calendar` and `CalendarContent` seeded by fixtures supply the events returned by `POST /calendars/sync`, the events are dated relative to the seed run so they fall in the calendar's current view, and no request is made to any external iCal URL

### Requirement: Local-database seeding for flow tests

The test-support utilities SHALL let a flow test deterministically control the
app's local database state before boot.

#### Scenario: A flow seeds a local calendar before boot

- **WHEN** a flow test calls the local-DB test helpers before `app.main()`
- **THEN** it can reset local app state and seed a `UserCalendar`, so the app boots into a known state (onboarding or the main tabs) deterministically
