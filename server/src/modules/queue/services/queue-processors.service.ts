import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Injectable } from "@nestjs/common"
import { Job } from "bullmq"
import { QUEUE_CONCURRENCY } from "config/constants"
import { DEFAULT_QUEUE_NAME } from "modules/queue/queue.constants"
import { QueueService } from "modules/queue/services/queue.service"

@Injectable()
@Processor(DEFAULT_QUEUE_NAME, {
  concurrency: QUEUE_CONCURRENCY,
})
export class DefaultQueueProcessorService extends WorkerHost {
  constructor(private readonly queueService: QueueService) {
    super()
  }

  process(job: Job<unknown, unknown, string>) {
    return this.queueService.process(job)
  }
}
