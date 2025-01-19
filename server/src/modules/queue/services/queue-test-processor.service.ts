import { Injectable } from "@nestjs/common"
import { Job, Queue, Worker } from "bullmq"
import { sum } from "lodash"
import { DEFAULT_QUEUE_NAME } from "modules/queue/queue.constants"
import { RedisService } from "modules/redis/services/redis.service"
import { QueueService } from "./queue.service"

@Injectable()
export class QueueTestProcessorService {
  constructor(
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
  ) {}

  async processEnqueuedJobs() {
    const queue = new Queue(DEFAULT_QUEUE_NAME, {
      connection: this.redisService.defaultRedisInstance(),
    })
    await queue.waitUntilReady()

    const worker = new Worker(
      DEFAULT_QUEUE_NAME,
      (job: Job) => this.queueService.process(job),
      { connection: this.redisService.defaultRedisInstance() },
    )

    while (await this.hasRemainingJobs(queue)) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const status = await this.completedAndFailedJobs(queue)

    await queue.close()
    await worker.close()

    return status
  }

  async emptyQueue() {
    const queue = new Queue(DEFAULT_QUEUE_NAME, {
      connection: this.redisService.defaultRedisInstance(),
    })
    await queue.waitUntilReady()
    await queue.drain(true)
    await queue.close()
  }

  private async hasRemainingJobs(queue: Queue) {
    const jobCount = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
    ])

    return sum(jobCount) > 0
  }

  private async completedAndFailedJobs(queue: Queue) {
    const [completed, failed] = await Promise.all([
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ])
    return { completed, failed }
  }
}
