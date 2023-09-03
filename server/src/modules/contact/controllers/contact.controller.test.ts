import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CrispClient } from "modules/contact/clients/crisp.client"
import { ContactModule } from "modules/contact/contact.module"
import createTestApp from "test-utils/create-test-app"

describe("ContactController", () => {
  let app: NestExpressApplication
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
  })

  describe("POST /contact", () => {
    it("sends a message", async () => {
      const calendar = await calendarFactory().school().create()

      await request(app)
        .post("/contact")
        .send({
          message: "My message",
          email: "martin.matin@email.com",
          calendarIds: [calendar.id],
          schoolId: calendar.school?.id,
          gradeName: "My Grade",
          deviceInfo: "iPhone 14 Pro",
        })
        .expect(201)

      expect(crispClient.createConversation).toHaveBeenCalledWith({
        message: "My message",
        email: "martin.matin@email.com",
        name: "Martin Matin",
        data: {
          schoolId: calendar.school?.id,
          gradeName: "My Grade",
          deviceInfo: "iPhone 14 Pro",
          calendarIds: calendar.id,
        },
      })
    })
  })
})
