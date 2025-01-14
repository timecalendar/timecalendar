import { Queue } from "bullmq"
import { QueueJob } from "modules/queue/models/queue-job.model"

export const registerCronjobToQueue = async <T>(
  { name, cron }: QueueJob<T>,
  queue: Queue,
) => {
  if (!cron) return

  const jobs = await queue.getJobSchedulers()
  const jobsToDelete = jobs.filter(
    (job) => job.key === name && job.pattern !== cron,
  )
  await Promise.allSettled(
    jobsToDelete.map((job) => queue.removeJobScheduler(job.key)),
  )

  await queue.upsertJobScheduler(name, { pattern: cron }, { name })
}
