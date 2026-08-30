# mobile-calendar-identity-persistence — delta

## MODIFIED Requirements

### Requirement: Row↔domain and server-DTO mappers
The data layer SHALL convert between the stored row type (TEXT ISO-8601 dates, integer boolean)
and a domain type (exposing `Date` timestamps and a boolean `visible`) through pure mappers.
Writing a domain object SHALL normalize each timestamp to a canonical UTC ISO-8601 string;
reading SHALL parse it back to a `Date`. Nullable `schoolName`/`schoolId` SHALL round-trip
including absent values. The data layer SHALL also expose a pure mapper from the server
`CalendarForPublic` DTO to the domain type (mirroring the Flutter `fromCalendarForPublic`).

That DTO mapper SHALL default `visible` to `true`, because the server holds no local visibility
state, and it SHALL therefore be used **only** where a calendar row is being created from scratch —
create, add-by-URL, and add-by-token. It SHALL NOT be used to refresh an existing row: a full-row
write on the sync path would replace a locally hidden calendar's `visible: false` with the mapper's
default at every sync, i.e. at every app start. Refreshing server-owned fields on an existing row
SHALL go through a narrow column-scoped write instead (the sync path's `updateName(id, name)`; see
`mobile-calendar-sync`). No type or lint rule can express this, so it is stated here, at the mapper
that causes it, as well as at the path that must avoid it.

#### Scenario: A domain calendar round-trips through the mappers
- **WHEN** a domain calendar is mapped to a row and back to a domain calendar
- **THEN** all fields are preserved, the timestamps are equal, the row's date strings are
  canonical UTC ISO-8601, and `visible` is preserved
- **AND** a null `schoolName` or `schoolId` round-trips as absent

#### Scenario: A server calendar DTO maps to the domain type
- **WHEN** the `CalendarForPublic` → domain mapper is given a server DTO
- **THEN** it returns a domain calendar carrying the DTO's id, token, name, schoolName, schoolId,
  dates (parsed to `Date`), and `visible` defaulting to true

#### Scenario: The DTO mapper is not used to refresh an existing row
- **WHEN** a code path updates a `user_calendars` row that already exists locally
- **THEN** it writes only the columns the server owns for that path, through a narrow write
- **AND** it does not map the server DTO into a full-row upsert, so a local `visible: false` survives
