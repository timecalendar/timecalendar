# Notifications pipeline — design

## Context

Change detection writes `CalendarLog` rows (`calendarChange` json: `oldItems[]`, `newItems[]`, `changedItems[{old,new}]`) inside the sync transaction, and `PUT /notification-subscription` stores subscriptions — but `NotifierService`/`FcmNotifier` have zero callers. Epic 02 delivered the queue substrate this pipeline assumes: `SharedQueueModule` (`@lyrolab/nest-shared`) with named queues (`config/queues.ts` already defines `NOTIFICATIONS_QUEUE = "notifications"`), `@JobProcessor({ name, queue, cron })` processors, and per-job `JobsOptions` (see `syncCalendarJobOptions`: attempts 3, exponential backoff).

Constraints:

- At-least-once end-to-end; duplicate ≫ miss for push.
- Mobile has zero users: the wire contract can break freely; epic 04 targets whatever this change freezes.
- `date-utils.ts` formats in server-local time (UTC in Docker) with a hardcoded FR locale — wrong for rendered times and unusable for `en` subscribers; the notification path must not use it.
- Join table `calendar_notification_subscription` exists only as an implicit `@JoinTable` — the fan-out `INSERT…SELECT` needs a typed entity over it.

## Goals / Non-Goals

**Goals:**

- Connect `calendar_log` to FCM pushes with at-least-once semantics via an outbox.
- Freeze wire contract v2 (detail + digest shapes, collapse semantics, locale/timezone fields).
- Localized, timezone-correct notification text (fr/en, IANA timezone per subscription).
- Retire dead email/legacy surface while keeping the `Notifier` multi-channel seam.
- Bound `calendar_log` growth (1-year prune).

**Non-Goals:**

- Email channel or web-originated subscriptions (interface kept, nothing built).
- Per-user digest send times / per-timezone daily cron (daily fires 19:00 Europe/Paris for all).
- Client-side (notifee) grouping/summary rendering; change-history UI.
- Event-driven fast path (sync cadence dominates latency; cron drain is enough).

## Decisions

### D1 — Outbox with global cursor, fan-out in a cron (not the detection path)

`notify_fanout` cron: one Postgres transaction runs `INSERT INTO subscriber_calendar_log … SELECT` (active subscriptions × `calendar_log` rows newer than the cursor, joined through `calendar_notification_subscription`) `ON CONFLICT DO NOTHING`, then advances the one-row cursor to the max processed `createdAt`. Atomic commit ⇒ no loss, no duplicates, zero coupling to sync.

- *Why not per-subscription watermarks:* they scan every subscription every tick regardless of activity; outbox cost scales with actual change events (zero at night). Calendars are per-user (~1–2 subscribers), so fan-out writes are cheap.
- *Why not fan-out inside detection:* couples push delivery to the sync transaction and spreads cursor state across workers.
- *Escape hatch:* if calendar URL dedup ever ships (subscribers-per-calendar ≫ 50), switch to per-calendar outbox rows expanded at drain time.
- Cursor ties to `calendar_log(createdAt)` — new global index (existing index is `(calendar, createdAt)`, unusable for a global scan).
- **Safety lag**: each tick's upper bound is `now() - 60s`, not `now()`. A sync transaction stamps `createdAt` at INSERT but the row is only visible at COMMIT; scanning right up to `now()` could advance the cursor past a still-in-flight row and lose it. The lag assumes no writing transaction lives longer than 60s. All time arithmetic runs DB-side (`now()` is constant within the transaction and shares the clock of the `createdAt` default) — no app/DB clock skew.
- Fan-out cron runs every minute (cheap: one indexed scan, zero rows at night); the missing-cursor case (fresh environment) self-initializes to `now()` so pre-existing history never storms.

### D2 — Delete-on-enqueue, no status column

Drain deletes outbox rows only after `queue.add()` returns. Crash before delete ⇒ re-drain ⇒ duplicate push (acceptable), never a lost one. A status column would turn the outbox into a second queue needing reconciliation with BullMQ.

### D3 — Drain shape: three crons, SKIP LOCKED batches, merge in Node

Three `@JobProcessor` crons on the `notifications` queue — `*/5 * * * *`, hourly, and daily — share one drain routine parameterized by frequency. The scheduler (`nest-shared`) has no cron timezone support, so daily-19:00-Europe/Paris is expressed as `0 17,18 * * *` (both candidate UTC hours across DST) plus a Paris-local-hour guard in the processor: loop `SELECT … WHERE frequency = $1 ORDER BY "createdAt" LIMIT 500 FOR UPDATE SKIP LOCKED` in a transaction, group by subscription, merge the `CalendarChange` payloads, filter by `nbDaysAhead` Node-side (event dates live in the json — not queryable in SQL), tier 0/1/2+, enqueue `send_push`, delete drained rows, commit, repeat until empty. SKIP LOCKED makes overlapping runs safe (each row processed once per drain pass).

### D4 — Push building behind the kept Notifier seam

`NotifierService` keeps recipient dispatch; `FcmNotifier.onCalendarChanged` receives the merged, filtered change set and builds 0..1 message. `EmailNotifier`, `onNewSubscription`, and `groups`/`emailpref` payload types are deleted. Wire shapes:

