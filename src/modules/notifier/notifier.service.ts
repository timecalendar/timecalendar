import { Injectable } from "@nestjs/common"
import { FirebaseService } from "modules/firebase/firebase.service"
import { MailerService } from "modules/mailer/mailer.service"
import { NotifierRecipient, NotifyUserOptions } from "./models/notifier"
import { EmailNotifier } from "./notifiers/email-notifier"
import { FcmNotifier } from "./notifiers/fcm-notifier"
import { Notifier } from "./models/notifier.interface"

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
