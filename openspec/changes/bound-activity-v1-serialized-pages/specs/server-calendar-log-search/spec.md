## ADDED Requirements

### Requirement: Oversized logs project into stable valid v1 fragments

The v1 search path SHALL project a source log whose complete mapped item exceeds the fragment
target into a deterministic sequence of `CalendarLogV1` items. Each projected item SHALL retain the
source calendar metadata and timestamps, SHALL contain all three `calendarChange` arrays, and SHALL
split only between array entries; one changed-item old/new pair SHALL remain atomic. The logical
sequence SHALL preserve `newItems`, then `changedItems`, then `oldItems`, and preserve the stored
order within each array.

Fragment zero SHALL retain the source log id. Every later fragment SHALL have a stable distinct
opaque id derived from the source id and fragment position, so a consumer that upserts by item id
replaces a previously cached whole item and does not replace one new fragment with another.

#### Scenario: Many changes in one source log

- **WHEN** one source log contains enough ordinary changes to exceed the fragment target
- **THEN** v1 returns it as two or more valid items whose concatenated logical change sequence is
  exactly the source sequence, with no entry duplicated, omitted, reordered, or split

#### Scenario: Fragment identity is repeatable

- **WHEN** the same immutable source log is projected by repeated requests
- **THEN** it receives the same fragment boundaries and ids on every request, fragment zero uses the
  source id, and every later id is distinct

#### Scenario: Ordinary log retains its representation

- **WHEN** a complete mapped log fits within the fragment target
- **THEN** v1 returns one item with the existing source id and complete `calendarChange`

#### Scenario: Existing id-keyed cache receives a fragmented replacement

- **WHEN** a consumer already holds the complete source item and upserts a fragmented response by id
- **THEN** fragment zero replaces the old item and every later fragment remains separately stored,
  so the old whole item does not duplicate the projected changes

### Requirement: Serialized v1 pages are packed against the wire representation

The v1 service SHALL stop a page before either the requested item `limit` or a named serialized-byte
target below 1,000,000 bytes would be exceeded. The byte decision SHALL measure the actual JSON
response envelope including items, next cursor, snapshot timestamp, and optional unread count. It
SHALL make progress by returning one atomic-entry item alone when that item cannot fit, without
truncating it or repeating it indefinitely.

#### Scenario: Byte target ends a page before item limit

- **WHEN** another projected item would keep the page within `limit` but make the serialized response
  exceed the byte target
- **THEN** the server omits that item from this page and returns a cursor pointing to it

#### Scenario: Many-change route pages stay below G7

- **WHEN** the deterministic 3,656-change source log is read through the real HTTP route until its
  cursor chain ends
- **THEN** every serialized response is below 1,000,000 bytes and aggregate reconstruction proves
  every change entry was returned exactly once

#### Scenario: One atomic entry is larger than the target

- **WHEN** a valid individual event or changed pair cannot fit below the byte target by itself
- **THEN** the server returns that atomic entry alone, advances the continuation position, and
  records only a non-identifying aggregate overflow outcome

## MODIFIED Requirements

### Requirement: Snapshot-bound keyset pagination

Results SHALL be a virtual item stream ordered by source log `createdAt DESC, id DESC`, with every
fragment of one source log contiguous, and constrained to source rows with `createdAt <= asOf`.
`asOf` SHALL be captured from the database clock on the first page and carried forward through the
cursor. A page SHALL return at most `limit` virtual items and SHALL also stop at the serialized-byte
target. The server SHALL return `nextCursor: null` only after the final source row and its final
fragment have been returned. Source-log ordering SHALL be stable across calendars.

#### Scenario: Following page stays inside the original snapshot

- **WHEN** a client requests the next page with a cursor issued by a previous page
- **THEN** the response contains only remaining fragments and older source rows from within the
  original `asOf` snapshot

#### Scenario: A log inserted between page requests

- **WHEN** a new calendar log is written after the first page and before the second page request
- **THEN** the new log appears in neither page, and no source log or fragment from the first page is
  duplicated or displaced in the second

#### Scenario: Equal timestamps paginate deterministically

- **WHEN** several source logs share the same `createdAt` value and their virtual items span a page
  boundary
- **THEN** paging through the whole chain returns every source log's fragments exactly once, ordered
  by descending source id within the shared timestamp

#### Scenario: Sub-millisecond timestamps are not collapsed

- **WHEN** source logs whose `createdAt` values differ only below millisecond precision span a page
  boundary
- **THEN** paging through the whole chain returns every source log and fragment exactly once, with
  none skipped

#### Scenario: Page ends within one source log

- **WHEN** the item or byte bound is reached before an oversized source log's last fragment
- **THEN** the next page resumes at the first unreturned atomic entry of that same source log

#### Scenario: Final page

- **WHEN** the last remaining virtual items fit inside both page bounds
- **THEN** the response returns them with `nextCursor: null`

#### Scenario: Ordering across calendars

- **WHEN** a request covers several calendars whose logs interleave in time
- **THEN** the returned virtual items remain grouped by source log and the source logs are ordered
  strictly by `createdAt DESC, id DESC` regardless of calendar

### Requirement: Opaque versioned cursor

`nextCursor` SHALL be an opaque, versioned encoding of the `asOf` snapshot and the next unread
position in the virtual item stream. It SHALL preserve the database's full stored timestamp
precision and, when continuation remains inside a source log, a validated non-negative safe-integer
atomic-entry offset. The server SHALL accept previously issued version 1 exclusive-row cursors with
their existing meaning and SHALL issue version 2 cursors for byte-bounded pages. It SHALL fully
validate a supplied cursor's structure, supported version, timestamp values, id, and fragment offset
before using any value in a query, and SHALL return 400 without echoing the cursor when invalid.

#### Scenario: Previously issued version 1 cursor

- **WHEN** a client resumes with a valid version 1 cursor issued before byte-bounded pagination
- **THEN** the server continues exclusively below its `(createdAt, id)` anchor without rejecting or
  repeating the anchor row

#### Scenario: Version 2 resumes inside a log

- **WHEN** a valid version 2 cursor names an atomic-entry offset within its anchored source log
- **THEN** the server includes that row, begins at exactly that offset, and returns no earlier entry

#### Scenario: Invalid fragment offset

- **WHEN** a version 2 cursor contains a negative, fractional, unsafe, or beyond-end offset
- **THEN** the response is 400 before an invalid offset can duplicate, omit, or loop over content

#### Scenario: Malformed cursor

- **WHEN** a client posts a cursor that is not decodable, or decodes to something other than a
  valid cursor object
- **THEN** the response is 400 and the response body does not contain the submitted cursor value

#### Scenario: Unsupported cursor version

- **WHEN** a client posts a well-formed cursor whose version field is neither the accepted legacy
  version nor the current version
- **THEN** the response is 400

#### Scenario: Impossible cursor timestamp

- **WHEN** a cursor has the expected timestamp text shape but contains an impossible calendar or
  clock value
- **THEN** the response is 400 before any repository query runs

#### Scenario: Cursor carries no sensitive data

- **WHEN** a `nextCursor` is decoded
- **THEN** its payload contains no calendar token and no event content (no title, location,
  description, or UID)
