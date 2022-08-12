import { InjectQueue } from "@nestjs/bull"
import { Injectable } from "@nestjs/common"
import { Job, JobOptions, Queue } from "bull"
import { JobRunService } from "modules/job-run/services/job-run.service"
import { BullJobParams } from "modules/queue/models/bull-job-params.model"
import { QueueJob } from "modules/queue/models/queue-job.model"
import {
  DEFAULT_QUEUE_NAME,
  DEFAULT_CRON_QUEUE_NAME,
  AppQueueName,
} from "modules/queue/queue.constants"
import { registerCronjobToQueue } from "modules/queue/utils/register-cronjob-to-queue"

@Injectable()
export class QueueService {
  private queues: Record<string, Queue>
  private jobs: QueueJob<unknown>[] = []

  constructor(
    @InjectQueue(DEFAULT_QUEUE_NAME) public defaultQueue: Queue,
    @InjectQueue(DEFAULT_CRON_QUEUE_NAME) public defaultCronQueue: Queue,
    private readonly jobRunService: JobRunService,
  ) {
    this.queues = {
      [DEFAULT_QUEUE_NAME]: defaultQueue,
      [DEFAULT_CRON_QUEUE_NAME]: defaultCronQueue,
    }
  }

  async register<T>(job: QueueJob<T>) {
    this.jobs.push(job)
    if (job.cron) await registerCronjobToQueue(job, this.queues[job.queue])
  }

  add(
    queue: AppQueueName,
    name: string,
    payload: any = {},
    jobOptions?: Partial<JobOptions>,
  ) {
    return this.queues[queue].add({ name, payload }, jobOptions)
  }

  process(queue: AppQueueName, bullJobParams: Job<BullJobParams>) {
    const { data } = bullJobParams
    const job = this.jobs.find(
      (job) => job.name === data.name && job.queue === queue,
    )

    if (!job)
      throw new Error(`Job ${data.name} not found in the queue ${queue}!`)

    const params = data.payload

    return this.jobRunService.run({
      name: job.name,
      displayName: (params as any)?.jobDisplayName ?? job.displayName,
      isCronjob: Boolean(job.cron),
      type: job.queue,
      params,
      progress: (number) => bullJobParams.progress(Math.round(number)),
      handler: (context) => job.handler(context),
      logJobRun: Boolean(job.logJobRun),
    })
  }
}
