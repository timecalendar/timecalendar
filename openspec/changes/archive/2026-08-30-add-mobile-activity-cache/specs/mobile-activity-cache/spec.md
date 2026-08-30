## ADDED Requirements

### Requirement: Activity history is stored in two dedicated SQLite tables

The `@/db` seam SHALL own an `activity_logs` table and a singleton `activity_state` table, created by a committed Drizzle migration.

`activity_logs` SHALL key rows on the server calendar-log id as its primary key, and SHALL store the owning calendar's server id, the calendar's name, the structured change payload as JSON text, and the server-issued creation and update timestamps as canonical UTC ISO-8601 text. It SHALL be indexed on the creation timestamp and on the calendar id.

`activity_state` SHALL be a single row identified by the constant id `1`, holding the read watermark, the unread count, the last successful refresh timestamp, the older-page cursor, and whether the older-page chain is complete. No migration SHALL seed the row: a missing `activity_state` row SHALL read as the documented defaults — a null watermark, a zero unread count, a null last-successful-refresh timestamp, a null older-page cursor, and an incomplete older-page chain.

Feature code SHALL reach both tables only through `@/db`.

#### Scenario: The migration creates the tables and indexes on a fresh database

- **WHEN** every committed migration is applied in journal order to an empty database
- **THEN** `activity_logs` and `activity_state` exist with their specified columns
- **AND** an index on the `activity_logs` creation timestamp and an index on its calendar id both exist

#### Scenario: The migration upgrades an existing installed database without data loss

- **WHEN** every migration preceding the Activity migration is applied, rows are inserted into each already-existing table, and the Activity migration is then applied
- **THEN** `activity_logs` and `activity_state` exist with their indexes
- **AND** every previously inserted row in every pre-existing table is still present and unchanged

#### Scenario: The Activity migration is additive only

- **WHEN** the Activity migration's committed SQL is inspected
- **THEN** it contains no statement that drops or alters an already-existing table
- **AND** the journal entries preceding it are unmodified

#### Scenario: Absent state reads as documented defaults

- **WHEN** Activity state is read and no `activity_state` row exists
- **THEN** the read returns a null read watermark, a zero unread count, a null last-successful-refresh timestamp, a null older-page cursor, and an incomplete older-page chain
- **AND** the read does not throw

### Requirement: Activity rows map defensively between storage and domain

The row↔domain mappers for Activity SHALL be pure — free of database and observability access — and SHALL isolate the JSON-as-text and ISO-text storage format.

The read mapper SHALL round-trip a valid stored row into its domain value with the change payload decoded. It SHALL yield no domain value for a row whose change payload is not parseable JSON, or whose parsed payload is not an object carrying the change payload's expected item collections. A malformed row SHALL be skipped, never fatal to the read.

The write mapper SHALL normalize the server timestamps to canonical UTC ISO-8601 text and SHALL yield no row for a payload whose timestamps cannot be parsed, so that a value which would break ordered reads and age-based pruning never reaches the table.

A read that skipped one or more malformed rows SHALL be recorded once through the `@/firebase` unexpected-error path with a static context and a count only. The recorded value SHALL NOT contain a log id, a calendar id, a calendar name, an event title, a location, a description, or any part of the change payload.

#### Scenario: A valid row round-trips

- **WHEN** a payload is written through the write mapper and the resulting row is read through the read mapper
- **THEN** the identifiers, calendar name, timestamps, and decoded change payload match the original

#### Scenario: A malformed change payload is skipped, not fatal

- **WHEN** a stored row's change payload is not parseable JSON, or parses to a value that is not the expected change object
- **THEN** the read mapper yields no domain value for that row
- **AND** other rows in the same read are returned normally

#### Scenario: An unparseable timestamp never reaches the table

- **WHEN** a payload carries a creation or update timestamp that cannot be parsed
- **THEN** the write mapper yields no row for it

#### Scenario: A skipped row is recorded without content

- **WHEN** a read skips at least one malformed row
- **THEN** exactly one unexpected-error record is made through `@/firebase` for that read, carrying a static context and the number of skipped rows
- **AND** the record contains no identifier, name, or change-payload content

### Requirement: An Activity page is stored as one atomic transaction keyed by log id

Storing a page of Activity history SHALL upsert its rows **by log id** and SHALL NEVER replace the table, so that pagination and offline history accumulate rather than being discarded.

Each page write SHALL execute as a single synchronous transaction that, in order: upserts the page's rows; deletes rows older than one year relative to the latest trusted server snapshot; deletes rows whose calendar id is not among the held calendar ids supplied by the caller; and only then advances pagination and refresh state. If any step throws, the transaction SHALL leave the cached rows and the stored state exactly as they were.

The held calendar ids SHALL be supplied by the caller rather than read from the calendar tables inside this repository, so that Activity storage does not depend on the calendar feature.

The ordered read SHALL return rows newest first, ordered by creation timestamp descending with the log id as a descending tie-breaker.

#### Scenario: The first successful page is stored and rendered from the cache

- **WHEN** a page is stored into an empty cache
- **THEN** every row in the page is present in `activity_logs`
- **AND** the ordered read returns them newest first

#### Scenario: A repeated page does not duplicate rows

- **WHEN** a page whose log ids are already cached is stored again, with changed field values
- **THEN** the row count is unchanged
- **AND** each affected row carries the newly stored values

#### Scenario: An older page overlapping cached rows merges safely

