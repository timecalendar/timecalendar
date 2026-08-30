# server-calendar-naming Specification

## Purpose
TBD - created by archiving change add-server-calendar-rename-contract. Update Purpose after archive.
## Requirements
### Requirement: A calendar name is optional on creation and always stored normalized

`POST /calendars` SHALL keep `name` optional in its request contract, because existing clients omit
it. The server SHALL normalize the submitted value to `(name ?? "").trim()` before persistence, so
a calendar is always stored with a string name and an omitted, null, or whitespace-only name is
stored as the empty string. The stored name column SHALL remain non-null, and this change SHALL NOT
require a database migration or a production backfill.

#### Scenario: Creating without a name stores and returns an empty name

- **WHEN** a valid create request omits `name`
- **THEN** the calendar is created successfully
- **AND** its stored name is the empty string, not null
- **AND** reading the calendar by its token returns `name` as the empty string

#### Scenario: A submitted name is trimmed before storage

- **WHEN** a create request supplies a name with leading and trailing whitespace
- **THEN** the stored name is the trimmed value
- **AND** a name that is only whitespace is stored as the empty string

#### Scenario: Existing client payloads remain valid

- **WHEN** a create request uses the existing payload shape, with either `schoolId` or `schoolName`
  and with or without `name`
- **THEN** the request is accepted with its previous status and response shape
- **AND** no previously valid create payload becomes invalid

### Requirement: New calendar-name writes are limited to 100 normalized characters

Every request that writes a calendar name SHALL reject a value whose normalized form exceeds 100
characters with HTTP `400`, and SHALL accept a normalized value of exactly 100 characters. The
limit SHALL be measured on the trimmed value, so surrounding whitespace never causes a rejection.
The limit SHALL apply to new writes only: names already stored beyond the limit remain valid data
and SHALL continue to be returned unchanged by every read.

#### Scenario: An over-length create is rejected

- **WHEN** a create request supplies a name whose trimmed length exceeds 100 characters
- **THEN** the endpoint returns HTTP 400
- **AND** no calendar is created

#### Scenario: The boundary value is accepted with its surrounding whitespace ignored

- **WHEN** a write supplies a name of exactly 100 characters surrounded by whitespace
- **THEN** the request is accepted
- **AND** the stored name is the trimmed 100-character value

#### Scenario: An existing over-length stored name is still served

- **WHEN** a calendar stored before this limit holds a name longer than 100 characters
- **THEN** reads return that stored name unchanged
- **AND** the calendar is not modified by this change

### Requirement: A calendar is renamed by possession of its token

The server SHALL expose `PATCH /v1/calendars/:token`, accepting a body whose `name` is required and
must be a string. The server SHALL trim the submitted name, accept an empty result as a valid
cleared name, and reject a missing, non-string, or over-length normalized value with HTTP `400`. A
request carrying a valid token SHALL return HTTP `200` with the public calendar representation
containing the stored name. Possession of the token SHALL be the only authorization: there is no
owner, and a rename SHALL be visible to every holder of that token. Duplicate names across
calendars SHALL be accepted and the last write SHALL win.

This endpoint SHALL be the only path-level `/v1` route. Global API versioning SHALL NOT be enabled,
and the existing unversioned calendar read, create, and sync routes SHALL remain unchanged.

#### Scenario: A valid token renames the calendar

- **WHEN** a rename request carries a known token and a valid name
- **THEN** the endpoint returns HTTP 200 with the public calendar representation
- **AND** that representation and a subsequent read by token both return the new name

#### Scenario: A rename trims its input and accepts an empty name

- **WHEN** a rename request supplies a name with surrounding whitespace
- **THEN** the stored and returned name is the trimmed value
- **AND** a rename to the empty string clears the name and succeeds

#### Scenario: Invalid rename input is rejected

- **WHEN** a rename request omits `name`, sends a non-string `name`, or sends a name whose trimmed
  length exceeds 100 characters
- **THEN** the endpoint returns HTTP 400
- **AND** the calendar's stored name is unchanged

#### Scenario: Duplicate names are permitted

- **WHEN** two calendars are renamed to the same name
- **THEN** both renames succeed
- **AND** neither calendar is rejected for a name collision

#### Scenario: Existing routes keep their unversioned paths

- **WHEN** a client calls the existing calendar read, create, or sync endpoints
- **THEN** they respond on their current unversioned paths with their current contracts

### Requirement: An unknown rename token returns 404 without disclosing calendar data

A rename request carrying a token that matches no calendar SHALL return HTTP `404`. The response
SHALL NOT include any calendar field, and the request SHALL NOT write to any calendar.

#### Scenario: Unknown token is rejected

- **WHEN** a rename request carries a token that matches no calendar
- **THEN** the endpoint returns HTTP 404
- **AND** the response body contains no calendar identifier, token, name, school name, or timestamp
- **AND** no calendar row is modified

### Requirement: A rename never advances the last upstream refresh time

A rename SHALL update ordinary entity metadata such as the entity's update timestamp, and SHALL NOT
change the calendar's last-upstream-refresh timestamp, which represents the last successful fetch
of the upstream calendar. A rename SHALL NOT trigger, schedule, or delay an upstream fetch.

#### Scenario: Renaming preserves the upstream refresh timestamp

- **WHEN** a calendar is renamed
- **THEN** its last-upstream-refresh timestamp is byte-for-byte the value it held before the rename
- **AND** its entity update timestamp advances
- **AND** the returned public representation carries the unchanged last-upstream-refresh timestamp

### Requirement: The rename endpoint records no token or submitted name in observability

The rename path SHALL NOT add the calendar token or any request-body value to application logs,
metrics attributes, traces, or crash metadata. The endpoint SHALL introduce no new observability
call carrying either value.

#### Scenario: A rename produces no name or token telemetry

- **WHEN** a rename succeeds or fails for any reason
- **THEN** the feature adds no log line, metric attribute, or span attribute containing the token or
  the submitted name

### Requirement: The committed contract and generated mobile client carry both new contracts

The committed `openapi/openapi.json` SHALL describe `PATCH /v1/calendars/:token`, its request
schema including the name length limit, its `200` public-calendar response, and its `400` and `404`
responses. It SHALL also describe the optional create name. `mobile/src/api/generated/` SHALL be
regenerated from that committed document. Both artifacts SHALL be generated, never hand-edited, and
no Flutter or generated Dart file SHALL change.

#### Scenario: The regenerated contract exposes the rename endpoint

- **WHEN** the OpenAPI document is regenerated from the server code
- **THEN** it contains the `/v1/calendars/{token}` path with its request and response schemas
- **AND** regenerating the mobile client from it produces no uncommitted drift

#### Scenario: Flutter output is untouched

- **WHEN** this change is applied
- **THEN** no file under the Flutter application directory, including generated Dart API output, is
  modified

