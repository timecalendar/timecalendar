import { QueueService } from "@lyrolab/nest-shared/queue"
import {
  SEND_PUSH_JOB,
  SendPushJobData,
  sendPushJobOptions,
} from "modules/notifier/jobs/send-push.constants"
import {
  FcmNotifierRecipient,
  OnCalendarChangedPayload,
} from "modules/notifier/models/notifier"
import { Notifier } from "modules/notifier/models/notifier.interface"
import { buildCalendarChangedPush } from "modules/notifier/notifiers/fcm-push-builder"

export class FcmNotifier implements Notifier {
  constructor(
    private readonly queueService: QueueService,
    private readonly recipient: FcmNotifierRecipient,
  ) {}

  async onCalendarChanged(payload: OnCalendarChangedPayload): Promise<void> {
    const push = buildCalendarChangedPush(payload)
    if (!push) return

    const data: SendPushJobData = {
      subscriptionId: payload.subscriptionId,
      token: this.recipient.token,
      push,
    }
    await this.queueService.add(SEND_PUSH_JOB, data, sendPushJobOptions)
  }
}
