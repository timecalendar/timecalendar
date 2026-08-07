# Refactor server queue foundation

## Why

The custom `modules/queue` + `job-run` layer cannot carry a delivery guarantee, and the notifications pipeline (epic 03) needs one: `JobRunService.run` swallows every handler error so BullMQ marks all jobs completed and never retries; no `attempts`/`backoff` are configured; change detection runs as an unawaited `emitAsync` that can silently lose a calendar change forever; the `sync_calendars` cron body is commented out so background sync does not run at all; and fan-out is an in-process `pLimit(10)` with no retry, isolation, or horizontal scale. Epic 01 (`@lyrolab/nest-shared` 1.13.0, named queues + `addBulk` + telemetry passthrough) is shipped, unblocking this refactor.

## What Changes

- Bump `@lyrolab/nest-shared` to ^1.13.0 and replace the custom `modules/queue` internals (`QueueService`, `DefaultQueueProcessorService`, `registerCronjobToQueue`) with `SharedQueueModule`, registering two named queues: `sync` (bulk) and `notifications` (created now, consumed in epic 03).
- Per-calendar sync jobs: a `sync_calendars_fanout` cron (`*/5`, queue `sync`) selects due calendars and `addBulk`s one `sync_calendar { calendarId }` job each with `jobId = calendarId` (dedup); the `sync_calendar` job fetches + diffs + persists one calendar. Worker concurrency becomes a config knob replacing `UPDATE_CONCURRENCY`/`pLimit`. Background sync is re-enabled by construction.
- Atomic change detection: the sync job saves calendar content + `CalendarLog` in a single transaction via a direct service call; the `calendar.content.updated` EventEmitter2 event, its `CalendarContentUpdatedEvent` class, and the `@OnEvent` listener wiring are deleted.
- Job reliability defaults: `attempts: 3`, exponential backoff, `removeOnComplete`/`removeOnFail` tuned so Redis does not grow unbounded.
- `job-run` reworked from a wrapping try/catch (that swallows errors) to BullMQ queue-event listeners (`completed`/`failed`): errors propagate so retries fire; cron runs always logged, item jobs logged only on failure; the same listeners emit OTel counters and a duration histogram labeled `(queue, job)`; BullMQ-native traces enabled via the lib's `telemetry` passthrough (`BullMQOtel`).
- `syncAllForUser` (user-triggered request path) keeps its synchronous shape but drops `pLimit` for a bounded `Promise.all`.

## Capabilities

### New Capabilities

- `server-calendar-background-sync`: per-calendar background sync jobs — fan-out cron, jobId dedup, retry-with-backoff semantics, atomic diff + content + `CalendarLog` persistence, and the synchronous user-triggered sync path.
- `server-queue-reliability`: queue-layer delivery guarantees and visibility — error propagation to BullMQ, retry/backoff/removal defaults, job-run recording policy, and OTel metrics/traces for queue jobs.

### Modified Capabilities

- `server-shared-infrastructure`: the queue seam moves from `SharedBullModule` + custom `modules/queue` processors to `SharedQueueModule.forRoot` with named `sync` and `notifications` queues; the custom queue module is deleted.

## Impact

- **Code**: `server/src/modules/queue/**` (deleted), `server/src/modules/job-run/**` (reworked), `server/src/modules/calendar-sync/**` (fan-out job, per-calendar job, transactional save, `pLimit` removal), `server/src/modules/calendar-log/services/detect-calendar-change.service.ts` (direct call, no `@OnEvent`), `server/src/config/constants.ts` (concurrency knobs), app module wiring.
- **Dependencies**: `@lyrolab/nest-shared` ^1.11.0 → ^1.13.0; `p-limit` likely removable; `bullmq-otel` (or equivalent) added for the telemetry passthrough.
- **Systems**: Redis gains two named queues; job volume grows to one job per due calendar per cycle (bounded by dedup); no wire/API contract changes — `POST /sync-calendars` behavior preserved.
- **Sequencing**: unblocks epic 03 (notifications pipeline), which consumes the `notifications` queue and the retry guarantees shipped here.
