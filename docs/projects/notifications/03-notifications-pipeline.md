# Epic 03 — Notifications pipeline

Repo: `server`. Depends on epic 02. The core of the project: connect detected calendar
changes to FCM pushes.

## Why

Change detection persists `CalendarLog` rows and subscriptions are stored, but no code
path connects them: `NotifierService`/`FcmNotifier` have zero callers. This epic builds
the missing delivery pipeline with at-least-once semantics.

## Architecture

```
calendar_log ──▶ notify_fanout cron (one tx):
                   INSERT INTO subscriber_calendar_log
                   SELECT subs × new logs since global cursor
                   ON CONFLICT DO NOTHING; advance cursor
                          │
                 drain crons — immediately (*/5) · hourly · daily (19:00 Europe/Paris)
                   loop: SELECT … WHERE frequency = $1
                         ORDER BY createdAt LIMIT 500 FOR UPDATE SKIP LOCKED
                   → merge changes per subscription
                   → filter items by nbDaysAhead (Node-side; dates live in the json)
                   → build 0..1 push per subscription (see shape below)
                   → queue.add send_push per push → DELETE drained rows → next batch
                          │
                 send_push job (queue: notifications):
                   ONE awaited FCM call · attempts 3, exp backoff, then failed
                   invalid-token result ⇒ isActive = false on the subscription
```

### Why an outbox (and this exact shape)

- Calendars are per-user (~1–2 subscribers each), so fan-out writes are cheap; outbox
  cost scales with actual change events (zero at night), whereas a per-subscription
  watermark scans every subscription every tick regardless of activity.
- Fan-out runs in a **cron with a global cursor** over `calendar_log(createdAt)`, not in
  the detection path: cursor advance + outbox INSERT commit atomically in one Postgres
  transaction — no loss, no duplicates, zero coupling to sync.
- **Delete-on-enqueue, no status column.** Rows are deleted only after `queue.add()`
  returns; a crash before that re-drains (duplicate push, acceptable), never loses. A
  status column would make the outbox a second queue needing reconciliation with BullMQ.
- Escape hatch if calendar URL dedup ever ships (subscribers-per-calendar ≫ 50): switch
  to per-calendar outbox rows expanded to subscribers at drain time.

## Push shape (wire contract v2 — mobile has zero users, breaking is free)

| Situation (after nbDaysAhead filter) | Push | Tap |
| --- | --- | --- |
| 1 change | Detail: title by type ("Cours annulé"…), body = event + localized time | event details |
| 2+ changes | ONE summary: "N changements dans votre emploi du temps" | calendar |
| 0 changes | no push (drained rows still deleted) | — |

- Detail push: `data.action = "calendar_changed"`, `data.payload = {type, event}` with
  `type` ∈ `new | edit | cancel` (**lowercase is canonical**). Android
  `notification.tag` = event uid + `apns-collapse-id` = uid ⇒ a later push about the
  same event replaces the stale one. Stable `aps.threadId` groups them on iOS.
- Summary push: `data.action = "calendar_digest"`, `data.count`. Fixed
  `tag`/`apns-collapse-id` (`"schedule-digest"`) + `collapseKey` ⇒ a newer digest
  replaces the previous one on the device and in the offline queue; users never
  accumulate stale summaries. (FCM cannot build an Android group summary server-side —
  verified against firebase-admin's API surface — so one replaceable summary is the
  correct primitive. Replacement re-alerts on Android; acceptable, client-side notifee
  rendering is the future fix if users complain.)
- `priority: high` / `apns-priority 10` (lower priorities get throttled/dropped).
- Known constraints: Android ≤4 active collapse keys per device; offline iOS stores only
  the single newest push per app.

## Localization & timezone

- `NotificationSubscription` gains `locale` (`fr | en`, default `fr`) and `timezone`
  (IANA string, default `Europe/Paris`) — both in the PUT DTO, sent by mobile (epic 04).
  Some French schools are overseas (outre-mer): timezone is real data, not paranoia.
- Notification strings: a plain server-side dictionary (two locales, a handful of keys).
  No i18n framework.
- Time formatting via `date-fns-tz` `formatInTimeZone(date, sub.timezone, …)`. The
  current `date-utils.ts` formats in **server-local time (UTC in Docker)** — every
  rendered time would be wrong by 1–2h; this epic replaces it on the notification path.

## Cleanups riding along

- Delete `EmailNotifier`, the `new_subscription` action, and their legacy payload types
  (`groups`/`emailpref`). **Keep** the `Notifier` interface and `NotifierService`'s
  recipient dispatch — email/web channels can return as new implementations without
  touching the pipeline. `onCalendarChanged` receives the merged, filtered change set so
  each future channel formats its own way.
- Drop `click_action: FLUTTER_NOTIFICATION_CLICK` (Flutter-era relic).
- `calendar_log` prune job: daily, deletes rows older than **1 year** (batched deletes).
  Consequence: in-app change history is capped at 1 year. Shrink later if storage says so.
- No upfront FCM token validation on subscribe: `FirebaseService.notify` already detects
  `registration-token-not-registered`; the send path deactivates the subscription, and
  mobile re-PUTs on every app start, so dead tokens age out.

## Out of scope

- Email channel, web-originated subscriptions (interface kept, nothing built).
- Per-user digest send times; per-timezone daily cron. Decided: daily fires 19:00
  Europe/Paris for everyone; an outre-mer user gets it at a shifted local hour. Revisit
  only with real overseas usage.
- Client-side (notifee) notification grouping/summary rendering.
- Change-history UI changes in the app.

## Decisions

- At-least-once end-to-end; duplicate ≫ miss for push.
- "Immediately" means "within ~5 min" (drain cadence). End-to-end latency is dominated by
  the 0–30 min sync cadence anyway; no event-driven fast path.
- Fan-out attributes changes to subscriptions active at drain time (cursor lag ≤ one
  tick) — fine.
- Schema: `subscriber_calendar_log (id, subscriptionId FK cascade, calendarLogId FK
  cascade, frequency, createdAt)`, unique `(subscriptionId, calendarLogId)`, index
  `(frequency, createdAt)`. One-row cursor table. New global index
  `calendar_log(createdAt)`. Join table `calendar_notification_subscription` promoted to
  a real entity (zero-DDL) so the fan-out INSERT…SELECT is typed.

## Tasks

1. Migrations: outbox table, cursor table, `calendar_log(createdAt)` index,
   `locale`/`timezone` columns, join-table entity promotion.
2. `notify_fanout` cron (cursor tx).
3. Drain crons ×3 (batched SKIP LOCKED loop, merge, nbDaysAhead filter, tiering).
4. Push builders: detail + summary shapes (localized strings dictionary,
   `formatInTimeZone`), exact FCM message shapes as specified above.
5. `send_push` processor: single awaited call, invalid-token deactivation.
6. DTO + entity: `locale`, `timezone`; OpenAPI regenerated (mobile client comes from it).
7. Notifier cleanup (email deletion, interface kept, payload types trimmed).
8. `calendar_log` prune job.
9. Tests: fan-out idempotence (cursor replay ⇒ ON CONFLICT), drain crash semantics
   (rows survive until enqueue), tiering boundaries (0/1/2+ after filter), locale/tz
   rendering, invalid-token deactivation.
