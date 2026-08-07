# server-shared-infrastructure — delta

## MODIFIED Requirements

### Requirement: Shared library provides runtime infrastructure
The server SHALL stand up its database, Redis, and queue infrastructure via `@lyrolab/nest-shared` modules rather than hand-rolled equivalents, so this service shares the company's NestJS infrastructure conventions. The queue layer SHALL be `SharedQueueModule` (nest-shared ≥ 1.13.0) registering the named queues `sync` and `notifications` alongside the default queue, with per-queue worker concurrency and jobs declared via `@JobProcessor`; the custom `modules/queue` implementation (job registry, default-queue processor, cron registration util) SHALL be removed.

#### Scenario: Database module is nest-shared
- **WHEN** the application module is assembled
- **THEN** the TypeORM connection is provided by `SharedDatabaseModule.forRoot()` (configured with the server's entities and migrations), and no custom `TypeOrmModule.forRoot()` wiring remains in `common-imports.ts`

#### Scenario: Redis and Bull are nest-shared
- **WHEN** the application module is assembled
- **THEN** the Redis connection is provided by `SharedRedisModule.forRoot()` (exposing the injectable `RedisConfig`) and the BullMQ root connection by `SharedBullModule.forRoot()`, and the custom `modules/redis` service is removed

#### Scenario: Named queues are registered through SharedQueueModule
- **WHEN** the runtime application module is assembled
- **THEN** `SharedQueueModule.forRoot` registers the `sync` and `notifications` queues (each with its own worker), jobs are declared with `@JobProcessor({ name, cron?, queue? })`, and no custom `modules/queue` code remains

#### Scenario: Admin UI shows the named queues
- **WHEN** the Bull-Board admin UI at `/admin/queues` is opened
- **THEN** the `sync` and `notifications` queues are visible alongside the default queue

#### Scenario: Unit tests run without queue workers
- **WHEN** the jest test module is assembled
- **THEN** no BullMQ worker is instantiated and no cron scheduler is written to Redis; providers depending on `QueueService` receive a test stub
