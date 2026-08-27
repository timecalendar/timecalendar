import { Injectable, ServiceUnavailableException } from "@nestjs/common"
import {
  CrispClient,
  CrispDeliveryError,
} from "modules/contact/clients/crisp.client"
import { emailToName } from "modules/contact/helpers/email-to-name"
import { SendMessageDto } from "modules/contact/models/dto/send-message.dto"
import { ContactMetricsService } from "modules/contact/services/contact-metrics.service"
import { removeUndefinedValues } from "modules/shared/helpers/remove-undefined-values"

export const CONTACT_UNAVAILABLE_MESSAGE =
  "Contact service is temporarily unavailable. Please try again."

@Injectable()
export class ContactService {
  constructor(
    private readonly crispClient: CrispClient,
    private readonly metrics: ContactMetricsService,
  ) {}

  async sendMessage(message: SendMessageDto) {
    try {
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
    } catch (error) {
      if (!(error instanceof CrispDeliveryError)) throw error

      this.metrics.add({
        result: "error",
        stage: error.stage,
      })
      throw new ServiceUnavailableException(CONTACT_UNAVAILABLE_MESSAGE)
    }

    this.metrics.add({
      result: "success",
      stage: "complete",
    })
  }
}
