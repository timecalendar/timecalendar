# server-notification-fanout Specification

## Purpose
TBD - created by archiving change notifications-pipeline. Update Purpose after archive.
## Requirements
### Requirement: Outbox schema
The system SHALL persist pending notification work in a `subscriber_calendar_log` outbox table with columns `id`, `subscriptionId` (FK to the notification subscription, `ON DELETE CASCADE`), `calendarLogId` (FK to `calendar_log`, `ON DELETE CASCADE`), `frequency`, and `createdAt`, with a unique constraint on `(subscriptionId, calendarLogId)` and an index on `(frequency, createdAt)`. A one-row cursor table SHALL store the global fan-out cursor. `calendar_log` SHALL gain an index on `createdAt`.

#### Scenario: Subscription deleted with pending outbox rows
- **WHEN** a notification subscription is deleted while outbox rows referencing it exist
- **THEN** those outbox rows are removed by the FK cascade and no orphaned rows remain

### Requirement: Fan-out cron with atomic global cursor
A `notify_fanout` cron SHALL, in a single Postgres transaction, insert one outbox row per (active subscription × new `calendar_log` row created since the global cursor) via `INSERT INTO … SELECT … ON CONFLICT DO NOTHING`, stamping each row with the subscription's notification frequency, and advance the cursor to the newest processed `calendar_log.createdAt`. Fan-out MUST NOT run inside the calendar sync/detection path.

#### Scenario: New calendar logs since cursor
- **WHEN** the fan-out cron runs and `calendar_log` rows newer than the cursor exist for a calendar with two active subscriptions
- **THEN** one outbox row per (subscription, log) pair is inserted and the cursor advances, all committed in one transaction

#### Scenario: Cursor replay is idempotent
- **WHEN** the cron re-processes logs already fanned out (e.g., crash after insert but before commit, then rerun)
- **THEN** `ON CONFLICT DO NOTHING` on `(subscriptionId, calendarLogId)` prevents duplicate outbox rows and the run completes without error

#### Scenario: No new logs
- **WHEN** the fan-out cron runs and no `calendar_log` row is newer than the cursor
- **THEN** no outbox rows are written and the cursor is unchanged

### Requirement: Frequency attribution at fan-out time
Outbox rows SHALL record the subscription's frequency as of fan-out time; changes are attributed to subscriptions active at that moment (cursor lag of at most one tick is acceptable).

#### Scenario: Inactive subscription
- **WHEN** the fan-out cron runs and a calendar's subscription is inactive (`isActive = false`)
- **THEN** no outbox row is created for that subscription

