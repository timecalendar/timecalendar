## ADDED Requirements

### Requirement: The import-by-token path waits for local schema readiness

The development import-by-token data seam SHALL await the mobile migration runner before it issues the token-resolution request, maps the response, or writes `user_calendars`. This readiness wait SHALL preserve the existing runtime development gate, once-per-mounted-screen behavior, generated-client and durable-persist path, calendar sync, accessible error handling, and Calendar navigation.

#### Scenario: Fresh Android app data cannot race the import write

- **WHEN** the Activity native flow clears Android app data, cold-opens `timecalendar-dev://dev-import?token=e2e-activity-baseline`, and the startup migration is still active
- **THEN** the import joins that migration and issues neither `GET /calendars/by-token/{token}` nor the `user_calendars` upsert until the migration settles

#### Scenario: The import continues once migrations settle

- **WHEN** the joined migration settles successfully
- **THEN** the import resolves the token from the seeded local server, persists the calendar through the existing mapper/upsert seam, syncs, and lands on Calendar exactly once

#### Scenario: Waiting does not weaken production inertness

- **WHEN** a production-variant build reaches the dev-import route
- **THEN** the existing runtime gate still prevents the import action, including migration coordination, token resolution, durable writes, sync, and navigation
