import { JobHandler } from "modules/job-run/models/job-handler.model"
import { AppQueueName } from "modules/queue/queue.constants"

export interface QueueJob<T> {
  /**
   * Job handler
   */
  handler: JobHandler<T>

  /**
   * The name of the job in Bull
   */
  name: string

  /**
   * The job description
   */
  description?: string

  /**
   * The queue name in Bull
   */
  queue: AppQueueName

  /**
   * The name logged in the job log
   */
  displayName?: string

  /**
   * Cron expression for the job
   */
  cron?: string

  /**
   * Whether to log the job run
   */
  logJobRun?: boolean
}
