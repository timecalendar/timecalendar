# Notifications pipeline

## Why

Change detection persists `CalendarLog` rows and FCM subscriptions are stored, but no code path connects them: `NotifierService`/`FcmNotifier` have zero callers, so users never receive pushes. This change builds the missing delivery pipeline (epic 03 of the notifications project) with at-least-once semantics, now that epic 02 delivered reliable queues (`SharedQueueModule`, retries, the `notifications` queue).

## What Changes

- New `subscriber_calendar_log` outbox table + one-row global cursor table; a `notify_fanout` cron atomically (single Postgres transaction) inserts subscription × new-log rows since the cursor and advances it.
- Three drain crons — immediately (`*/5`), hourly, daily (19:00 Europe/Paris) — batch-drain the outbox per frequency with `FOR UPDATE SKIP LOCKED`, merge changes per subscription, filter by `nbDaysAhead`, and enqueue at most one push per subscription; rows are deleted only after `queue.add()` returns (delete-on-enqueue, no status column).
- `send_push` job on the `notifications` queue: one awaited FCM call, attempts 3 with exponential backoff; an invalid-token result deactivates the subscription (`isActive = false`).
- **BREAKING** (wire contract v2 — mobile has zero users, breaking is free): detail push `data.action = "calendar_changed"` with lowercase `type` ∈ `new | edit | cancel`, per-event collapse (`notification.tag` / `apns-collapse-id` = event uid, stable `aps.threadId`); 2+ changes collapse into ONE replaceable summary push `data.action = "calendar_digest"` with fixed `"schedule-digest"` collapse keys; `priority: high`. `click_action: FLUTTER_NOTIFICATION_CLICK` dropped.
- `NotificationSubscription` gains `locale` (`fr | en`, default `fr`) and `timezone` (IANA, default `Europe/Paris`), exposed in the PUT DTO and regenerated OpenAPI; notification strings come from a plain two-locale server dictionary; times rendered with `date-fns-tz` `formatInTimeZone` (replacing server-local-time formatting on the notification path).
- Join table `calendar_notification_subscription` promoted to a real entity (zero DDL) so the fan-out `INSERT…SELECT` is typed; new index `calendar_log(createdAt)`.
- Notifier cleanup: delete `EmailNotifier`, the `new_subscription` action, and legacy payload types (`groups`/`emailpref`); **keep** the `Notifier` interface and `NotifierService` recipient dispatch as the future multi-channel seam.
- Daily `calendar_log` prune job: batched deletes of rows older than 1 year (caps in-app change history at 1 year).

## Capabilities

### New Capabilities

- `server-notification-fanout`: the outbox — `notify_fanout` cron, global cursor over `calendar_log(createdAt)`, atomic cursor-advance + `INSERT … ON CONFLICT DO NOTHING`, idempotence on replay.
- `server-notification-delivery`: drain crons (three frequencies, SKIP LOCKED batching, per-subscription merge, `nbDaysAhead` filter, 0/1/2+ push tiering), push message shapes (detail + digest, collapse semantics), `send_push` processor, invalid-token deactivation.
- `server-notification-localization`: `locale`/`timezone` on subscriptions (DTO + entity + OpenAPI), the notification strings dictionary, timezone-correct time rendering.
- `server-calendar-log-retention`: the daily 1-year prune job for `calendar_log`.

### Modified Capabilities

<!-- none — no existing server spec covers the notifier/subscription requirements being changed; mobile-side specs (mobile-fcm-*) are updated by epic 04 against the frozen v2 contract -->

## Impact

- `server` repo only. Modules touched: `notifier` (cleanup + new push builders), `notification-subscription` (entity/DTO/join-table promotion), `calendar-log` (index, prune), new fan-out/drain crons, `send_push` processor on the `notifications` queue (epic 02 deliverable).
- DB migrations: outbox table, cursor table, `calendar_log(createdAt)` index, `locale`/`timezone` columns.
- New dependency (if absent): `date-fns-tz`.
- OpenAPI spec regenerated — the mobile client (epic 04) is generated from it; the v2 wire contract is frozen by this change.
- Deleted surface: `EmailNotifier`, `new_subscription` action, `groups`/`emailpref` payload types, `FLUTTER_NOTIFICATION_CLICK`.
