import { RedisConfig } from "@lyrolab/nest-shared/redis"
import { getQueueToken } from "@nestjs/bullmq"
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common"
import { ModuleRef } from "@nestjs/core"
import { Job, Queue, QueueEvents } from "bullmq"
import meter from "config/observability/meter"
import { ALL_QUEUE_NAMES } from "config/queues"

// Job lifecycle recording + metrics, driven by BullMQ queue events (design D5).
// A wrapping try/catch cannot coexist with error propagation (retries need the
// throw to reach BullMQ), so observation happens out-of-band:
// - cron runs are logged always; item jobs only on failure (100k success rows
//   per cycle is noise — throughput is visible via metrics)
// - `failed` only fires once attempts are exhausted, so a logged failure is a
//   permanent one
// Jobs already removed when the event arrives (removeOnComplete: true item
// jobs, design D3) are counted under name "unknown" — per-queue attribution
// still holds, exact names come from BullMQOtel traces — and their duration is
// unavailable.
@Injectable()
export class JobEventsListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobEventsListenerService.name)
  private readonly queues = new Map<string, Queue>()
  private readonly queueEventsListeners: QueueEvents[] = []

  private readonly completedCounter = meter.createCounter(
    "queue_jobs_completed_total",
    { description: "Number of completed queue jobs" },
  )
  private readonly failedCounter = meter.createCounter(
    "queue_jobs_failed_total",
    { description: "Number of permanently failed queue jobs" },
  )
  private readonly durationHistogram = meter.createHistogram(
    "queue_job_duration_ms",
    { description: "Queue job processing duration", unit: "ms" },
  )

  constructor(
    private readonly redisConfig: RedisConfig,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    for (const queueName of ALL_QUEUE_NAMES) {
      // Job.fromId reuses the Queue instances SharedQueueModule registered;
      // only QueueEvents needs its own (blocking) connection.
      this.queues.set(
        queueName,
        this.moduleRef.get<Queue>(getQueueToken(queueName), { strict: false }),
      )

      const queueEvents = new QueueEvents(queueName, {
        connection: { url: this.redisConfig.url },
      })
      // Handler rejections must never escape: an unhandled rejection would
      // terminate the process; a Redis blip here only costs a metric sample.
      queueEvents.on("completed", ({ jobId }) => {
        this.handleCompleted(queueName, jobId).catch((error) =>
          this.logHandlerError(queueName, jobId, error),
        )
      })
      queueEvents.on("failed", ({ jobId, failedReason }) => {
        this.handleFailed(queueName, jobId, failedReason).catch((error) =>
          this.logHandlerError(queueName, jobId, error),
        )
      })
      queueEvents.on("error", (error) => {
        this.logger.error(`QueueEvents error (queue ${queueName}): ${error}`)
      })
      this.queueEventsListeners.push(queueEvents)
    }
  }

  async onModuleDestroy() {
    await Promise.all(
      this.queueEventsListeners.map((listener) => listener.close()),
    )
  }

  async handleCompleted(queueName: string, jobId: string) {
    const job = await this.fetchJob(queueName, jobId)

    this.completedCounter.add(1, {
      queue: queueName,
      job: job?.name ?? "unknown",
    })
    if (!job) return

    this.recordDuration(job, queueName)
    if (this.isCronJob(job)) {
      this.logger.log(
        `Job ${job.name} (queue ${queueName}) completed${this.formatDuration(
          job,
        )}`,
      )
    }
  }

  async handleFailed(queueName: string, jobId: string, failedReason: string) {
    const job = await this.fetchJob(queueName, jobId)
    const jobName = job?.name ?? "unknown"

    this.failedCounter.add(1, { queue: queueName, job: jobName })
    if (job) this.recordDuration(job, queueName)

    this.logger.error(
      `Job ${jobName} (queue ${queueName}, id ${jobId}) failed: ${failedReason}`,
    )
  }

  private logHandlerError(queueName: string, jobId: string, error: unknown) {
    this.logger.error(
      `Failed to record job event (queue ${queueName}, id ${jobId}): ${error}`,
    )
  }

  private async fetchJob(queueName: string, jobId: string) {
    const queue = this.queues.get(queueName)
    if (!queue) return undefined
    return Job.fromId(queue, jobId)
  }

  private recordDuration(job: Job, queueName: string) {
    const duration = this.durationMs(job)
    if (duration !== undefined)
      this.durationHistogram.record(duration, {
        queue: queueName,
        job: job.name,
      })
  }

  private durationMs(job: Job) {
    if (!job.processedOn || !job.finishedOn) return undefined
    return job.finishedOn - job.processedOn
  }

  private formatDuration(job: Job) {
    const duration = this.durationMs(job)
    return duration === undefined ? "" : ` in ${duration}ms`
  }

  private isCronJob(job: Job) {
    return Boolean(job.repeatJobKey)
  }
}
