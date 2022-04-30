import { Injectable, OnModuleDestroy } from "@nestjs/common"
import { AppQueue } from "modules/queue/workers/app-queue"
import { QueueJob } from "modules/queue/workers/queue-job"
import { RedisService } from "modules/redis/services/redis.service"
import { BullQueue } from "./workers/bull-queue"

@Injectable()
export class QueueService implements OnModuleDestroy {
  private queue: AppQueue

  constructor(private readonly redisService: RedisService) {}

  async init() {
    this.queue = new BullQueue(this.redisService.getRedisConfig())
    await this.queue.init((data) => this.handler(data))
  }

  async onModuleDestroy() {
    await this.queue.close()
  }

  async handler(data: QueueJob) {
    // todo
    console.log(data)
  }
}
