import { NestExpressApplication } from "@nestjs/platform-express"
import { CrispClient } from "modules/contact/clients/crisp.client"
import { ContactModule } from "modules/contact/contact.module"
import { ContactService } from "modules/contact/services/contact.service"
import createTestApp from "test-utils/create-test-app"

describe("ContactService", () => {
  let app: NestExpressApplication
  let service: ContactService
  const crispClient = { createConversation: jest.fn() }

  beforeAll(async () => {
    app = await createTestApp(
      { imports: [ContactModule] },
      {
        overrides: [
          {
            provide: CrispClient,
            useValue: crispClient,
          },
        ],
      },
    )
    service = app.get(ContactService)
  })

  describe("sendMessage", () => {
    it("should call Crisp with the correct arguments", async () => {
      const sendMessageDto = {
        message: "Message",
        email: "martin.matin@email.com",
        calendarIds: ["123"],
        gradeName: "Grade Name",
        deviceInfo: "Device Info",
        recoveryClassification: "unsupported_link" as const,
        recoveryHelpKey: "tours_export" as const,
      }

      await service.sendMessage(sendMessageDto)

      expect(crispClient.createConversation).toHaveBeenCalledWith({
        message: "Message",
        email: "martin.matin@email.com",
        name: "Martin Matin",
        data: {
          gradeName: "Grade Name",
          deviceInfo: "Device Info",
          recoveryClassification: "unsupported_link",
          recoveryHelpKey: "tours_export",
          calendarIds: "123",
        },
      })
    })
  })
})
