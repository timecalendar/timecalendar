# server-notification-delivery Specification

## Purpose
TBD - created by archiving change notifications-pipeline. Update Purpose after archive.
## Requirements
### Requirement: Frequency-tiered drain crons
Three drain crons SHALL drain the outbox per frequency tier: immediately (every 5 minutes), hourly, and daily at 19:00 Europe/Paris. Each run SHALL loop over batches selected with `SELECT … WHERE frequency = $1 ORDER BY createdAt LIMIT 500 FOR UPDATE SKIP LOCKED`, group rows per subscription, merge that subscription's changes, and continue until the tier is empty.

#### Scenario: Batch drain until empty
- **WHEN** an hourly drain runs with 1200 pending hourly rows
- **THEN** the cron processes them in batches of at most 500 until no hourly rows remain

#### Scenario: Concurrent drain safety
- **WHEN** two drain runs of the same tier overlap
- **THEN** `FOR UPDATE SKIP LOCKED` ensures each outbox row is processed by at most one run

### Requirement: Delete-on-enqueue at-least-once semantics
Drained outbox rows SHALL be deleted only after the corresponding `send_push` job has been enqueued (`queue.add()` returned). There SHALL be no status column on the outbox. A crash between enqueue-decision and delete re-drains the rows on the next run (duplicate push acceptable); a push MUST never be silently lost. Rows that produce no push after filtering SHALL still be deleted.

#### Scenario: Crash before enqueue
- **WHEN** a drain run crashes after selecting rows but before `queue.add()` returns
- **THEN** the rows remain in the outbox and are re-drained on the next run

#### Scenario: Zero changes after filter
- **WHEN** a subscription's merged changes are all filtered out by `nbDaysAhead`
- **THEN** no push is enqueued and the drained rows are still deleted

### Requirement: nbDaysAhead filtering
Before building a push, the drain SHALL filter the merged change items by the subscription's `nbDaysAhead` window, evaluating event dates Node-side (dates live in the `calendar_log` JSON payload).

#### Scenario: Event beyond window
- **WHEN** a change concerns an event starting after `now + nbDaysAhead` days
- **THEN** that change is excluded from the push for that subscription

### Requirement: Push tiering (0 / 1 / 2+)
Per subscription and drain run, the system SHALL build at most one push from the filtered change set: zero changes ⇒ no push; exactly one change ⇒ a detail push; two or more changes ⇒ one summary push ("N changements dans votre emploi du temps" semantics, localized).

#### Scenario: Single change
- **WHEN** a subscription has exactly one filtered change
- **THEN** one detail push is enqueued whose title reflects the change type and whose body names the event with a localized time

#### Scenario: Multiple changes
- **WHEN** a subscription has three filtered changes
- **THEN** exactly one summary push is enqueued with count 3, not three detail pushes

### Requirement: Detail push wire shape (v2)
A detail push SHALL carry `data.action = "calendar_changed"` and `data.payload = {type, event}` with `type` ∈ `new | edit | cancel` (lowercase canonical). It SHALL set Android `notification.tag` and `apns-collapse-id` to the event uid so a later push about the same event replaces the stale one, and a stable `aps.threadId` for iOS grouping. Tapping opens the event details. `click_action: FLUTTER_NOTIFICATION_CLICK` MUST NOT be sent.

#### Scenario: Same event changes twice
- **WHEN** two detail pushes about the same event uid reach a device
- **THEN** the second replaces the first notification (shared tag / apns-collapse-id)

### Requirement: Summary push wire shape (v2)
A summary push SHALL carry `data.action = "calendar_digest"` and `data.count`, with fixed `notification.tag` / `apns-collapse-id` of `"schedule-digest"` and a matching `collapseKey`, so a newer digest replaces the previous one on-device and in the offline queue. Tapping opens the calendar.

#### Scenario: Consecutive digests
- **WHEN** a device receives a second digest push while the first is still displayed or queued
- **THEN** only the newest digest is shown; stale summaries do not accumulate

### Requirement: High delivery priority
All pipeline pushes SHALL be sent with FCM `priority: high` and `apns-priority: 10`.

#### Scenario: Push sent
- **WHEN** any detail or summary push is dispatched to FCM
- **THEN** the message carries Android priority `high` and APNs priority `10`

### Requirement: send_push processor
A `send_push` job on the `notifications` queue SHALL make exactly one awaited FCM call per job, configured with 3 attempts and exponential backoff before landing in failed. When FCM reports an invalid token (`registration-token-not-registered`), the processor SHALL set `isActive = false` on the subscription and MUST NOT retry.

#### Scenario: Transient FCM failure
- **WHEN** the FCM call fails with a transient error
- **THEN** the job retries with exponential backoff up to 3 attempts, then moves to failed

#### Scenario: Invalid token
- **WHEN** FCM returns `registration-token-not-registered` for a subscription's token
- **THEN** the subscription is deactivated (`isActive = false`) and the job completes without retrying

### Requirement: Notifier seam preserved
The `Notifier` interface and `NotifierService` recipient dispatch SHALL be kept as the multi-channel seam; `onCalendarChanged` SHALL receive the merged, filtered change set so each channel formats its own output. `EmailNotifier`, the `new_subscription` action, and the legacy `groups`/`emailpref` payload types SHALL be removed.

#### Scenario: Future channel addition
- **WHEN** a new channel implementation of `Notifier` is registered
- **THEN** it receives merged, filtered change sets without any change to the fan-out/drain pipeline

