import { Process, Processor } from "@nestjs/bull"
import { Injectable } from "@nestjs/common"
import { Job } from "bull"
import { BullJobParams } from "modules/queue/models/bull-job-params.model"
import {
  DEFAULT_CRON_QUEUE_NAME,
  DEFAULT_QUEUE_NAME,
} from "modules/queue/queue.constants"
import { QueueService } from "modules/queue/services/queue.service"

@Injectable()
@Processor(DEFAULT_QUEUE_NAME)
export class DefaultQueueProcessorService {
  constructor(private readonly queueService: QueueService) {}

  @Process()
  process(job: Job<BullJobParams>) {
    return this.queueService.process(DEFAULT_QUEUE_NAME, job)
  }
}

@Injectable()
@Processor(DEFAULT_CRON_QUEUE_NAME)
export class DefaultCronQueueProcessorService {
  constructor(private readonly queueService: QueueService) {}

  @Process()
  process(job: Job<BullJobParams>) {
    return this.queueService.process(DEFAULT_CRON_QUEUE_NAME, job)
  }
}
