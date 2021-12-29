import { QueueJob } from "./queue-job"

export type QueueHandler = (job: QueueJob) => Promise<any>

export interface AppQueueConstructor {
  new (handler: QueueHandler)
}

export interface AppQueue {
  /**
   * Add a job in the queue
   * @param name The job name
   */
  add(job: QueueJob): Promise<void>
}
