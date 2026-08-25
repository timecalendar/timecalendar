# Project — Calendar-change push notifications

Finish the push-notification feature: tell a student, on their phone, when their
schedule changes (course added, modified, cancelled).

## Where things stand

The feature is half-built on both sides, and the two halves are not connected.

**Mobile (React Native — built, waiting).** The app registers an FCM token, stores the
three notification preferences (frequency, days-ahead horizon, on/off) and PUTs the full
subscription to the server on every relevant change (ADR 027). Tap-routing is implemented
(ADR 028): a change notification opens the affected event; foreground messages trigger a
calendar re-sync. **The RN app has zero deployed users** — every wire contract below can
be broken freely until launch.

**Server (NestJS — detection works, delivery does not exist).**

- Change detection is live: every sync of an existing calendar diffs old vs new events
  (`findEventChanges`: uid matching, content fallback, bad-iCal detection) and persists a
  `CalendarLog` row. Served to the app via `POST /calendar-logs/search`.
- Subscriptions are stored: `PUT /notification-subscription` upserts
  `NotificationSubscription` (+ `FcmNotificationChannel`) with its calendars.
- Sending is dead code: `NotifierService`/`FcmNotifier` exist but have **zero callers**.
  Nothing connects a detected change to a subscriber's token.
- The background sync cron is disabled (`sync-calendars.job.ts` — handler body commented
  out), so even detection only runs when a user opens the app.
- The queue layer silently swallows job errors (`JobRunService`) and never retries
  (no `attempts` configured) — delivery guarantees are impossible on this foundation.

## Target architecture

```
             ┌────────────── SYNC (queue: sync) ──────────────┐
 cron ──▶ sync fan-out ──▶ one sync_calendar job per calendar
             │  fetch iCal → diff → save content + CalendarLog (one tx)
             ▼
        calendar_log  ◀────────────── global cursor ──┐
             │                                        │
             └─▶ notify fan-out cron (one tx):        │
                 INSERT subscriber_calendar_log ──────┘   (outbox)
                          │
        drain crons (immediately */5, hourly, daily 19h):
             batch-drain outbox → nbDaysAhead filter → build pushes
             (1 change = detail push · 2+ = one replaceable summary)
                          │
             one send_push job per push (queue: notifications)
                 one awaited FCM call · 3 attempts · invalid token ⇒ deactivate sub
```

## Key decisions (rationale in the epics)

| Decision | Choice | Epic |
| --- | --- | --- |
| Fan-out storage | Outbox table (`subscriber_calendar_log`), global-cursor fan-out cron, delete-on-enqueue, **no status column** | 03 |
| Delivery semantics | At-least-once; duplicate ≫ miss | 03 |
| Frequencies | 3 drain crons (`*/5`, hourly, daily 19:00 Europe/Paris); "immediately" ≈ within 5 min | 03 |
| Push shape | 1 change → full detail; 2+ → single summary, replaceable via `tag` / `apns-collapse-id` | 03 |
| Channels | FCM only; `Notifier` interface kept so email/web can return later | 03 |
| Locale & timezone | Stored per subscription (`locale` default `fr`, `timezone` IANA default `Europe/Paris`), sent by mobile | 03, 04 |
| Invalid FCM token | Detected at send time → deactivate subscription (no upfront validation) | 03 |
| `calendar_log` retention | 1 year, daily prune job | 03 |
| Detection atomicity | Diff + content save + `CalendarLog` write in one transaction; the `calendar.content.updated` event emitter is removed | 02 |
| Queue foundation | Adopt `@lyrolab/nest-shared` `SharedQueueModule`, evolved to named queues; per-calendar sync jobs replace `pLimit` | 01, 02 |
| Job retries | `attempts: 3`, exponential backoff, then permanently failed and visible | 02 |
| Queue observability | BullMQ native OTel telemetry (traces, via lib passthrough) + OTel counters/duration histogram from queue-event listeners; `job_run` rows for crons + failures only | 01, 02 |

## Epics

See [00-roadmap.md](00-roadmap.md). Order matters: 01 → 02 → 03; 04 can start once 03
freezes the wire contract; 05 is independent and later.

## Scale context

100k+ calendars. Calendars are per-user (no URL dedup) ⇒ ~1–2 subscribers per calendar,
which is what makes the outbox fan-out cheap. Change volume is bursty (morning spikes,
quiet nights); outbox cost scales with actual changes, not with subscriber count.
