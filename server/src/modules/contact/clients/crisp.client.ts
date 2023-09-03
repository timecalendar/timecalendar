import { Injectable } from "@nestjs/common"
import { CRISP_IDENTIFIER, CRISP_KEY, CRISP_WEBSITE_ID } from "config/constants"
import Crisp from "crisp-api"

type CreateConversationParams = {
  message: string
  email: string
  name: string
  data: Record<string, string>
}

@Injectable()
export class CrispClient {
  client: any // Crisp is not typed
  enabled: boolean

  constructor() {
    this.enabled = Boolean(CRISP_IDENTIFIER) && Boolean(CRISP_KEY)
    this.client = new Crisp()

    if (this.enabled)
      this.client.authenticateTier("plugin", CRISP_IDENTIFIER, CRISP_KEY)
  }

  async createConversation({
    message,
    email,
    name,
    data,
  }: CreateConversationParams) {
    const { session_id: sessionId } =
      await this.client.website.createNewConversation(CRISP_WEBSITE_ID)

    const metas = {
      nickname: name,
      email,
      data,
    }
    await this.client.website.updateConversationMetas(
      CRISP_WEBSITE_ID,
      sessionId,
      metas,
    )

    const crispMessage = {
      type: "text",
      from: "user",
      origin: "chat",
      content: message,
    }
    await this.client.website.sendMessageInConversation(
      CRISP_WEBSITE_ID,
      sessionId,
      crispMessage,
    )
  }
}
