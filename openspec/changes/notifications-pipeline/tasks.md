# Tasks — notifications-pipeline

## 1. Schema & migrations

- [x] 1.1 Promote `calendar_notification_subscription` to an explicit entity mapped onto the existing table (zero DDL); adjust `NotificationSubscription`/`Calendar` relations; verify `npm run db:generate` produces no diff for it
- [x] 1.2 Add `SubscriberCalendarLog` entity: id, subscriptionId (FK cascade), calendarLogId (FK cascade), frequency, createdAt; unique `(subscriptionId, calendarLogId)`; index `(frequency, createdAt)`
- [x] 1.3 Add one-row fan-out cursor entity/table
- [x] 1.4 Add `locale` (`fr|en`, default `fr`) and `timezone` (IANA string, default `Europe/Paris`) columns to `NotificationSubscription`
- [x] 1.5 Generate migration: outbox + cursor tables, `calendar_log(createdAt)` index, locale/timezone columns; seed cursor row to `now()` (no notification storm from pre-existing history)

## 2. Fan-out cron

- [x] 2.1 `notify_fanout` cron processor (`@JobProcessor`, cron, `notifications` queue): single-transaction `INSERT INTO subscriber_calendar_log … SELECT` active subs × logs newer than cursor, `ON CONFLICT DO NOTHING`, advance cursor
- [x] 2.2 Tests: fan-out inserts per (subscription, log) pair; inactive subscriptions skipped; cursor replay idempotent (`ON CONFLICT`); no-op when no new logs; single-transaction atomicity

## 3. DTO & localization plumbing

- [x] 3.1 PUT DTO: `locale` (`@IsIn(['fr','en'])`, optional, default fr) + `timezone` (IANA validation via `Intl.DateTimeFormat` probe, optional, default Europe/Paris); persist through service/repository; controller tests for valid/omitted/invalid values
- [x] 3.2 Regenerate OpenAPI spec (wire contract v2 frozen for epic 04)
- [x] 3.3 Add `date-fns-tz` (v2 line, matching `date-fns ^2.30.0`)
- [x] 3.4 Notification strings dictionary: typed, `fr` + `en`, per-type detail titles + digest text; unit test asserting key parity across locales
- [x] 3.5 Time rendering helper using `formatInTimeZone(date, sub.timezone, …)` with per-locale date-fns locales; tests incl. overseas timezone (e.g. `America/Martinique`) and both locales; notification path no longer imports `date-utils.ts`

## 4. Notifier cleanup & push builders

- [x] 4.1 Delete `EmailNotifier`, `onNewSubscription`, `groups`/`emailpref` payload types; keep `Notifier` interface + `NotifierService` recipient dispatch; `onCalendarChanged` signature takes merged, filtered change set
- [x] 4.2 Extend `FirebaseService.notify` to accept full android/apns/collapseKey blocks; drop `click_action: FLUTTER_NOTIFICATION_CLICK`; keep invalid-token detection + metrics
- [x] 4.3 Detail push builder: `data.action="calendar_changed"`, `data.payload={type,event}` lowercase `type`, tag/`apns-collapse-id` = event uid, stable `aps.threadId`, priority high/10; localized title by type + body with event + localized time
- [x] 4.4 Digest push builder: `data.action="calendar_digest"`, `data.count`, fixed `"schedule-digest"` tag/`apns-collapse-id`/`collapseKey`, priority high/10, localized text
- [x] 4.5 Tests: exact FCM message shapes (detail + digest, both locales), no Flutter relic, collapse fields present

## 5. Drain crons

- [x] 5.1 Shared drain routine parameterized by frequency: transactional loop `SELECT … WHERE frequency=$1 ORDER BY "createdAt" LIMIT 500 FOR UPDATE SKIP LOCKED`, group per subscription, merge `CalendarChange` payloads, `nbDaysAhead` filter (Node-side, dates from json), tier 0/1/2+, enqueue `send_push`, delete drained rows, repeat until empty
- [x] 5.2 Three cron processors: immediately `*/5`, hourly, daily `0 19 * * *` tz Europe/Paris
- [x] 5.3 Tests: batch-until-empty; rows survive until enqueue (crash semantics); zero-changes-after-filter still deletes rows; tiering boundaries (0/1/2+ after filter); nbDaysAhead window edges; SKIP LOCKED concurrency (if test DB honors it — else against real Postgres, see design risk)

## 6. send_push processor

- [x] 6.1 `send_push` job on `notifications` queue: one awaited `FirebaseService.notify`, `JobsOptions` attempts 3 + exponential backoff; invalid-token result sets `isActive=false` and completes without retry
- [x] 6.2 Tests: transient failure retries then failed; invalid token deactivates subscription, no retry

## 7. calendar_log prune

- [x] 7.1 Daily prune cron: batched deletes of `calendar_log` rows older than 1 year
- [x] 7.2 Tests: old rows pruned in batches, recent rows untouched

## 8. Green & docs

- [x] 8.1 Full local green: tsc, lint, jest (server suite)
- [x] 8.2 Update `docs/projects/notifications/00-roadmap.md` status for epic 03
