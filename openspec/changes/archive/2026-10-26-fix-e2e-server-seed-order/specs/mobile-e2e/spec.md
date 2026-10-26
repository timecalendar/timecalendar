## MODIFIED Requirements

### Requirement: Fresh-user import proves the real school-to-calendar path

The fresh-user journey SHALL clear application state, follow the shipped welcome, seeded school selection, programme, export-guide, and URL-import screens, and submit a deterministic iCalendar fixture served by the harness-managed backend in the test/E2E environment. It SHALL finish on a rendered synced calendar and open a seeded synced-event detail with real content.

#### Scenario: A fresh student imports a timetable

- **WHEN** the flow selects the seeded school returned by the live schools endpoint, enters a programme, pages through the export guide to URL import, and submits the harness fixture URL
- **THEN** the backend creates and synchronizes the calendar through the generated client and persistence seams with nothing mocked
- **AND** the flow observes the fixture event in Agenda and opens details showing its seeded title and content

#### Scenario: Production does not expose the fixture

- **WHEN** the server module graph is built outside the test/E2E environment
- **THEN** the deterministic iCalendar fixture route is not registered
