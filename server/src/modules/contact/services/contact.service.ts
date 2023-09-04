import { Injectable } from "@nestjs/common"
import { CrispClient } from "modules/contact/clients/crisp.client"
import { emailToName } from "modules/contact/helpers/email-to-name"
import { SendMessageDto } from "modules/contact/models/dto/send-message.dto"
import { removeUndefinedValues } from "modules/shared/helpers/remove-undefined-values"

@Injectable()
export class ContactService {
  constructor(private readonly crispClient: CrispClient) {}

  async sendMessage(message: SendMessageDto) {
    await this.crispClient.createConversation({
      message: message.message,
      email: message.email,
      name: emailToName(message.email),
      data: removeUndefinedValues({
        schoolId: message.schoolId,
        schoolName: message.schoolName,
        gradeName: message.gradeName,
        deviceInfo: message.deviceInfo,
        calendarUrl: message.calendarUrl,
        calendarIds: message.calendarIds?.join(","),
      }),
    })
  }
}
