## MODIFIED Requirements

### Requirement: Deterministic seeded state, isolated test database

Every `up` SHALL start from a known state: the `timecalendar_test` database is dropped,
migrated, and seeded with the fixture set, never touching a developer's development database.
The seed SHALL include a token-addressable calendar under the constant
`E2E_CALENDAR_TOKEN = "e2e-smoke-calendar"` / `E2E_CALENDAR_ID` (returned verbatim by
`POST /calendars/sync` with a fresh `lastUpdatedAt`, so no external iCal fetch occurs), and
that calendar's events SHALL include BOTH the existing week-anchored events AND a
**today-anchored** cluster on `now`'s UTC day with **at least two overlapping** timed events
(for column-packing on the calendar grid and the home mini-timeline), with **deterministic,
ASCII-safe, uniquely-titled** events the E2E flows assert and tap: at least one stable
today-anchored event whose details+checklist are reachable, and at least one stable
today-anchored event that can be hidden then un-hidden. The token/id SHALL remain constant so
the mobile import deep link resolves the same calendar.

#### Scenario: Repeat runs are reproducible

- **WHEN** `up` is run twice in a row
- **THEN** both runs end with `GET /schools` returning exactly the seeded fixture set, and the
  seeded `e2e-smoke-calendar` calendar returning the same deterministic events, regardless of
  what previous runs wrote

#### Scenario: The seed includes a today-anchored dense-overlap cluster

- **WHEN** the seed runs under `NODE_ENV=test` via `db:init`
- **THEN** the `e2e-smoke-calendar` calendar carries at least two overlapping timed events on
  `now`'s UTC day, plus stable uniquely-titled today events for the details/checklist and the
  hide/un-hide flows, all with ASCII-safe titles/locations

#### Scenario: The token and id stay constant for the import deep link

- **WHEN** the mobile dev-import deep link resolves `e2e-smoke-calendar`
- **THEN** the token and `E2E_CALENDAR_ID` match the seeded calendar so the imported
  `user_calendars` row and the synced `calendar_events` correspond to the seeded events

#### Scenario: Sync returns the seeded events without an external fetch

- **WHEN** `POST /calendars/sync { tokens: ["e2e-smoke-calendar"] }` is called after the seed
- **THEN** the seeded `CalendarContent` events are returned directly (the fresh
  `lastUpdatedAt` keeps the server from making an external iCal call)
