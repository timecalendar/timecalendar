import { AppQueue, AppQueueConstructor, QueueHandler } from "./app-queue"
import { QueueJob } from "./queue-job"

export const LocalQueue: AppQueueConstructor = class LocalQueue
  implements AppQueue
{
  constructor(private handler: QueueHandler) {}

  add(job: QueueJob): Promise<void> {
    return this.handler(job)
  }
}
