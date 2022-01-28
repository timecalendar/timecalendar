import Queue from "bull"
import { REDIS_PASSWORD, REDIS_QUEUE_NAME, REDIS_URL } from "config/constants"
import { AppQueue, AppQueueConstructor, QueueHandler } from "./app-queue"
import { QueueJob } from "./queue-job"

export const BullQueue: AppQueueConstructor = class BullQueue
  implements AppQueue
{
  private queue = new Queue<QueueJob>(REDIS_QUEUE_NAME, REDIS_URL, {
    redis: { password: REDIS_PASSWORD },
    defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
  })

  constructor(handler: QueueHandler) {
    // Create the processor
    this.queue.process(({ data }) => handler(data))
  }

  async add(job: QueueJob) {
    // Add the job in the Bull queue
    await this.queue.add(job)
  }
}
