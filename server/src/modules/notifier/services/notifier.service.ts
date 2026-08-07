import { QueueService } from "@lyrolab/nest-shared/queue"
import { Injectable } from "@nestjs/common"
import {
  NotifierRecipient,
  NotifyUserOptions,
} from "modules/notifier/models/notifier"
import { Notifier } from "modules/notifier/models/notifier.interface"
import { FcmNotifier } from "modules/notifier/notifiers/fcm-notifier"

@Injectable()
export class NotifierService {
  constructor(private readonly queueService: QueueService) {}

  private getNotifier(recipient: NotifierRecipient): Notifier {
    switch (recipient.type) {
      case "fcm":
        return new FcmNotifier(this.queueService, recipient)
      default:
        throw new Error("Notifier type not found")
    }
  }

  notifyUser(options: NotifyUserOptions) {
    const { recipient, data } = options
    const notifier = this.getNotifier(recipient)

    switch (data.type) {
      case "calendar_changed":
        return notifier.onCalendarChanged(data.payload)
      default:
        throw new Error("Action not found")
    }
  }
}
