import { SharedBullModule } from "@lyrolab/nest-shared/bull"
import { SharedRedisModule } from "@lyrolab/nest-shared/redis"
import { ModuleMetadata } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { EventEmitterModule } from "@nestjs/event-emitter"

// Shared infrastructure imports mounted by both the runtime AppModule and the
// test module. The database module is intentionally NOT here: runtime wires
// `SharedDatabaseModule.forRoot` (app.module.ts) against `DATABASE_URL`, while
// tests wire `SharedDatabaseModule.forTest` against a per-worker database
// (test-utils/typeorm/typeorm-test-module.ts) — two different connections that
// must not be shared through one `forRoot`.
//
// Redis + Bull, by contrast, DO live here: `SharedRedisModule.forRoot()`
// provides the injectable `RedisConfig` from `REDIS_URL` (global), and
// `SharedBullModule.forRoot()` builds the BullMQ root connection from that same
// `RedisConfig` — both runtime and tests share one connection convention, and
// tests don't exercise the queue (`ENABLE_QUEUE=false`, no `*.test.ts` enqueues).
//
// Note: nest-shared's `forRoot()` connection is `REDIS_URL`-only — it does NOT
// carry a Bull key prefix (the company convention isolates environments by
// `REDIS_URL`, not a per-env prefix, like the sibling services). This replaces
// the previous `prefix: REDIS_KEY_PREFIX` Bull root config; `REDIS_KEY_PREFIX`
// is therefore retired (see config/constants.ts).
//
// `ConfigModule` is global so `SharedDatabaseModule.forRoot`'s injected
// `ConfigService` resolves; `ignoreEnvFile` keeps `process.env` (populated by
// config/constants.ts) the single source of truth.
export const COMMON_IMPORTS: NonNullable<ModuleMetadata["imports"]> = [
  ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
  SharedRedisModule.forRoot(),
  SharedBullModule.forRoot(),
  EventEmitterModule.forRoot(),
]
