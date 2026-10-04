import { createHmac, randomBytes } from "node:crypto"
import { RedisConfig } from "@lyrolab/nest-shared/redis"
import { Injectable, OnModuleDestroy } from "@nestjs/common"
import Redis from "ioredis"
import { NODE_ENV } from "config/constants"
import { context } from "@opentelemetry/api"
import { suppressTracing } from "@opentelemetry/core"

const CONSUME = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
if count > tonumber(ARGV[2]) then return math.max(1, math.ceil(redis.call('PTTL', KEYS[1]) / 1000)) end
return 0
`

@Injectable()
export class MigrationReportRateLimiter implements OnModuleDestroy {
  private readonly redis: Redis
  private readonly secret: string
  private connecting?: Promise<void>

  constructor(config: RedisConfig) {
    this.secret =
      process.env.MIGRATION_REPORT_RATE_LIMIT_SECRET ??
      (NODE_ENV === "production" ? "" : randomBytes(32).toString("hex"))
    this.redis = new Redis(config.url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0,
      connectTimeout: 1000,
      commandTimeout: 1000,
      retryStrategy: () => null,
    })
    // Connection errors must not become console events carrying connection details.
    this.redis.on("error", () => undefined)
  }

  async consume(kind: "ip" | "report", value: string): Promise<number> {
    if (this.secret.length < 32) throw new Error("Report limiter unavailable")
    return context.with(suppressTracing(context.active()), async () => {
      if (this.redis.status === "wait" || this.redis.status === "end") {
        this.connecting ??= this.redis.connect().finally(() => {
          this.connecting = undefined
        })
      }
      if (this.connecting) await this.connecting
      const digest = createHmac("sha256", this.secret)
        .update(value)
        .digest("hex")
      return Number(
        await this.redis.eval(
          CONSUME,
          1,
          `migration-report:${kind}:${digest}`,
          kind === "ip" ? 60 : 3600,
          kind === "ip" ? 60 : 10,
        ),
      )
    })
  }

  onModuleDestroy() {
    this.redis.disconnect()
  }
}
