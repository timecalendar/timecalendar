# Design — Refactor server queue foundation

## Context

The server's queue stack is three layers deep: `SharedBullModule.forRoot()` (nest-shared, Redis connection only), a custom `modules/queue` (a single `default` queue, `QueueService.register` job registry, `DefaultQueueProcessorService` worker gated by `ENABLE_QUEUE`), and `modules/job-run` (`JobRunService.run`, a try/catch wrapper that logs and **swallows** every handler error). Exactly one job exists: the `sync_calendars` cron, whose handler body is commented out. Change detection is an unawaited `emitAsync("calendar.content.updated")` from `CalendarSyncService.saveCalendar` to `DetectCalendarChangeService.@OnEvent`, so a crash between content save and log write loses the change forever (a retry re-diffs new-vs-new). Bulk sync (`CalendarSyncAllService`) is an in-process `pLimit(10)`.

`@lyrolab/nest-shared` 1.13.0 ships `SharedQueueModule` with named queues, per-queue workers/concurrency, `@JobProcessor({ name, cron?, queue? })` discovery, `QueueService.add`/`addBulk` with job-name→queue routing, per-queue cron scheduler sync with stale cleanup, error rethrow (so `attempts`/`backoff` work), and a BullMQ-native `telemetry` passthrough.

Scale target: 100k calendars on a 30-min refresh cycle. Epic 03 (notifications) builds on the retry guarantees and the `notifications` queue delivered here.

## Goals / Non-Goals

**Goals:**

- Jobs that fail actually fail: errors reach BullMQ, `attempts: 3` + exponential backoff fire, permanent failures are visible.
- Background sync re-enabled as per-calendar jobs with dedup, failure isolation, and horizontal scale.
- Change detection atomic with content persistence (one transaction, direct call).
- Queue observability: OTel counters + duration histogram per `(queue, job)`, BullMQ-native traces, failure-focused job logging.
- The `notifications` queue exists (consumed in epic 03).

**Non-Goals:**

- Anything notification-specific (outbox, drains, `send_push`) — epic 03.
- Concurrency *tuning* (the knob ships; the measured value is an ops ticket).
- Calendar URL dedup.
- nest-shared changes (epic 01 is closed; this epic only consumes 1.13.0).

## Decisions

### D1 — `SharedQueueModule.forRoot` in the runtime module only; tests get a `QueueService` stub

`SharedQueueModule.forRoot({ concurrency, queues: [{ name: "sync", concurrency: SYNC_QUEUE_CONCURRENCY }, { name: "notifications" }], telemetry: new BullMQOtel(...) })` is mounted in `app.module.ts`, not in `COMMON_IMPORTS`: the module instantiates one worker per queue at init, and jest unit tests must not open Redis connections or upsert cron schedulers. The test harness (`create-test-module.ts`) provides a no-op `QueueService` stub so providers that inject it (the fan-out job) still compile. Job classes decorated with `@JobProcessor` are inert without the module's discovery, so they are safe to instantiate in tests.

**Consequence: `ENABLE_QUEUE` is retired.** Every runtime instance is now a worker. That was the flag's only remaining meaning (it gated `DefaultQueueProcessorService`), and all-replicas-consume is precisely the horizontal-scale goal; cron registration is idempotent (`upsertJobScheduler`) across replicas. Alternative considered — keeping an enqueue-only mode — rejected: the lib has no worker-off switch, and no deployment uses one.

### D2 — Fan-out selects IDs only; each `sync_calendar` job loads its own data

`sync_calendars_fanout` (cron `*/5`, queue `sync`) must not load 100k calendars with content. A new repository method returns due calendar **IDs** (`lastUpdatedAt` older than `UPDATE_AFTER_MIN`, `lastAccessedAt` within `INACTIVITY_DAYS`); the fan-out `addBulk`s `sync_calendar { calendarId }` jobs. The `sync_calendar` handler re-reads the calendar (skipping silently if deleted since) and runs fetch + diff + persist for that one calendar. `UPDATE_CONCURRENCY`/`pLimit` die; the `sync` queue's worker concurrency (env knob `SYNC_QUEUE_CONCURRENCY`) is the replacement throttle.

### D3 — `jobId = calendarId` dedup, therefore immediate removal of completed item jobs

`addBulk` sets `jobId = calendarId` so a slow calendar cannot pile up duplicate pending jobs across fan-out ticks. BullMQ dedups on jobId against **any still-stored job** — including completed/failed ones awaiting removal — so removal policy is correctness, not just hygiene:

