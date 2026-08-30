# mobile-calendar-sync — delta

## MODIFIED Requirements

### Requirement: Sync orchestration fetches over the durable tokens and replaces the local table atomically

The app SHALL provide a sync orchestrator that reads the durable `user_calendars`
subscription tokens, calls `POST /calendars/sync { tokens }` once (batch) over the single
`customFetch` mutator, flattens the returned calendars' events (attaching each parent
`userCalendarId`), maps the DTOs to rows, and replaces the entire `calendar_events` table
with the result. The replace SHALL be transactional (atomic delete-all then bulk-insert)
so a crash mid-replace never leaves a partially-populated table.

After that replace, the orchestrator SHALL converge the local calendar names on the server's:
for each returned `CalendarWithContent`, it SHALL compare `calendar.name` against the name in the
`user_calendars` snapshot it already read at the start of the sync, and SHALL call the narrow
`updateName(id, name)` write for **only** the calendars whose name differs.

The name convergence SHALL NOT `upsert` a `user_calendars` row and SHALL NOT go through
`fromCalendarForPublic`, which hard-codes `visible: true` — a full-row write would silently unhide a
calendar the student hid, on every sync. `visible`, `token`, `createdAt`, `lastUpdatedAt`,
`schoolName` and `schoolId` SHALL be preserved exactly.

#### Scenario: A successful sync replaces the local events

- **WHEN** there are durable tokens and the batch sync returns calendars with events
- **THEN** the orchestrator flattens the events with their parent `userCalendarId`, maps
  them to rows, and replaces all `calendar_events` rows in one transaction (delete-all
  then bulk-insert)
- **AND** the calendar views reactively reflect the new events

#### Scenario: No tokens means no network call

- **WHEN** there are no durable `user_calendars` tokens
- **THEN** the orchestrator is a no-op and issues no sync request (Flutter parity)

#### Scenario: A failed fetch leaves the last-good rows intact

- **WHEN** the batch sync request fails (e.g. offline or a server error)
- **THEN** the existing `calendar_events` rows are unchanged (the drop+replace runs only
  after a successful fetch)
- **AND** the failure surfaces as a recoverable `isError` state, not a thrown crash

#### Scenario: A renamed calendar converges on the server name

- **WHEN** the sync response carries a calendar whose `name` differs from the local row's
- **THEN** `updateName(id, name)` is called for that calendar and the list surfaces re-render with
  the server name

#### Scenario: Convergence preserves a locally hidden calendar

- **WHEN** a locally hidden calendar (`visible: false`) is renamed on the server and synced
- **THEN** its local `name` is updated and its `visible` flag is still `false`
- **AND** no `upsert` of a full `user_calendars` row occurs anywhere on the sync path

#### Scenario: An unchanged name performs no write

- **WHEN** every returned calendar's name matches the local row's name
- **THEN** no `updateName` write is issued

### Requirement: Sync failure observability distinguishes recoverable fetch failure from a local write failure

A sync fetch failure (network/server) SHALL be a recoverable `isError` UI state and SHALL
NOT be reported to Crashlytics (mirroring the read-path posture). A failure of the local
`replaceAll` transaction (a SQLite write failure) SHALL be reported through the `@/firebase`
`recordError` seam (a crash-worthy local-persistence failure) in addition to surfacing an
error.

A failure of the **name-convergence write**, which runs after a successful event replace, SHALL be
caught separately from the replace: it SHALL leave the replaced events in place, SHALL leave the
last-good local names in place, SHALL be reported through the `@/firebase` `recordError` seam under
its own context label (a local SQLite write failure), and SHALL surface the recoverable `isError`
state. It SHALL NOT throw out of the orchestrator, and the next successful sync SHALL retry the
convergence.

#### Scenario: A fetch failure is not recorded

- **WHEN** the batch sync request rejects
- **THEN** the failure surfaces as `isError` and is not sent to `recordError`

#### Scenario: A local replace-transaction failure is recorded

- **WHEN** the `replaceAll` transaction throws (a local SQLite write failure)
- **THEN** the error is reported through `@/firebase` `recordError` and surfaced

#### Scenario: A name-write failure keeps the events and the last-good name

- **WHEN** `replaceAll` succeeds and a subsequent `updateName` write rejects
- **THEN** the newly replaced `calendar_events` rows remain committed
- **AND** the calendar's local name is unchanged
- **AND** the error is reported through `@/firebase` `recordError` under a name-convergence context
  distinct from the replace's, and `isError` is surfaced
