import { JobHandler } from "modules/job-run/models/job-handler.model"

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
   * The name logged in the job log
   */
  displayName?: string

  /**
   * Cron expression for the job
   */
  cron?: string
}
