import { QueueJob } from "modules/queue/workers/queue-job"

export type QueueHandler = (job: QueueJob) => Promise<any>

export interface AppQueue {
  init(handler: QueueHandler): Promise<void>
  add(job: QueueJob): Promise<void>
  close(): Promise<void>
}
