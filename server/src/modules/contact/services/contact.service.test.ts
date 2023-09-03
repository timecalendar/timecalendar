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
        schoolId: "456",
        schoolName: "School Name",
        gradeName: "Grade Name",
        deviceInfo: "Device Info",
      }

      await service.sendMessage(sendMessageDto)

      expect(crispClient.createConversation).toHaveBeenCalledWith({
        message: "Message",
        email: "martin.matin@email.com",
        name: "Martin Matin",
        data: {
          schoolId: "456",
          schoolName: "School Name",
          gradeName: "Grade Name",
          deviceInfo: "Device Info",
          calendarIds: "123",
        },
      })
    })
  })
})
