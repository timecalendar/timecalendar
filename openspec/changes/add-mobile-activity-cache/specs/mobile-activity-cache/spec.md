## ADDED Requirements

### Requirement: Activity history is cached in two dedicated SQLite tables

The application SHALL persist fetched Activity history in an `activity_logs` table holding one row
per server calendar-log record, keyed by the server-issued log id, and SHALL persist device-local
Activity read and pagination state in a singleton `activity_state` row. `activity_logs` SHALL be
indexed on its creation timestamp and on its calendar identifier. Timestamps SHALL be stored as
canonical UTC ISO-8601 text and the structured change payload SHALL be stored as JSON text decoded
defensively by a mapper, never as a column type that throws on a malformed value. Both tables SHALL
be created by an additive committed migration that alters no existing table.

#### Scenario: A fresh installation gains both tables and both indexes

- **WHEN** the committed migration bundle is applied to an empty database
- **THEN** `activity_logs` and `activity_state` exist
- **AND** the creation-timestamp and calendar-identifier indexes on `activity_logs` exist

#### Scenario: An existing installation is upgraded without data loss

- **WHEN** the migration bundle preceding the Activity migration has been applied and every
  pre-existing table holds rows, and the Activity migration is then applied
- **THEN** both Activity tables and both indexes exist
- **AND** every pre-existing row in every pre-existing table is unchanged

### Requirement: Cached Activity rows decode totally and a malformed row never breaks the timeline

Mapping a stored Activity row to its domain value SHALL be total: a row whose stored change payload
is unparseable, null, or not an object SHALL be skipped rather than surfaced or thrown, and a
payload whose change collections are absent or not arrays SHALL degrade those collections to empty
rather than failing the row. When a read skips at least one malformed row the repository SHALL
record the occurrence once for that read through the application's unexpected-failure seam, using a
static context and no row content — no identifiers, event text, calendar names, or stored payload.

#### Scenario: A valid row round-trips

- **WHEN** a valid Activity page is stored and read back
- **THEN** each row's identifier, calendar identity, calendar name, timestamps, and change
  collections match what was written

#### Scenario: One corrupt row does not hide the rest

- **WHEN** the cache holds several valid rows and one row whose stored change payload is not valid
  JSON
- **THEN** reading returns every valid row and omits only the corrupt one
- **AND** the read does not throw

#### Scenario: A malformed row is recorded without content

- **WHEN** a read skips one or more malformed rows
- **THEN** exactly one unexpected-failure record is produced for that read
- **AND** the recorded value contains no identifier, event text, calendar name, or stored payload

### Requirement: Storing an Activity page is one atomic, idempotent, newest-first merge

Storing a fetched Activity page SHALL execute as a single synchronous database transaction that
upserts every row by its server log id, then removes rows older than the retention window, then
removes rows belonging to calendars the device no longer holds, and only then writes the pagination
cursor and refresh metadata. Storing the same page twice SHALL leave the cache identical to storing
it once. If any statement in the transaction fails, the transaction SHALL leave the previously
stored cursor, watermark, and rows unchanged. Reads SHALL return rows ordered newest first, by
creation timestamp descending with the log identifier as a stable tie-breaker.

#### Scenario: Repeating a page changes nothing

- **WHEN** the same page is stored twice
- **THEN** the cache holds one row per log id with the values from the page
- **AND** no row is duplicated

#### Scenario: A page merges into existing history rather than replacing it

- **WHEN** a page is stored into a cache that already holds rows from earlier pages
- **THEN** the earlier rows are still present
- **AND** the new rows are present

#### Scenario: A failed store advances nothing

- **WHEN** a statement inside the page-store transaction fails
- **THEN** the stored pagination cursor and read watermark are unchanged
- **AND** the previously cached rows are unchanged

#### Scenario: Rows read back newest first

- **WHEN** the cache holds rows with different creation timestamps, including two sharing one
  timestamp
- **THEN** the read returns them ordered by creation timestamp descending
- **AND** the two sharing a timestamp are ordered by log identifier descending

### Requirement: Local retention is measured against the latest trusted server snapshot

Local one-year pruning SHALL use the latest trusted server snapshot timestamp — the most recent
server `asOf` the device has stored or is currently storing — and SHALL NOT use the device clock.
The stored server snapshot SHALL only move forward. A device whose clock is wrong SHALL NOT cause
cached history to be pruned or retained differently.

