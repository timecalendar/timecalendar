import { CRISP_WEBSITE_ID } from "config/constants"
import {
  buildContactMetas,
  CrispClient,
  CrispDeliveryError,
  CrispDeliveryStage,
} from "modules/contact/clients/crisp.client"

const privateRequest = {
  message: "private submitted message",
  email: "private@example.fr",
  name: "Private Person",
  data: { calendarIds: "calendar-private", schoolName: "Private School" },
}

const buildClient = () => {
  const operations: string[] = []
  const website = {
    createNewConversation: jest.fn(async () => {
      operations.push("create")
      return { session_id: "private-session-id" }
    }),
    updateConversationMetas: jest.fn(async () => {
      operations.push("metadata")
    }),
    sendMessageInConversation: jest.fn(async () => {
      operations.push("message")
    }),
  }
  const client = Object.create(CrispClient.prototype) as CrispClient
  client.client = { website }
  return { client, website, operations }
}

describe("buildContactMetas", () => {
  it("omits the empty nickname produced by a numeric-only e-mail and empty data", () => {
    expect(
      buildContactMetas({ email: "123@example.fr", name: "", data: {} }),
    ).toEqual({ email: "123@example.fr" })
  })

  it("omits empty calendar IDs and other blank optional values", () => {
    expect(
      buildContactMetas({
        email: "student@example.fr",
        name: "Student",
        data: {
          calendarIds: "",
          schoolId: "   ",
          calendarName: "   ",
          schoolName: "University",
        },
      }),
    ).toEqual({
      email: "student@example.fr",
      nickname: "Student",
      data: { schoolName: "University" },
    })
  })

  it("normalizes and preserves fully enriched metadata", () => {
    expect(
      buildContactMetas({
        email: "student@example.fr",
        name: " Student Name ",
        data: {
          calendarIds: "one,two",
          schoolId: " school ",
          gradeName: "Grade",
        },
      }),
    ).toEqual({
      email: "student@example.fr",
      nickname: "Student Name",
      data: {
        calendarIds: "one,two",
        schoolId: "school",
        gradeName: "Grade",
      },
    })
  })
})

describe("CrispClient", () => {
  it("runs the three operations in order with exact privacy-bounded arguments", async () => {
    const { client, website, operations } = buildClient()

    await client.createConversation(privateRequest)

    expect(operations).toEqual(["create", "metadata", "message"])
    expect(website.createNewConversation).toHaveBeenCalledWith(CRISP_WEBSITE_ID)
    expect(website.updateConversationMetas).toHaveBeenCalledWith(
      CRISP_WEBSITE_ID,
      "private-session-id",
      {
        email: "private@example.fr",
        nickname: "Private Person",
        data: {
          calendarIds: "calendar-private",
          schoolName: "Private School",
        },
      },
    )
    expect(website.sendMessageInConversation).toHaveBeenCalledWith(
      CRISP_WEBSITE_ID,
      "private-session-id",
      {
        type: "text",
        from: "user",
        origin: "chat",
        content: "private submitted message",
      },
    )
  })

  it.each<CrispDeliveryStage>(["create", "metadata", "message"])(
    "classifies a %s rejection without exposing private or vendor data",
    async (stage) => {
      const { client, website } = buildClient()
      const vendorError = new Error(
        "invalid_data private-session-id private@example.fr private submitted message",
      )
      const operation = {
        create: website.createNewConversation,
        metadata: website.updateConversationMetas,
        message: website.sendMessageInConversation,
      }[stage]
      operation.mockRejectedValueOnce(vendorError)

      const error = await client
        .createConversation(privateRequest)
        .catch((caught: unknown) => caught)

      expect(error).toBeInstanceOf(CrispDeliveryError)
      expect(error).toMatchObject({ stage, message: "Contact delivery failed" })
      expect(JSON.stringify(error)).toBe(JSON.stringify({ stage }))
      expect(String(error)).not.toMatch(
        /invalid_data|private-session-id|private@example|submitted message/,
      )
      if (stage === "create") {
        expect(website.updateConversationMetas).not.toHaveBeenCalled()
      }
      if (stage !== "message") {
        expect(website.sendMessageInConversation).not.toHaveBeenCalled()
      }
    },
  )
})
