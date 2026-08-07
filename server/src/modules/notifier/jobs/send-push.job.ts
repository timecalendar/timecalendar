import { JobProcessor, JobProcessorInterface } from "@lyrolab/nest-shared/queue"
import { Injectable } from "@nestjs/common"
import { Job } from "bullmq"
import { NOTIFICATIONS_QUEUE } from "config/queues"
import { FirebaseService } from "modules/firebase/services/firebase.service"
import {
  SEND_PUSH_JOB,
  SendPushJobData,
} from "modules/notifier/jobs/send-push.constants"
import { NotificationSubscriptionService } from "modules/notification-subscription/services/notification-subscription.service"

@Injectable()
@JobProcessor({ name: SEND_PUSH_JOB, queue: NOTIFICATIONS_QUEUE })
export class SendPushJob implements JobProcessorInterface {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly subscriptionService: NotificationSubscriptionService,
  ) {}

  async process(job: Job<SendPushJobData>) {
    const { subscriptionId, token, push } = job.data

    // notify() returns null on registration-token-not-registered (and only
    // then): the token is dead, so retire the subscription instead of retrying.
    const result = await this.firebaseService.notify(token, push)

    if (result === null) {
      await this.subscriptionService.deactivateSubscription(subscriptionId)
    }
  }
}
