import Queue from "bull"
import { REDIS_QUEUE_NAME } from "config/constants"
import { AppQueue, QueueHandler } from "modules/queue/workers/app-queue"
import { QueueJob } from "modules/queue/workers/queue-job"
import { RedisConfig } from "modules/redis/models/redis-config.interface"

export class BullQueue implements AppQueue {
  private queue: Queue.Queue<QueueJob>

  constructor({ url, password }: RedisConfig) {
    this.queue = new Queue<QueueJob>(REDIS_QUEUE_NAME, url, {
      redis: { password },
      defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
    })
  }

  async init(handler: QueueHandler) {
    this.queue.process(({ data }) => handler(data))
  }

  async add(job: QueueJob) {
    await this.queue.add(job)
  }

  async close() {
    await this.queue.close()
  }
}
