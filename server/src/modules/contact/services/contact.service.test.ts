import { ServiceUnavailableException } from "@nestjs/common"
import {
  CrispClient,
  CrispDeliveryError,
  CrispDeliveryStage,
} from "modules/contact/clients/crisp.client"
import { ContactMetricsService } from "modules/contact/services/contact-metrics.service"
import {
  CONTACT_UNAVAILABLE_MESSAGE,
  ContactService,
} from "modules/contact/services/contact.service"

describe("ContactService", () => {
  const createConversation = jest.fn()
  const add = jest.fn()
  const service = new ContactService(
    { createConversation } as unknown as CrispClient,
    { add } as unknown as ContactMetricsService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    createConversation.mockResolvedValue(undefined)
  })

  it("sends fully enriched feedback and increments success exactly once", async () => {
    await service.sendMessage({
      message: "Message",
      email: "martin.matin@email.com",
      calendarIds: ["123"],
      schoolId: "456",
      schoolName: "School Name",
      gradeName: "Grade Name",
      deviceInfo: "Device Info",
      calendarUrl: "https://example.fr/calendar.ics",
    })

    expect(createConversation).toHaveBeenCalledWith({
      message: "Message",
      email: "martin.matin@email.com",
      name: "Martin Matin",
      data: {
        schoolId: "456",
        schoolName: "School Name",
        gradeName: "Grade Name",
        deviceInfo: "Device Info",
        calendarUrl: "https://example.fr/calendar.ics",
        calendarIds: "123",
      },
    })
    expect(add).toHaveBeenCalledTimes(1)
    expect(add).toHaveBeenCalledWith({
      result: "success",
      stage: "complete",
    })
  })

  it("passes empty derived enrichment to the adapter for total normalization", async () => {
    await service.sendMessage({
      message: "Message",
      email: "123@email.com",
      calendarIds: [],
    })

    expect(createConversation).toHaveBeenCalledWith({
      message: "Message",
      email: "123@email.com",
      name: "",
      data: { calendarIds: "" },
    })
  })

  it.each<CrispDeliveryStage>(["create", "metadata", "message"])(
    "maps a %s rejection to one static 503 and one bounded error metric",
    async (stage) => {
      createConversation.mockRejectedValueOnce(new CrispDeliveryError(stage))

      const error = await service
        .sendMessage({
          message: "private submitted message",
          email: "private@example.fr",
        })
        .catch((caught: unknown) => caught)

      expect(error).toBeInstanceOf(ServiceUnavailableException)
      expect((error as Error).message).toBe(CONTACT_UNAVAILABLE_MESSAGE)
      expect(String(error)).not.toMatch(/private|example\.fr|invalid_data/)
      expect(add).toHaveBeenCalledTimes(1)
      expect(add).toHaveBeenCalledWith({ result: "error", stage })
      expect(add).not.toHaveBeenCalledWith(
        expect.objectContaining({ result: "success" }),
      )
    },
  )

  it("does not misclassify an unexpected application error as Crisp downtime", async () => {
    const unexpected = new Error("unexpected")
    createConversation.mockRejectedValueOnce(unexpected)

    await expect(
      service.sendMessage({ message: "Message", email: "a@b.fr" }),
    ).rejects.toBe(unexpected)
    expect(add).not.toHaveBeenCalled()
  })
})
