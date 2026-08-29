# server-calendar-log-search Specification

## Purpose
TBD - created by archiving change add-v1-calendar-log-search. Update Purpose after archive.
## Requirements
### Requirement: Versioned calendar-log search endpoint

The server SHALL expose `POST /v1/calendar-logs/search` as a path-level controller route that
returns a bounded, cursor-paginated page of calendar logs for a set of calendar tokens supplied in
the request body. The route SHALL NOT require or enable global API versioning, and SHALL NOT move
any other endpoint under `/v1`.

The response body SHALL be
`{ items: CalendarLogV1[], nextCursor: string | null, asOf: string, unreadCount?: number }`, where
`CalendarLogV1` is `{ id, calendarId, calendarName, calendarChange, createdAt, updatedAt }`.

#### Scenario: Valid first page

- **WHEN** a client posts a non-empty `tokens` array with no `cursor`
- **THEN** the response is 200 carrying the newest page of matching logs, an `asOf` snapshot
  timestamp taken from the database clock, and a `nextCursor` when more rows exist under that
  snapshot

#### Scenario: Tokens are never accepted in a URL

- **WHEN** the endpoint is invoked
- **THEN** calendar tokens are read only from the JSON request body, and no route on this
  capability accepts a token as a path segment or query parameter

### Requirement: The v1 response omits the calendar token

`CalendarLogV1` SHALL NOT contain a `calendarToken` field. The v1 mapping SHALL NOT assign the
token onto the response object at any point.

#### Scenario: Serialized v1 item carries no token

- **WHEN** a v1 search returns a log for a known calendar
- **THEN** the serialized item has no `calendarToken` key, and the calendar's token value appears
  nowhere in the response body

#### Scenario: Legacy mapping is unaffected

- **WHEN** the same log is fetched through the unversioned endpoint
- **THEN** the response item still contains `calendarToken` with the calendar's token

### Requirement: Request validation bounds every input

The v1 request DTO SHALL enforce, before any repository work begins:

- `tokens` is required, is an array, and every element is a non-empty string;
- duplicate tokens are collapsed before the cap is applied;
- at most 100 **unique** tokens are accepted;
- `limit` is optional, defaults to 50, and must be an integer from 1 through 100;
- `unreadSince` is optional and must be a valid ISO-8601 timestamp;
- `cursor` is optional and must be a non-empty string.

A violation of any of these SHALL return 400.

#### Scenario: Bare string instead of a token array

- **WHEN** a client posts `{"tokens": "some-token"}`
- **THEN** the response is 400, not a 200 with an empty result

#### Scenario: Empty or non-string token element

- **WHEN** a client posts a `tokens` array containing an empty string, a number, or `null`
- **THEN** the response is 400

#### Scenario: More than 100 unique tokens

- **WHEN** a client posts 101 distinct tokens
- **THEN** the response is 400

#### Scenario: Duplicates collapse below the cap

- **WHEN** a client posts 150 token entries that reduce to 3 unique values
- **THEN** the response is 200 and the query runs against the 3 unique tokens

#### Scenario: Limit outside its range

- **WHEN** a client posts `limit` of `0`, `101`, `1.5`, or a non-numeric value
- **THEN** the response is 400

#### Scenario: Limit omitted

- **WHEN** a client omits `limit`
- **THEN** the page contains at most 50 items

#### Scenario: Invalid timestamp

- **WHEN** a client posts an `unreadSince` value that is not a valid ISO-8601 timestamp
- **THEN** the response is 400

### Requirement: Empty token array short-circuits the log query

An empty `tokens` array SHALL return an empty first page without querying `calendar_log`. The
response SHALL still carry a database-sourced `asOf`.

#### Scenario: Empty array

- **WHEN** a client posts `{"tokens": []}`
- **THEN** the response is 200 with `items: []`, `nextCursor: null`, and an `asOf` timestamp, and
  no calendar-log page query is executed

#### Scenario: Empty array with an unread watermark