- **WHEN** an older page containing some already-cached log ids and some new ones is stored
- **THEN** the previously cached rows outside that page are still present
- **AND** the new rows are added and the overlapping rows are updated, without duplication

#### Scenario: A failed page write changes nothing

- **WHEN** a page write throws partway through its transaction
- **THEN** the cached rows are unchanged
- **AND** the stored pagination and refresh state are unchanged

### Requirement: Local retention prunes against the latest trusted server snapshot

Each page write SHALL delete rows whose creation timestamp is more than one year older than the latest trusted server snapshot, where that snapshot is the later of the write's own server-issued snapshot timestamp and the newest creation timestamp already cached. The device clock SHALL NOT participate in the retention cutoff.

#### Scenario: Rows beyond one year are pruned

- **WHEN** a page is stored with a server snapshot timestamp and the cache holds rows created more than a year before it
- **THEN** those rows are deleted
- **AND** rows inside the one-year window are retained

#### Scenario: An older snapshot does not prune less than a newer one already known

- **WHEN** a page carrying an older server snapshot is stored while the cache already holds rows created after that snapshot
- **THEN** the retention cutoff is derived from the newest cached creation timestamp, not from the older snapshot

#### Scenario: A wrong device clock does not affect retention

- **WHEN** the device clock is far in the past or future while a page is stored
- **THEN** the set of pruned rows is unchanged

### Requirement: Removing a calendar removes only its Activity rows

Each page write SHALL delete rows whose calendar id is not among the held calendar ids supplied by the caller, so that history for a calendar the student removed does not remain readable on the device. When the caller supplies no held calendar ids, every Activity row SHALL be deleted.

#### Scenario: Only the removed calendar's rows are deleted

- **WHEN** a page is stored with held calendar ids that omit one calendar present in the cache
- **THEN** that calendar's rows are deleted
- **AND** every row belonging to a still-held calendar remains

#### Scenario: Holding no calendars clears the cache

- **WHEN** a page write supplies an empty set of held calendar ids
- **THEN** `activity_logs` is empty afterwards

### Requirement: The older-page cursor advances only after a successful write and survives restart

The older-page cursor SHALL be persisted in `activity_state` and SHALL be written inside the same transaction as the rows it describes, after those rows are stored.

The first successful page stored into an empty cache SHALL persist its next cursor as the older-page cursor. A later newest-page write SHALL **preserve** an already-stored older-page cursor, so a partially completed backfill does not restart from the second page. A successful older-page write SHALL replace the older-page cursor with its own next cursor. A write whose next cursor is absent SHALL mark the older-page chain complete.

Clearing a rejected cursor SHALL set the older-page cursor to absent and the chain to incomplete, and SHALL delete no cached rows, so pagination restarts safely from the newest page.

#### Scenario: The first page stores its cursor

- **WHEN** the first page is stored into an empty cache with a next cursor
- **THEN** the older-page cursor is that next cursor

#### Scenario: A newest-page refresh preserves an existing older cursor

- **WHEN** a newest page carrying its own next cursor is stored while an older-page cursor is already persisted
- **THEN** the persisted older-page cursor is unchanged

#### Scenario: An older-page write advances the cursor

- **WHEN** an older page is stored successfully with a next cursor
- **THEN** the older-page cursor becomes that next cursor

#### Scenario: The cursor survives a restart

- **WHEN** the process restarts and Activity state is read again
- **THEN** the older-page cursor persisted before the restart is returned

#### Scenario: A failed write does not advance the cursor

- **WHEN** an older-page write throws before completing
- **THEN** the older-page cursor is the value it held before the write

#### Scenario: An absent next cursor completes the chain

- **WHEN** a page is stored with no next cursor
- **THEN** the older-page chain is marked complete

#### Scenario: An invalid stored cursor is cleared without data loss

- **WHEN** the stored older-page cursor is cleared after the server rejected it
- **THEN** the older-page cursor is absent and the chain is incomplete
- **AND** every cached Activity row is still present

### Requirement: The Activity read watermark is server-issued time

`lastReadAt` SHALL only ever be written with a server-issued timestamp. The device clock SHALL NOT be a source for it.

Marking Activity read against a successful server snapshot SHALL set the watermark to that snapshot and the unread count to zero. Marking Activity read while offline SHALL set the unread count to zero and SHALL advance the watermark only to the newest creation timestamp present in the cache, and only when that is later than the stored watermark.

A page write that stores a server-provided unread count SHALL NOT move the watermark.

`lastSuccessfulRefreshAt` is a local-elapsed-time value serving the passive freshness policy and is distinct from the read watermark.

#### Scenario: A visible successful refresh advances the watermark

- **WHEN** Activity is marked read against a successful server snapshot
- **THEN** the read watermark is that snapshot
- **AND** the unread count is zero

#### Scenario: A passive refresh stores the unread count without moving the watermark

- **WHEN** a page write stores a server-provided unread count
- **THEN** the unread count is stored
- **AND** the read watermark is unchanged

#### Scenario: An offline open advances only through cached server time

- **WHEN** Activity is marked read while offline
- **THEN** the unread count is zero
- **AND** the read watermark is the newest creation timestamp in the cache, or the previously stored watermark when that is later

#### Scenario: The device clock never becomes the watermark

- **WHEN** the device clock is set far ahead of or behind server time and Activity state is written by any operation
- **THEN** the stored read watermark is a server-issued value or unchanged, never a device-clock value
