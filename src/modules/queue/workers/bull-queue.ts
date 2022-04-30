import Queue from "bull"
import { REDIS_QUEUE_NAME } from "config/constants"
import { RedisConfig } from "modules/redis/models/redis-config.interface"
import { AppQueue, QueueHandler } from "./app-queue"
import { QueueJob } from "./queue-job"

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