- **WHEN** a client posts `{"tokens": [], "unreadSince": "<timestamp>"}`
- **THEN** the response is 200 with `unreadCount: 0` and no unread-count query is executed

### Requirement: Unknown tokens contribute no rows and never fail the request

A token that matches no calendar SHALL contribute zero rows. It SHALL NOT cause an error, and it
SHALL NOT suppress rows for the other tokens in the same request.

#### Scenario: Only unknown tokens

- **WHEN** every supplied token is unknown
- **THEN** the response is 200 with `items: []` and `nextCursor: null`

#### Scenario: Known and unknown tokens mixed

- **WHEN** a request mixes known and unknown tokens
- **THEN** the response is 200 containing only rows belonging to the known tokens

### Requirement: Snapshot-bound keyset pagination

Results SHALL be ordered `createdAt DESC, id DESC` and constrained to rows with
`createdAt <= asOf`, where `asOf` is captured from the database clock on the first page and carried
forward through the cursor. The server SHALL read one row beyond `limit` to decide whether more
rows exist, SHALL return at most `limit` items, and SHALL return `nextCursor: null` on the final
page. Ordering SHALL be stable across calendars.

#### Scenario: Following page stays inside the original snapshot

- **WHEN** a client requests the next page with a cursor issued by a previous page
- **THEN** the response contains only older rows from within the original `asOf` snapshot

#### Scenario: A log inserted between page requests

- **WHEN** a new calendar log is written after the first page and before the second page request
- **THEN** the new log appears in neither page, and no row from the first page is duplicated or
  displaced in the second

#### Scenario: Equal timestamps paginate deterministically

- **WHEN** several logs share the same `createdAt` value and span a page boundary
- **THEN** paging through the whole chain returns every row exactly once, ordered by descending id
  within the shared timestamp

#### Scenario: Sub-millisecond timestamps are not collapsed

- **WHEN** logs are written whose `createdAt` values differ only below millisecond precision and
  span a page boundary
- **THEN** paging through the whole chain returns every row exactly once, with none skipped

#### Scenario: Final page

- **WHEN** the last remaining rows fit inside `limit`
- **THEN** the response returns them with `nextCursor: null`

#### Scenario: Ordering across calendars

- **WHEN** a request covers several calendars whose logs interleave in time
- **THEN** the returned items are ordered strictly by `createdAt DESC, id DESC` regardless of which
  calendar each belongs to

### Requirement: Opaque versioned cursor

`nextCursor` SHALL be an opaque, versioned encoding of the `asOf` snapshot and the last returned
row's `(createdAt, id)` pair. It SHALL preserve the database's full stored timestamp precision. The
server SHALL fully validate a supplied cursor's structure, version, and timestamp values (including
calendar and clock semantics, not only their text format) before using any of its values in a
query, and SHALL return 400 for a cursor that is malformed, structurally invalid, contains an
impossible timestamp, or is of an unsupported version. The 400 response SHALL NOT echo the
submitted cursor.

#### Scenario: Malformed cursor

- **WHEN** a client posts a cursor that is not decodable, or decodes to something other than a
  valid cursor object
- **THEN** the response is 400 and the response body does not contain the submitted cursor value

#### Scenario: Unsupported cursor version

- **WHEN** a client posts a well-formed cursor whose version field is not a version this server
  issues
- **THEN** the response is 400

#### Scenario: Impossible cursor timestamp

- **WHEN** a cursor has the expected timestamp text shape but contains an impossible calendar or
  clock value
- **THEN** the response is 400 before any repository query runs

#### Scenario: Cursor carries no sensitive data

- **WHEN** a `nextCursor` is decoded
- **THEN** its payload contains no calendar token and no event content (no title, location,
  description, or UID)

### Requirement: Exact unread count on the first page only

When `unreadSince` is supplied on a request without a cursor, the response SHALL carry
`unreadCount`: the exact number of rows for the requested tokens where
`createdAt > unreadSince AND createdAt <= asOf`. When a cursor is present, the response SHALL omit
`unreadCount` and SHALL NOT execute the count query. A request supplying both `cursor` and
`unreadSince` SHALL page normally rather than returning an error.

