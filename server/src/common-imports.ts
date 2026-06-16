import { BullModule } from "@nestjs/bullmq"
import { ModuleMetadata } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { REDIS_KEY_PREFIX, REDIS_URL } from "config/constants"

// Shared infrastructure imports mounted by both the runtime AppModule and the
// test module. The database module is intentionally NOT here: runtime wires
// `SharedDatabaseModule.forRoot` (app.module.ts) against `DATABASE_URL`, while
// tests wire `SharedDatabaseModule.forTest` against a per-worker database
// (test-utils/typeorm/typeorm-test-module.ts) — two different connections that
// must not be shared through one `forRoot`.
//
// `ConfigModule` is global so `SharedDatabaseModule.forRoot`'s injected
// `ConfigService` resolves; `ignoreEnvFile` keeps `process.env` (populated by
// config/constants.ts) the single source of truth.
export const COMMON_IMPORTS: NonNullable<ModuleMetadata["imports"]> = [
  ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
  BullModule.forRoot({
    connection: { url: REDIS_URL },
    prefix: REDIS_KEY_PREFIX,
  }),
  EventEmitterModule.forRoot(),
]
