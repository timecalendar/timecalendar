import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common"
import { REDIS_KEY_PREFIX, REDIS_URL } from "config/constants"
import Redis, { RedisOptions } from "ioredis"

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis | null = null

  onModuleDestroy() {
    return this.close()
  }

  defaultRedisInstance() {
    if (!this.client) {
      this.client = this.newRedisInstance({
        keyPrefix: REDIS_KEY_PREFIX,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      })
    }
    return this.client
  }

  newRedisInstance(options: RedisOptions = {}) {
    const redis = new Redis(REDIS_URL, options)
    redis.on("error", (err) => this.logger.error("Redis connection error", err))
    return redis
  }

  public async get(key: string) {
    return this.defaultRedisInstance().get(key)
  }

  async close() {
    if (this.client) {
      await this.client.quit()
      this.client = null
    }
  }
}