#### Scenario: First page with a watermark

- **WHEN** a client posts `unreadSince` with no cursor
- **THEN** the response carries `unreadCount` counting only that client's tokens' rows created
  after the watermark and at or before `asOf`

#### Scenario: Following page with a watermark

- **WHEN** a client posts both a cursor and `unreadSince`
- **THEN** the response is 200, omits `unreadCount`, and runs no count query

#### Scenario: Unread count respects token scope

- **WHEN** rows exist for calendars outside the requested tokens
- **THEN** they are excluded from `unreadCount`

### Requirement: Stable parameterized repository queries

Repository queries SHALL resolve tokens through the indexed `calendar.token` column, page through
the existing calendar/date indexes with the `id` tie-breaker, exclude soft-deleted calendars, and
use parameterized values exclusively. No request value SHALL be interpolated into SQL text.

#### Scenario: Soft-deleted calendar

- **WHEN** a calendar has been soft-deleted
- **THEN** its logs are excluded from v1 results, matching the unversioned endpoint's behavior

#### Scenario: No string interpolation of request values

- **WHEN** any token, cursor field, limit, or timestamp reaches the repository
- **THEN** it is bound as a query parameter, never concatenated into the SQL string

### Requirement: Sanitized failure behavior

The endpoint SHALL NOT log request bodies, tokens, cursors, calendar identifiers, log identifiers,
or event content at any level, including on failure. An unexpected database failure SHALL surface
as the server's existing sanitized 5xx behavior.

#### Scenario: Repository failure

- **WHEN** the repository throws during a v1 search
- **THEN** the response is the standard sanitized 5xx, and no emitted log line contains a calendar
  token, cursor value, event title, event location, or the request body

#### Scenario: Validation failure

- **WHEN** a request fails validation
- **THEN** no emitted log line contains the submitted token values or cursor

### Requirement: Bounded telemetry with no derived labels

Every metric label value the endpoint records SHALL come from a closed, statically declared set.
No label SHALL be derived from a token, calendar, user, event, log identifier, or cursor. The
endpoint MAY record page row count, unread-count duration, and first-page/cursor outcome.

#### Scenario: Recorded labels are enumerable

- **WHEN** the endpoint records a measurement
- **THEN** each attached label value belongs to a fixed enumeration declared in code, and no label
  value originates from request or row data

### Requirement: Unversioned endpoint stays compatible with corrected array validation

The unversioned `POST /calendar-logs/search` SHALL keep its exact existing response shape,
including `calendarToken`, and SHALL keep its committed OpenAPI path definition unchanged. Its
request DTO SHALL additionally assert that `tokens` is an array, so a non-array value returns 400
instead of a silent empty success.

#### Scenario: Valid legacy array request

- **WHEN** an existing client posts a valid `tokens` array to the unversioned endpoint
- **THEN** the response is the same array of `CalendarLogGet` items it returned before, including
  `calendarToken`

#### Scenario: Legacy bare-string request

- **WHEN** a client posts `{"tokens": "some-token"}` to the unversioned endpoint
- **THEN** the response is 400, where it previously returned 200 with an empty array

### Requirement: Committed OpenAPI contract covers v1 and preserves legacy

`openapi/openapi.json` SHALL contain the `/v1/calendar-logs/search` path and its request/response
schemas, and SHALL preserve the `/calendar-logs/search` path definition unchanged. The committed
generated mobile client SHALL match the committed spec so the contract-drift gates pass.

#### Scenario: Regenerating the spec produces no diff

- **WHEN** the OpenAPI generation script runs against the merged server code
- **THEN** `openapi/openapi.json` is unchanged, and the `/calendar-logs/search` path definition is
  byte-identical to its previous content

#### Scenario: Regenerating the mobile client produces no diff

- **WHEN** the mobile client generator runs against the committed spec
- **THEN** `mobile/src/api/generated` is unchanged
