import { MailerService } from "modules/mailer/mailer.service"
import {
  OnCalendarChangedPayload,
  OnNewSubscriptionPayload,
} from "../models/notifier"
import { Notifier } from "../models/notifier.interface"

export class EmailNotifier implements Notifier {
  constructor(
    private readonly mailerService: MailerService,
    private readonly email: string,
  ) {}

  async onNewSubscription(payload: OnNewSubscriptionPayload): Promise<void> {
    await this.mailerService.sendEmail(
      { email: this.email },
      "Inscription aux notifications TimeCalendar",
      {
        template: "subscribe",
        data: payload,
      },
    )
  }

  async onCalendarChanged(payload: OnCalendarChangedPayload): Promise<void> {
    await this.mailerService.sendEmail(
      { email: this.email },
      "Inscription aux notifications TimeCalendar",
      {
        template: "notification",
        data: payload,
      },
    )
  }
}
