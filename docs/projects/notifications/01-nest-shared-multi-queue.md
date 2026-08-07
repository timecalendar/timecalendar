# Epic 01 — Named queues in `@lyrolab/nest-shared`

Repo: `nest-shared` (we own it). Consumers: timecalendar server + other Lyrolab apps.

## Why

`SharedQueueModule` hardcodes a single `DEFAULT_QUEUE`. TimeCalendar needs two isolated
lanes: `sync` (bulk — up to 100k `sync_calendar` jobs per refresh cycle) and
`notifications` (latency-sensitive — `send_push` must not sit behind a sync backlog).
One shared queue means a morning sync spike starves user-facing pushes.

BullMQ's unit of isolation (worker pool, concurrency, rate limit) is the queue, so this
must land in the lib before the server refactor (epic 02) can use it.

## Scope

- Named queue registration: `SharedQueueModule.forRoot({ queues: [{ name, concurrency }] })`
  (and the `forRootAsync` equivalent). Each named queue gets its own BullMQ registration
  and its own worker/processor with its own concurrency.
- `@JobProcessor` accepts a queue: `@JobProcessor({ name, cron?, queue? })`. Omitted
  queue ⇒ default queue, exactly as today.
- `QueueService.add(name, data, opts?)` routes to the right queue by looking up which
  queue the named job's processor is registered on (callers keep the current call shape;
  no queue argument at call sites). Add `addBulk` (needed by epic 02's fan-out).
- Cron scheduling (`upsertJobScheduler` + stale-scheduler cleanup) works per queue.
- **OpenTelemetry passthrough**: an optional `telemetry` option (BullMQ ≥5.34 native
  telemetry interface, e.g. `BullMQOtel`) threaded into every Queue and Worker the module
  creates. Gives distributed traces with producer→consumer context propagation. Chosen
  over the community `@appsignal/opentelemetry-instrumentation-bullmq` monkey-patch,
  which tracks bullmq internals and breaks across versions. Metrics (counters/histograms)
  are not the lib's job — consumers emit them from queue events (see epic 02).
- Tests: multi-queue registration, routing, per-queue concurrency, cron on a named queue,
  the existing single-queue path untouched.
- Changelog + README update, minor version bump.

## Out of scope

- Priority lanes / BullMQ rate limiters (per-queue concurrency is enough for now).
- Any UI/admin surface beyond what `QueueController` already exposes.
- Migrating other consumer apps (no migration needed — see below).

## Decisions

- **Strictly additive API.** `queues` option is optional; when absent, behavior is
  byte-for-byte today's (single `DEFAULT_QUEUE`, same decorator forms, same
  `QueueService` methods). Existing consumers upgrade with zero code changes. This is a
  minor bump, not a major.
- **One `WorkerHost` per queue** (BullMQ requires it). Internally the module instantiates
  one processor per registered queue via dynamic providers; the discovery logic
  (decorator scan) is shared.
- **Job-name uniqueness stays global**, not per-queue. Keeps `QueueService.add(name, …)`
  unambiguous without threading queue names through every call site. Acceptable because
  all consumers are ours.

## Tasks

1. `queues` option on `forRoot`/`forRootAsync`; dynamic per-queue `BullModule.registerQueue`
   + per-queue processor providers.
2. Extend `@JobProcessor` metadata with `queue?`; route discovery accordingly.
3. `QueueService.add`/`addBulk` with job-name → queue resolution.
4. Per-queue cron scheduling + stale-cleanup.
5. `telemetry` option passthrough to Queue/Worker construction.
6. Test suite (incl. a regression test that a no-option `forRoot()` is unchanged).
7. Docs, changelog, publish minor version.
