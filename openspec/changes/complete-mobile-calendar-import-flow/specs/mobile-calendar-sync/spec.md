## MODIFIED Requirements

### Requirement: Sync orchestration fetches over the durable tokens and replaces the local table atomically

The app SHALL provide one coordinated sync operation that reads the durable `user_calendars`
subscription tokens, calls `POST /calendars/sync { tokens }` once per pass over the single
`customFetch` mutator, flattens the returned calendars' events with each parent
`userCalendarId`, maps the DTOs to rows, and replaces the entire `calendar_events` table with the
result. The replace SHALL be transactional (atomic delete-all then bulk-insert) so a crash
mid-replace never leaves a partially populated table.

Sync passes SHALL be serialized across every hook instance and trigger. An ordinary trigger SHALL
join the active pass. A `freshAfterCurrent` trigger SHALL queue at most one coalesced follow-up that
starts after the active pass settles, reads the token store anew, and owns the next replace. The
follow-up SHALL still run if the older pass failed. No older response SHALL commit after a newer
pass and erase events for a token added in between.

After a successful replace, the operation SHALL converge local calendar names on the server's: for
each returned `CalendarWithContent`, it SHALL compare `calendar.name` against the name in the
`user_calendars` snapshot read for that pass and SHALL call the narrow `updateName(id, name)` write
only for calendars whose name differs.

Name convergence SHALL NOT `upsert` a `user_calendars` row and SHALL NOT go through
`fromCalendarForPublic`, which hard-codes `visible: true`. `visible`, `token`, `createdAt`,
`lastUpdatedAt`, `schoolName`, and `schoolId` SHALL be preserved exactly.

The operation SHALL return a discriminated outcome that distinguishes events-ready (including
whether name convergence is stale), no held calendars, and failure before event commit. Existing
hook consumers SHALL continue to receive `isSyncing` and recoverable `isError` state derived from
that outcome. A name-convergence failure SHALL keep `isError` for existing refresh surfaces while
still reporting that events are ready to an import-result consumer.

#### Scenario: A successful sync replaces the local events

- **WHEN** there are durable tokens and the batch sync returns calendars with events
- **THEN** the operation flattens the events with their parent `userCalendarId`, maps them to rows, and replaces all `calendar_events` rows in one transaction
- **AND** it returns an events-ready outcome and calendar views reactively reflect the committed events

#### Scenario: A valid empty response is ready

- **WHEN** a successful batch response contains no events
- **THEN** the operation atomically commits an empty `calendar_events` set
- **AND** it returns events-ready rather than classifying the empty timetable as a failure

#### Scenario: No tokens means no network call

- **WHEN** there are no durable `user_calendars` tokens
- **THEN** the operation returns the no-held-calendars outcome and issues no sync request

#### Scenario: A failed fetch leaves the last-good rows intact

- **WHEN** the batch sync request fails due to a read, network, or server error
- **THEN** the existing `calendar_events` rows are unchanged because drop+replace did not start
- **AND** the operation returns a recoverable pre-commit failure and the hook surfaces `isError`

#### Scenario: Ordinary concurrent triggers join one pass

- **WHEN** startup, foreground, notification, Home, or Calendar requests sync while a pass is active
- **THEN** they observe the active pass instead of starting overlapping fetch/write chains
- **AND** Activity refresh and local replace side effects execute at most once for that pass

#### Scenario: A fresh trigger queues behind an older snapshot

- **WHEN** a `freshAfterCurrent` request arrives after durable tokens changed while an older pass is active
- **THEN** one follow-up pass starts after the older pass settles and reads the current tokens
- **AND** the caller receives the follow-up outcome rather than the older pass outcome

#### Scenario: A renamed calendar converges on the server name

- **WHEN** the sync response carries a calendar whose `name` differs from the local row's
- **THEN** `updateName(id, name)` is called for that calendar and list surfaces re-render with the server name

#### Scenario: Convergence preserves a locally hidden calendar

- **WHEN** a locally hidden calendar (`visible: false`) is renamed on the server and synced
- **THEN** its local `name` is updated and its `visible` flag is still `false`
- **AND** no `upsert` of a full `user_calendars` row occurs anywhere on the sync path

#### Scenario: An unchanged name performs no write

- **WHEN** every returned calendar's name matches the local row's name
- **THEN** no `updateName` write is issued

#### Scenario: Name convergence cannot revoke event readiness

- **WHEN** `replaceAll` commits and a subsequent `updateName` write fails
- **THEN** the outcome reports events ready with stale metadata and the hook surfaces `isError`
- **AND** the committed events remain eligible for import success

## ADDED Requirements

### Requirement: Import finalization requires a post-persistence sync pass
The calendar-import result SHALL invoke the shared operation with `freshAfterCurrent` only after
the imported `user_calendars` row commits. It SHALL interpret events-ready as success, including a
valid empty event set or stale-name warning, and SHALL interpret no-held-calendars or pre-commit
failure as recoverable finalization failure.

#### Scenario: Older startup response cannot win
- **WHEN** startup sync captured the old token set and import commits a new token before startup settles
- **THEN** import queues a pass that reads the new token set after startup settles
- **AND** the import pass performs the last event-table replace before success is shown

#### Scenario: Import success follows the SQLite commit
- **WHEN** the import-triggered pass resolves its server response
- **THEN** the result remains loading until transactional `replaceAll` resolves
- **AND** only an events-ready outcome can select terminal success

#### Scenario: Import retry does not recreate identity
- **WHEN** the import-triggered pass returns no-held-calendars or a pre-commit failure
- **THEN** the result exposes retry through another `freshAfterCurrent` pass
- **AND** it does not invoke the calendar-source create, resolve, or upsert operation
