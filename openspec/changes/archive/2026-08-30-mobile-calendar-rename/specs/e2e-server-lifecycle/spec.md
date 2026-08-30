# e2e-server-lifecycle — delta

## MODIFIED Requirements

### Requirement: Deterministic seeded state, isolated test database

Every `up` SHALL start from a known state: the `timecalendar_test` database is dropped,
migrated, and seeded with the fixture set, never touching a developer's development database.
The seed SHALL include a token-addressable calendar under the constant
`E2E_CALENDAR_TOKEN = "e2e-smoke-calendar"` / `E2E_CALENDAR_ID` (returned verbatim by
`POST /calendars/sync` with a `syncPlannedAt` a day in the future, so no external iCal fetch
occurs), and
that calendar's events SHALL include BOTH the existing week-anchored events AND a
**today-anchored** cluster on `now`'s UTC day with **at least two overlapping** timed events
(for column-packing on the calendar grid and the home mini-timeline), with **deterministic,
ASCII-safe, uniquely-titled** events the E2E flows assert and tap: at least one stable
today-anchored event whose details+checklist are reachable, and at least one stable
today-anchored event that can be hidden then un-hidden. The token/id SHALL remain constant so
the mobile import deep link resolves the same calendar.

The seed SHALL ALSO include a **second, dedicated** token-addressable calendar under the constants
`E2E_RENAME_CALENDAR_TOKEN = "e2e-rename-calendar"` / `E2E_RENAME_CALENDAR_ID`, carrying a
deterministic ASCII-safe baseline **name** that no other seeded calendar uses. It exists so the
rename round-trip flow can perform a durable server rename without mutating `e2e-smoke-calendar`,
whose name and events the other flows depend on within the same device session.

Because that flow renames it, this calendar's name is the one piece of seeded state a run mutates:
every `up` SHALL reset it to the baseline name, so repeat runs remain reproducible. Its id and token
SHALL remain constant so the dev-import deep link and the flow's row selector resolve the same
calendar. Its events are not asserted by any flow and SHALL be kept minimal.

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

#### Scenario: The rename calendar is reset to its baseline name on every up

- **WHEN** a previous run renamed `e2e-rename-calendar` and `up` is run again
- **THEN** the calendar is seeded back to its baseline name under the same constant id and token
