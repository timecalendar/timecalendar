import { Module } from "@nestjs/common"
import { RedisModule } from "modules/redis/redis.module"

@Module({
  imports: [RedisModule],
})
export class QueueModule {}
