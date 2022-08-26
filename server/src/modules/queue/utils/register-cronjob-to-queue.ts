import { Queue } from "bull"
import { QueueJob } from "modules/queue/models/queue-job.model"

export const registerCronjobToQueue = async <T>(
  { name, cron }: QueueJob<T>,
  queue: Queue,
) => {
  if (!cron) return

  const jobs = await queue.getRepeatableJobs()

  const jobsToDelete = jobs.filter(
    (job) => job.id === name && job.cron !== cron,
  )
  await Promise.allSettled(
    jobsToDelete.map((job) => queue.removeRepeatableByKey(job.key)),
  )

  queue.add({ name }, { repeat: { cron }, jobId: name })
}