#### Scenario: Pruning uses server time, not device time

- **WHEN** a page is stored with a server snapshot timestamp while the device clock is set far into
  the past or the future
- **THEN** exactly the rows older than one year before the latest trusted server snapshot are
  removed
- **AND** the result does not vary with the device clock

#### Scenario: A stale snapshot does not move the cutoff backwards

- **WHEN** an older page carrying an earlier server snapshot is stored after a newer snapshot has
  already been recorded
- **THEN** the retention cutoff is computed from the later snapshot
- **AND** the stored latest-snapshot value does not move backwards

### Requirement: Removing a calendar removes exactly its Activity history

Removing a held calendar SHALL delete that calendar's Activity rows from the cache and SHALL leave
every other calendar's rows intact. Storing a page SHALL additionally remove rows whose calendar is
no longer among the calendars the device holds, including the case where the device holds no
calendars at all.

#### Scenario: One calendar's history is removed

- **WHEN** the cache holds rows for two calendars and one calendar is removed
- **THEN** only the removed calendar's rows are gone
- **AND** the other calendar's rows are unchanged

#### Scenario: Storing a page evicts rows for calendars no longer held

- **WHEN** a page is stored and the supplied held-calendar set omits a calendar the cache still has
  rows for
- **THEN** those rows are removed in the same transaction

#### Scenario: Holding no calendars empties the cache

- **WHEN** a page is stored with an empty held-calendar set
- **THEN** the cache holds no Activity rows

### Requirement: The read watermark is server time and read state is device-local

The stored read watermark SHALL be a server-issued timestamp supplied by the caller and SHALL NEVER
be a device clock reading. Clearing the locally known unread count SHALL be possible without moving
the watermark, so opening Activity offline clears the badge while a later response can still count
server rows created after the stored watermark. Reading Activity state SHALL be total: when no state
row exists, reading SHALL return documented defaults (no watermark, zero unread, no snapshot, no
cursor, backfill not complete) rather than throwing.

#### Scenario: State reads before any write return defaults

- **WHEN** Activity state is read and no state row has been written
- **THEN** the result reports no watermark, zero unread, no stored cursor, and an incomplete backfill

#### Scenario: Storing a count does not move the watermark

- **WHEN** a page is stored carrying a server unread count
- **THEN** the stored unread count is the server value
- **AND** the stored read watermark is unchanged

#### Scenario: Clearing unread leaves the watermark alone

- **WHEN** the locally known unread count is cleared
- **THEN** the stored unread count is zero
- **AND** the stored read watermark is unchanged

#### Scenario: Marking read stores the supplied server timestamp

- **WHEN** the read watermark is marked with a server timestamp
- **THEN** that exact timestamp is stored as the watermark
- **AND** the stored unread count is zero

### Requirement: The older-page cursor persists and recovers without losing cached rows

The older-page cursor SHALL be written only after the page that produced it has been stored
successfully, and SHALL survive an application restart. Storing an older page SHALL replace the
cursor and SHALL mark the backfill complete when the server reports no further page. Storing a
newest page SHALL adopt a cursor only when no cursor is stored and the backfill is not already
complete, so a routine refresh neither restarts nor re-opens a historical backfill. Resetting the
pagination chain after the server rejects a stored cursor SHALL clear the cursor and the completion
flag and SHALL NOT delete any cached row.

#### Scenario: The first page seeds the cursor

- **WHEN** a newest page is stored into an empty cache with a next cursor
- **THEN** that cursor is stored as the older-page cursor

#### Scenario: A routine refresh preserves a partial backfill

- **WHEN** an older-page cursor is already stored and a newest page is stored carrying a different
  next cursor
- **THEN** the stored older-page cursor is unchanged

#### Scenario: A completed backfill is not re-opened

- **WHEN** the backfill is marked complete and a newest page carrying a next cursor is stored
- **THEN** no older-page cursor is stored
- **AND** the backfill remains complete

#### Scenario: An invalid cursor resets the chain without data loss

- **WHEN** the stored cursor is rejected and the pagination chain is reset
- **THEN** no cursor is stored and the backfill is no longer marked complete
- **AND** every cached Activity row is still present
