import { Injectable, OnModuleDestroy } from "@nestjs/common"
import { REDIS_KEY_PREFIX, REDIS_URL } from "config/constants"
import Redis, { RedisOptions } from "ioredis"
import { isTestEnv } from "modules/shared/helpers/check-environment"

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null
  private clients: Redis[] = []

  onModuleDestroy() {
    if (isTestEnv()) return this.closeForTests()
    return this.close()
  }

  defaultRedisInstance() {
    if (!this.client) {
      this.client = this.newRedisInstance()
    }
    return this.client
  }

  newRedisInstance(options: RedisOptions = {}) {
    const redis = new Redis(REDIS_URL, {
      keyPrefix: REDIS_KEY_PREFIX,
      ...options,
    })
    redis.on("error", (err) => console.error(err))
    this.clients.push(redis)
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

  async closeForTests() {
    for (const client of this.clients) {
      await client.quit()
    }
    this.clients = []
  }
}
