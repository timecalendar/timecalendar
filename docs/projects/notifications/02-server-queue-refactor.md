# Epic 02 — Server queue refactor

Repo: `server`. Depends on epic 01. Independently shippable and valuable (fixes four
existing reliability bugs before any notification exists).

## Why

The custom `modules/queue` + `job-run` layer cannot carry a delivery guarantee:

1. `JobRunService.run` catches every handler error and never rethrows — BullMQ marks
   every job **completed**, always. Failures are invisible and never retried.
2. No `attempts`/`backoff` defaults — even without bug 1, BullMQ would try once.
3. `calendar-sync.service.ts` fires `emitAsync("calendar.content.updated")` unawaited —
   change detection runs as a fire-and-forget with unhandled rejections, and a crash
   between content save and log write silently loses the change **forever** (a retry
   re-diffs new-vs-new = empty diff).
4. The `sync_calendars` cron handler body is commented out — no background sync at all.
   Notifications without background sync only fire when the user opens the app, which
   defeats their purpose.
5. Fan-out uses in-process `pLimit(10)` — no per-calendar retry, no failure isolation,
   no horizontal scale, and an order of magnitude short of 100k calendars / 30 min.

## Scope

- Replace `modules/queue` internals with `SharedQueueModule` (epic 01), registering two
  queues: `sync` and `notifications` (the latter is created here, consumed in epic 03).
- **Per-calendar sync jobs**:
  - `sync_calendars_fanout` cron (`*/5`, queue `sync`): select due calendars
    (`lastUpdatedBefore` 30 min, activity window) and `addBulk` one
    `sync_calendar { calendarId }` job each, with `jobId = calendarId` so a calendar
    already queued is not enqueued twice.
  - `sync_calendar` job: fetch + diff + persist for one calendar. Worker concurrency
    (config knob) replaces `UPDATE_CONCURRENCY`/`pLimit`. `attempts: 3`, exponential
    backoff.
  - Re-enable background sync by construction (the fan-out cron is the enablement).
- **Atomic change detection (decision: direct call, one transaction).** The sync job
  computes the diff and saves calendar content + `CalendarLog` in a single transaction
  via a direct service call. The `calendar.content.updated` EventEmitter2 event and its
  listener wiring are deleted. Detection can no longer be lost between statements, and a
  job retry re-runs the whole unit or none of it.
- **Queue defaults**: `attempts: 3`, exponential backoff, `removeOnComplete`/`removeOnFail`
  tuned so Redis does not grow unbounded.
- **`job-run` rework**: from a wrapping try/catch to BullMQ event listeners
  (`completed` / `failed`). Recording policy: cron jobs always; item jobs
  (`sync_calendar`, later `send_push`) only on failure. 100k success rows per 30-min
  cycle is noise; failures are the signal. Throughput visibility comes from metrics, not
  rows: the same listeners emit OTel counters (completed/failed) and a duration
  histogram, labeled `(queue, job name)`, via the existing `config/observability/meter.ts`.
  Traces come from the lib's telemetry passthrough (epic 01), enabled here with
  `BullMQOtel`.
- `syncAllForUser` (user-triggered, request path) keeps its synchronous shape but drops
  `pLimit` for a bounded `Promise.all` over its few calendars — it must stay
  request-latency, not queue-latency.

## Out of scope

- Anything notification-specific (outbox, drains, send jobs) — epic 03.
- Concurrency *tuning* (the knob ships here; the measured value is an ops ticket).
- Calendar URL dedup.

## Decisions

- **Detection by direct call, not event** — the event had exactly one listener; the
  decoupling bought nothing and cost atomicity. `calendar-sync` now depends on
  `calendar-log` explicitly.
- **`jobId = calendarId` dedup** — a slow calendar cannot pile up duplicate pending jobs
  across fan-out ticks.
- **Failures recorded, successes not (item jobs)** — keeps `job_run` a debugging surface,
  not a firehose.

## Tasks

1. Bump `@lyrolab/nest-shared`; wire `SharedQueueModule` with `sync` + `notifications`
   queues; delete the superseded custom queue internals.
2. `sync_calendars_fanout` cron + `sync_calendar` processor (jobId dedup, addBulk).
3. Transactional sync unit: diff + content + `CalendarLog` in one tx; delete the
   `calendar.content.updated` event + listener; update tests.
4. Queue defaults (attempts, backoff, removal policies).
5. `job-run` as event listeners with the recording policy above.
6. `syncAllForUser` path cleanup.
7. Green: existing sync/detection test suites migrated; new tests for fan-out dedup and
   retry-after-failure semantics.
