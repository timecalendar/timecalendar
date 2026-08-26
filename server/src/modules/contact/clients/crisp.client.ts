import { Injectable } from "@nestjs/common"
import { CRISP_IDENTIFIER, CRISP_KEY, CRISP_WEBSITE_ID } from "config/constants"
import Crisp from "crisp-api"

type CreateConversationParams = {
  message: string
  email: string
  name: string
  data: Record<string, string>
}

export type CrispDeliveryStage = "create" | "metadata" | "message"

export class CrispDeliveryError extends Error {
  constructor(readonly stage: CrispDeliveryStage) {
    super("Contact delivery failed")
    Object.defineProperty(this, "name", { value: "CrispDeliveryError" })
  }
}

type ConversationMetasParams = Omit<CreateConversationParams, "message">

const nonEmpty = (value: string): string | undefined => {
  const normalized = value.trim()
  return normalized || undefined
}

export const buildContactMetas = ({
  email,
  name,
  data,
}: ConversationMetasParams) => {
  const nickname = nonEmpty(name)
  const normalizedData = Object.fromEntries(
    Object.entries(data).flatMap(([key, value]) => {
      const normalized = nonEmpty(value)
      return normalized ? [[key, normalized]] : []
    }),
  )

  return {
    email,
    ...(nickname ? { nickname } : {}),
    ...(Object.keys(normalizedData).length > 0 ? { data: normalizedData } : {}),
  }
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
    const { session_id: sessionId } = await this.runStage<{
      session_id: string
    }>("create", () =>
      this.client.website.createNewConversation(CRISP_WEBSITE_ID),
    )

    const metas = buildContactMetas({ email, name, data })
    await this.runStage("metadata", () =>
      this.client.website.updateConversationMetas(
        CRISP_WEBSITE_ID,
        sessionId,
        metas,
      ),
    )

    const crispMessage = {
      type: "text",
      from: "user",
      origin: "chat",
      content: message,
    }
    await this.runStage("message", () =>
      this.client.website.sendMessageInConversation(
        CRISP_WEBSITE_ID,
        sessionId,
        crispMessage,
      ),
    )
  }

  private async runStage<T>(
    stage: CrispDeliveryStage,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation()
    } catch {
      throw new CrispDeliveryError(stage)
    }
  }
}
