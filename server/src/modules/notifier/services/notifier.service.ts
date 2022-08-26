import { Injectable } from "@nestjs/common"
import { FirebaseService } from "modules/firebase/services/firebase.service"
import { MailerService } from "modules/mailer/services/mailer.service"
import {
  NotifierRecipient,
  NotifyUserOptions,
} from "modules/notifier/models/notifier"
import { Notifier } from "modules/notifier/models/notifier.interface"
import { EmailNotifier } from "modules/notifier/notifiers/email-notifier"
import { FcmNotifier } from "modules/notifier/notifiers/fcm-notifier"

@Injectable()
export class NotifierService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly firebaseService: FirebaseService,
  ) {}

  private getNotifier(recipient: NotifierRecipient): Notifier {
    switch (recipient.type) {
      case "email":
        return new EmailNotifier(this.mailerService, recipient.email)
      case "fcm":
        return new FcmNotifier(this.firebaseService, recipient)
      default:
        throw new Error("Notifier type not found")
    }
  }

  notifyUser(options: NotifyUserOptions) {
    const { recipient, data } = options
    const notifier = this.getNotifier(recipient)

    switch (data.type) {
      case "new_subscription":
        return notifier.onNewSubscription(data.payload)
      case "calendar_changed":
        return notifier.onCalendarChanged(data.payload)
      default:
        throw new Error("Action not found")
    }
  }
}