- Detail (1 change): `data.action = "calendar_changed"`, `data.payload = {type, event}`, `type` ∈ `new | edit | cancel` (lowercase canonical — replaces the current `DifferenceType` casing at the wire boundary). `android.notification.tag` = event uid, `apns.headers["apns-collapse-id"]` = uid, stable `aps.threadId` ⇒ later push about the same event replaces the stale one.
- Digest (2+): `data.action = "calendar_digest"`, `data.count`; fixed tag/`apns-collapse-id` `"schedule-digest"` + `collapseKey` ⇒ newest digest replaces older, on-device and in the offline queue. (FCM can't build an Android group summary server-side — verified against firebase-admin's API surface; one replaceable summary is the correct primitive. Replacement re-alerts on Android; acceptable, notifee client rendering is the future fix.)
- `priority: high` / `apns-priority: 10` everywhere (lower tiers get throttled/dropped).
- `FirebaseService.notify` message-shape extension required: current shape hardcodes `notification/data/android.priority/token` and injects `click_action: FLUTTER_NOTIFICATION_CLICK` — it must accept full android/apns blocks and drop the Flutter relic.
- Known platform limits accepted: Android ≤4 active collapse keys per device; offline iOS keeps only the newest push per app.

### D4b — Delivery job lives in the notifier module

`FcmNotifier.onCalendarChanged` builds the 0..1 push and enqueues `send_push`; the `send_push` processor also lives in the notifier module (it is the FCM channel's delivery leg), keeping the pipeline module purely outbox mechanics. Invalid-token deactivation goes through `NotificationSubscriptionService.deactivateSubscription` — the architecture lint forbids injecting repositories (or `DataSource`) across modules.

### D5 — send_push processor: one awaited call

`@JobProcessor({ name: "send_push", queue: NOTIFICATIONS_QUEUE })`, `JobsOptions` = attempts 3, exponential backoff (mirror `syncCalendarJobOptions`). One awaited `FirebaseService.notify` per job. Invalid token (`messaging/registration-token-not-registered`, already detected at `firebase.service.ts:35`) ⇒ set `isActive = false` on the subscription, complete without retry. No upfront token validation on subscribe: dead tokens age out via this path + mobile re-PUTs on every app start.

### D6 — Localization: plain dictionary + date-fns-tz

- `NotificationSubscription` gains `locale` (`fr | en`, default `fr`) and `timezone` (IANA, default `Europe/Paris`); PUT DTO validated (`@IsIn`, IANA check via `Intl.DateTimeFormat` probe); OpenAPI regenerated (mobile client generated from it, epic 04). Overseas French schools make timezone real data, not paranoia.
- Strings: a plain typed dictionary, two locales, a handful of keys. No i18n framework. Bodies render an absolute localized date ("mercredi 1 janvier de 11:00 à 12:00"), not relative words — relative rendering needs tz-correct "today" boundaries per subscription for marginal value.
- Time rendering: `date-fns-tz` `formatInTimeZone(date, sub.timezone, …)` with per-locale date-fns locale objects. Add `date-fns-tz` pinned to the v2 line to match `date-fns ^2.30.0`. `date-utils.ts` untouched elsewhere; the notification path stops using it.

### D7 — Join-table promotion + schema (zero behavior DDL)

Promote `calendar_notification_subscription` to an explicit entity mapped onto the existing table (no DDL) so the fan-out `INSERT…SELECT` is typed. New tables: `subscriber_calendar_log (id, subscriptionId FK cascade, calendarLogId FK cascade, frequency, createdAt)`, unique `(subscriptionId, calendarLogId)`, index `(frequency, createdAt)`; one-row cursor table. Migrations via the existing TypeORM flow (`npm run db:generate`, verify the generated diff doesn't try to recreate the promoted join table).

### D8 — Prune job

Daily cron deletes `calendar_log` rows older than 1 year in bounded batches (`DELETE … WHERE id IN (SELECT … LIMIT n)` loop). Outbox FKs cascade, but pending outbox rows are at most days old — pruning never races live deliveries. History capped at 1 year; shrink later if storage says so.

### D9 — Cleanup fallout

- `mailer-template.model.ts` decouples from notifier payload types (generic `{ template, data }`) — MailerService stays as future-channel infrastructure.
- The generated OpenAPI spec strips `/queue/add` (nest-shared's dev/admin QueueController) alongside the existing `/health` strip — not part of the mobile wire contract.

## Risks / Trade-offs

- [Duplicate pushes on crash between enqueue and delete] → inherent to at-least-once; collapse keys (uid / `"schedule-digest"`) make most duplicates replace rather than stack. Accepted.
- [Postgres-specific SQL (`ON CONFLICT`, `FOR UPDATE SKIP LOCKED`) vs the shared in-memory test DB] → fan-out/drain tests must run against a DB that honors these semantics; if the `typeorm-test-module` backend doesn't, run these suites against real Postgres (compose service already exists for dev). Resolve at implementation time, first task of testing.
- [Daily 19:00 Europe/Paris for everyone] → outre-mer users get a shifted local hour. Deliberate scope cut; revisit with real overseas usage.
- [Fan-out attributes changes to subscriptions active at drain of the fan-out tick, not detection time] → cursor lag ≤ one tick. Accepted.
- [Digest replacement re-alerts on Android] → accepted; notifee client-side rendering is the future fix if users complain.
- [Cursor is global: one slow/failed fan-out tick delays all notifications] → cron retries next tick; idempotent replay makes this safe, only latency suffers.

## Migration Plan

1. Migrations (outbox, cursor, `calendar_log(createdAt)` index, `locale`/`timezone` columns) ship with the code; `RUN_MIGRATIONS` applies them on deploy.
2. Cursor row seeded at migration time to `now()` — pre-existing `calendar_log` history must not fan out as a notification storm on first tick.
3. No compatibility window: mobile is undeployed; epic 04 targets the frozen contract.
4. Rollback: crons/processors are additive; reverting the deploy stops the pipeline, outbox rows accumulate harmlessly and drain on redeploy (or get cascade-deleted).

## Open Questions

- None blocking. Drain batch transaction granularity (delete per subscription-group vs per 500-batch) is an implementation detail; either satisfies delete-on-enqueue.
