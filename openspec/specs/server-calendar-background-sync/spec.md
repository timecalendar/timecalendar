# server-calendar-background-sync Specification

## Purpose
TBD - created by archiving change refactor-server-queue. Update Purpose after archive.
## Requirements
### Requirement: Fan-out cron enqueues one job per due calendar
The server SHALL run a `sync_calendars_fanout` cron job every 5 minutes on the `sync` queue that selects due calendars (last updated more than 30 minutes ago, accessed within the inactivity window) as an IDs-only projection and enqueues one `sync_calendar { calendarId }` job per calendar via `addBulk`.

#### Scenario: Due calendars are enqueued
- **WHEN** the fan-out cron runs and calendars are due for sync
- **THEN** one `sync_calendar` job per due calendar is added to the `sync` queue with `jobId` equal to the calendar id

#### Scenario: Inactive calendars are skipped
- **WHEN** a calendar's `lastAccessedAt` is older than the inactivity window (14 days)
- **THEN** the fan-out does not enqueue a job for it

#### Scenario: Already-queued calendar is not enqueued twice
- **WHEN** the fan-out runs while a `sync_calendar` job for the same calendar id is still pending in the queue
- **THEN** the duplicate add is a no-op (`jobId` dedup) and the calendar has at most one pending job

### Requirement: Per-calendar sync job with retry semantics
The `sync_calendar` job SHALL fetch, diff, and persist exactly one calendar, and SHALL be configured with `attempts: 3` and exponential backoff so a failing sync is retried before being marked permanently failed. Completed `sync_calendar` jobs SHALL be removed from Redis immediately and failed ones after a retention shorter than the due cycle, so a stored job never blocks a future due calendar from being re-enqueued.

#### Scenario: Transient failure is retried
- **WHEN** a `sync_calendar` job throws (e.g. the iCal source times out)
- **THEN** BullMQ retries it with exponential backoff up to 3 attempts before marking it failed

#### Scenario: Calendar deleted between fan-out and processing
- **WHEN** a `sync_calendar` job runs for a calendar id that no longer exists
- **THEN** the job completes without error and without side effects

#### Scenario: Failed job does not block the next cycle
- **WHEN** a calendar's job exhausted its attempts and the calendar becomes due again
- **THEN** the next fan-out run enqueues a fresh `sync_calendar` job for it

### Requirement: Change detection is atomic with content persistence
When syncing an existing calendar, the server SHALL compute the event diff and persist the new calendar content and the resulting `CalendarLog` row within a single database transaction, invoked as a direct service call (no event emitter). No `calendar.content.updated` application event SHALL exist.

#### Scenario: Change is recorded atomically
- **WHEN** a sync of an existing calendar detects event changes
- **THEN** the new content and the `CalendarLog` row are committed together — a crash mid-sync leaves either both or neither

#### Scenario: Retry after mid-sync crash still detects the change
- **WHEN** a `sync_calendar` job fails after fetching but before commit and is retried
- **THEN** the retry re-diffs old-vs-new (the old content was not overwritten) and records the change

#### Scenario: No-change sync writes no log
- **WHEN** a sync produces an identical event set
- **THEN** no `CalendarLog` row is written

### Requirement: User-triggered sync stays synchronous
`POST /sync-calendars` (the user-facing sync of a user's own calendars) SHALL keep its synchronous request-path shape — syncing the requested calendars before responding — without routing through the background queue.

#### Scenario: User sync responds with synced calendars
- **WHEN** a user requests a sync of their calendar tokens
- **THEN** the calendars are synced within the request and the response contains the up-to-date public calendars

