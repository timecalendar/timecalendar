import { existsSync } from "fs"
import { join } from "path"
import { Injectable, Logger } from "@nestjs/common"
import { renderFile } from "ejs"
import { Transporter, createTransport } from "nodemailer"
import Mail from "nodemailer/lib/mailer"
import { SMTP_FROM, SMTP_URL } from "config/constants"
import { MailerRecipient } from "modules/mailer/models/mailer-recipient.model"
import { AppMailerTemplate } from "modules/mailer/models/mailer-template.model"

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name)
  private transporter?: Transporter

  /**
   * Builds the transport on first send, never in a property initialiser.
   *
   * `MailerModule` sits in the `AppModule` graph and Nest instantiates every
   * provider at bootstrap, so anything a property initialiser throws is a boot
   * crash. `createTransport("")` does throw, and `SMTP_URL` is `""` whenever the
   * environment variable is absent (`config/constants`) — that empty value is
   * the supported "mail is disabled" state, not a misconfiguration to fail on.
   */
  private getTransporter() {
    this.transporter ??= createTransport(SMTP_URL)
    return this.transporter
  }

  private getRecipientOptions(recipient: MailerRecipient): Mail.Options {
    return {
      from: SMTP_FROM,
      to: recipient.email,
    }
  }

  private async renderTemplate({ template, data }: AppMailerTemplate) {
    const path = join(__dirname, "../../assets/templates/", `${template}.ejs`)

    if (!existsSync(path)) {
      throw new Error("The template does not exist")
    }

    const html = await renderFile(path, data, {})

    return html
  }

  async sendEmail(
    recipient: MailerRecipient,
    subject: string,
    template: AppMailerTemplate,
  ) {
    if (!SMTP_URL) {
      this.logger.warn(
        `SMTP_URL is not configured — skipping email "${subject}" to ${recipient.email}`,
      )
      return
    }

    const html = await this.renderTemplate(template)
    const options: Mail.Options = {
      ...this.getRecipientOptions(recipient),
      subject,
      html,
    }

    try {
      return await this.getTransporter().sendMail(options)
    } catch (err) {
      // Also covers a malformed SMTP_URL: building the transport is lazy, so it
      // fails here rather than at boot. Contained, never propagated.
      this.logger.warn(
        `Failed to send email "${subject}" to ${recipient.email}`,
        err,
      )
    }
  }
}
