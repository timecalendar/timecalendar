import { existsSync } from "fs"
import { join } from "path"
import { Injectable } from "@nestjs/common"
import { renderFile } from "ejs"
import { createTransport, Transporter } from "nodemailer"
import Mail from "nodemailer/lib/mailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"
import { SMTP_FROM, SMTP_URL } from "src/config/constants"
import { MailerRecipient } from "./models/mailer-recipient.model"
import { AppMailerTemplate } from "./models/mailer-template.model"

@Injectable()
export class MailerService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo>

  constructor() {
    this.transporter = createTransport(SMTP_URL)
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
    const html = await this.renderTemplate(template)
    const options: Mail.Options = {
      ...this.getRecipientOptions(recipient),
      subject,
      html,
    }

    try {
      const rep = await this.transporter.sendMail(options)
      return rep
    } catch (err) {}
  }
}
