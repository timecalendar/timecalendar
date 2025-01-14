import { InjectQueue } from "@nestjs/bullmq"
import { Injectable } from "@nestjs/common"
import { Job, JobsOptions, Queue } from "bullmq"
import { JobRunService } from "modules/job-run/services/job-run.service"
import { QueueJob } from "modules/queue/models/queue-job.model"
import { DEFAULT_QUEUE_NAME } from "modules/queue/queue.constants"
import { registerCronjobToQueue } from "modules/queue/utils/register-cronjob-to-queue"

@Injectable()
export class QueueService {
  private queues: Record<string, Queue>
  private jobs: QueueJob<unknown>[] = []

  constructor(
    @InjectQueue(DEFAULT_QUEUE_NAME) public queue: Queue,
    private readonly jobRunService: JobRunService,
  ) {}

  async register<T>(job: QueueJob<T>) {
    this.jobs.push(job)
    if (job.cron) await registerCronjobToQueue(job, this.queue)
  }

  add(name: string, payload: any = {}, jobOptions?: Partial<JobsOptions>) {
    return this.queue.add(name, payload, jobOptions)
  }

  process(bullJobParams: Job<unknown, unknown, string>) {
    const job = this.jobs.find((job) => job.name === bullJobParams.name)

    if (!job) throw new Error(`Job ${bullJobParams.name} not found!`)

    const params = bullJobParams.data

    return this.jobRunService.run({
      name: job.name,
      displayName: job.displayName,
      isCronjob: Boolean(job.cron),
      params,
      progress: (number) => bullJobParams.updateProgress(Math.round(number)),
      handler: (context) => job.handler(context),
    })
  }
}
