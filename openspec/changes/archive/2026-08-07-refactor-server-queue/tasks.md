## 1. Adopt SharedQueueModule

- [x] 1.1 Bump `@lyrolab/nest-shared` to ^1.13.0; add `bullmq-otel`; `npm install` in `server/`
- [x] 1.2 Mount `SharedQueueModule.forRoot({ concurrency, queues: [{ name: "sync", concurrency: SYNC_QUEUE_CONCURRENCY }, { name: "notifications" }], telemetry: new BullMQOtel(...) })` in `app.module.ts` (runtime only, per design D1); add the `SYNC_QUEUE_CONCURRENCY` env knob to `config/constants.ts`
- [x] 1.3 Add a no-op `QueueService` stub to `create-test-module.ts` defaults so providers injecting `QueueService` compile in jest without Redis/workers
- [x] 1.4 Delete `modules/queue/**` (QueueService, DefaultQueueProcessorService, register-cronjob-to-queue, models, constants); retire `ENABLE_QUEUE` and `QUEUE_CONCURRENCY`-as-`UPDATE` semantics from `config/constants.ts` and env defaults
- [x] 1.5 Register `sync` and `notifications` queues in the Bull-Board adapter so `/admin/queues` shows them

## 2. Per-calendar sync jobs

- [x] 2.1 Add an IDs-only repository method for due calendars (`lastUpdatedBefore` 30 min, `lastAccessedAtAfter` inactivity window); verify/add index on `lastUpdatedAt`
- [x] 2.2 `sync_calendars_fanout` processor (`@JobProcessor({ name: "sync_calendars_fanout", cron: "*/5 * * * *", queue: "sync" })`): select due IDs, `addBulk` `sync_calendar { calendarId }` with `jobId = calendarId`, `attempts: 3`, exponential backoff, `removeOnComplete: true`, short `removeOnFail` (design D3)
- [x] 2.3 `sync_calendar` processor (queue `sync`): load calendar by id (complete silently if deleted), run `CalendarSyncService.sync`
- [x] 2.4 Delete the old `SyncCalendarsJob` (commented-out cron) and its registration

## 3. Atomic change detection

- [x] 3.1 Rework `DetectCalendarChangeService`: drop `@OnEvent`, expose a direct method taking `(manager, calendarId, oldEvents, newEvents)`; export it from `calendar-log` module
- [x] 3.2 `CalendarSyncService.saveCalendar`: wrap content save + detection + `CalendarLog` write in one TypeORM transaction; call detection directly; delete `CalendarContentUpdatedEvent` and the `emitAsync` call; wire `calendar-sync` module to import `calendar-log`
- [x] 3.3 Migrate `calendar-sync.service.test.ts` and `detect-calendar-change.service.test.ts` off the event emitter; assert atomicity semantics (log written with content, none on no-change)

## 4. syncAllForUser cleanup

- [x] 4.1 Replace `pLimit(UPDATE_CONCURRENCY)` in `CalendarSyncAllService` with plain `Promise.all`; delete `syncAllForCronJob`, `UPDATE_CONCURRENCY`; remove `p-limit` dependency if unused elsewhere

## 5. job-run rework

- [x] 5.1 Replace `JobRunService` try/catch wrapper with a `QueueEvents`-based listener service (per queue): cron jobs logged always, item jobs on failure only, per design D5
- [x] 5.2 Same listeners emit OTel completed/failed counters + duration histogram labeled `(queue, job name)` via `config/observability/meter.ts` (duration from job `processedOn`/`finishedOn`)
- [x] 5.3 Delete obsolete `job-run` models (`RunParams`, `JobRunContext`, handler types) superseded by `@JobProcessor` classes

## 6. Cutover hygiene

- [x] 6.1 One-shot cleanup of the old `default`-queue `sync_calendars` job scheduler (migration plan in design); document the optional manual `obliterate` of abandoned default-queue keys

## 7. Verification

- [x] 7.1 New tests: fan-out enqueues due IDs with jobId dedup options; `sync_calendar` completes silently on missing calendar; retry-after-failure semantics (handler throw propagates)
- [x] 7.2 New tests: job-run listener recording policy (cron always, item on failure) and metric emission
- [x] 7.3 Full local green in `server/`: `npm run lint`, `npm test`, build; confirm no `EventEmitter2`/`p-limit`/`modules/queue` references remain
