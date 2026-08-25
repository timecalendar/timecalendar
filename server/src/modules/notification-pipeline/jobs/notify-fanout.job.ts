import { JobProcessor, JobProcessorInterface } from "@lyrolab/nest-shared/queue"
import { Injectable } from "@nestjs/common"
import { NOTIFICATIONS_QUEUE } from "config/queues"
import { NotificationOutboxRepository } from "modules/notification-pipeline/repositories/notification-outbox.repository"

export const NOTIFY_FANOUT_JOB = "notify_fanout"

@Injectable()
@JobProcessor({
  name: NOTIFY_FANOUT_JOB,
  cron: "* * * * *",
  queue: NOTIFICATIONS_QUEUE,
})
export class NotifyFanoutJob implements JobProcessorInterface {
  constructor(
    private readonly outboxRepository: NotificationOutboxRepository,
  ) {}

  async process() {
    await this.outboxRepository.fanOut()
  }
}
