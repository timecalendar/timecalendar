import { Injectable } from "@nestjs/common"
import { REDIS_PASSWORD, REDIS_URL } from "config/constants"
import { RedisConfig } from "modules/redis/models/redis-config.interface"

@Injectable()
export class RedisService {
  getRedisConfig(): RedisConfig {
    return {
      url: REDIS_URL,
      password: REDIS_PASSWORD,
    }
  }
}
