import { Injectable } from "@nestjs/common"
import Queue from "bull"
import { sum } from "lodash"
import { DEFAULT_QUEUE_NAME } from "modules/queue/queue.constants"
import { QueueService } from "modules/queue/services/queue.service"
import { RedisService } from "modules/redis/services/redis.service"
import { sleep } from "modules/shared/helpers/sleep"

@Injectable()
export class QueueTestProcessorService {
  constructor(
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
  ) {}

  async processEnqueuedJobs() {
    const queue = new Queue(DEFAULT_QUEUE_NAME, {
      createClient: () => this.redisService.newRedisInstance(),
    })

    await queue.isReady()

    queue.process((job) => this.queueService.process(DEFAULT_QUEUE_NAME, job))

    while (await this.hasRemainingJobs(queue)) {
      await sleep(100)
    }

    const status = await this.completedAndFailedJobs(queue)
    await queue.close()
    return status
  }

  private async hasRemainingJobs(queue: Queue.Queue) {
    const jobCount = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getDelayedCount(),
    ])

    return sum(jobCount) > 0
  }

  private async completedAndFailedJobs(queue: Queue.Queue) {
    const [completed, failed] = await Promise.all([
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ])
    return { completed, failed }
  }
}