- `sync_calendar`: `removeOnComplete: true` (immediate — a lingering completed job would block the next due cycle), `removeOnFail` with a short age (~15 min, under the 30-min due cycle, so a transiently failing calendar is re-enqueued next time it is due rather than blocked for hours). Failure *visibility* comes from job-run logs and metrics (D5), not from Redis retention.
- Cron jobs and future `notifications` jobs: modest `removeOnComplete`/`removeOnFail` ages so Redis stays bounded.

`attempts: 3` + exponential backoff are set per-job at enqueue time (the lib registers queues without `defaultJobOptions`, and per-add options keep the policy next to the job that needs it).

### D4 — Detection by direct call inside one transaction

`CalendarSyncService.saveCalendar` wraps content save + `CalendarLog` write in a single TypeORM transaction and calls the detection service directly with the old/new events it already holds. The `calendar.content.updated` event, `CalendarContentUpdatedEvent`, and the `@OnEvent` listener are deleted. The event had exactly one listener; the decoupling bought nothing and cost atomicity. Dependency direction reverses cleanly: `calendar-log` currently imports the event class *from* `calendar-sync`; after the change `calendar-sync` depends on `calendar-log` explicitly. A job retry re-runs the whole unit or none of it.

### D5 — `job-run` rework: `QueueEvents` listeners, failure-focused recording, metrics from events

`JobRunService`'s wrapping try/catch dies with the custom queue layer. Replacement: a listener service in `modules/job-run` that instantiates BullMQ `QueueEvents` per registered queue and subscribes `completed`/`failed`:

- **Recording policy**: cron jobs log start/completion always; item jobs (`sync_calendar`, later `send_push`) log only on failure. 100k success rows per cycle is noise; failures are the signal.
- **Metrics**: the same listeners emit OTel counters (completed/failed) and a duration histogram, labeled `(queue, job name)`, via the existing `config/observability/meter.ts`. Duration comes from the job's `processedOn`/`finishedOn` timestamps (one `Job.fromId` fetch per event — ~55/s worst case at full scale, acceptable Redis load; revisit if it ever isn't).
- **Traces**: BullMQ-native telemetry via the lib's `telemetry` option with `BullMQOtel` (new `bullmq-otel` dependency) — producer→consumer context propagation for free.

Alternative considered — worker-level `@OnWorkerEvent` hooks — rejected: the lib owns the worker instances and does not expose them.

### D6 — `syncAllForUser` stays synchronous, loses `pLimit`

The user-triggered path (`POST /sync-calendars`) must stay request-latency, not queue-latency. It keeps its shape but replaces `pLimit(10)` with a plain `Promise.all` over the user's few calendars. `p-limit` is then unused and dropped.

## Risks / Trade-offs

- **[All replicas become workers (D1)]** A CPU-heavy sync burst competes with HTTP traffic on the same pods. → Per-queue concurrency knob caps it; dedicated worker deployment is a later infra decision, unblocked (any replica count works).
- **[Duplicate sync runs]** `jobId` dedup does not prevent a re-enqueue while a job is *active* if removal already occurred, and at-least-once delivery allows repeats. → The sync unit is idempotent (fetch + diff + upsert in one tx); a duplicate run costs a redundant fetch, never a wrong `CalendarLog`.
- **[Short `removeOnFail` hides failed jobs from Bull-Board (D3)]** → Deliberate trade for re-enqueue correctness; the failure signal moves to logs + OTel metrics/alerts.
- **[`QueueEvents` fetch-per-event (D5)]** Extra Redis round-trip per completion at scale. → Bounded (~55/s at target scale); metrics-only degradation if skipped, and the fetch can be dropped for completed item jobs later without policy change.
- **[Fan-out query on 100k rows every 5 min]** → IDs-only projection with an index on `lastUpdatedAt`; the due-filter (30 min) keeps the typical batch far below 100k.
- **[Behavior change: sync errors now fail jobs]** Previously `syncAll` swallowed per-calendar errors (`catch(() => {})`); a failing calendar now shows up as a failed job after 3 attempts. → That is the point; recording policy keeps the noise bounded.

## Migration Plan

Single deploy, no data migration. Redis artifacts self-heal: the lib's scheduler sync removes the stale `sync_calendars` scheduler on the old `default` queue only if registered there — the old queue's schedulers are cleaned up explicitly in the cutover task (one-shot: delete the `default` queue's `sync_calendars` job scheduler; the abandoned `default`-queue keys expire via their removal policies or a manual `obliterate` noted in the task). Rollback = redeploy previous image (old scheduler re-registers itself; new queues sit idle, harmless).

## Open Questions

None blocking. `SYNC_QUEUE_CONCURRENCY` default ships as a conservative guess (tuning is the ops ticket per roadmap).
