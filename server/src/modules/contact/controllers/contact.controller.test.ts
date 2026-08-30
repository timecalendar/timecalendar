import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import {
  CrispClient,
  CrispDeliveryError,
} from "modules/contact/clients/crisp.client"
import { ContactModule } from "modules/contact/contact.module"
import { CONTACT_UNAVAILABLE_MESSAGE } from "modules/contact/services/contact.service"
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

  beforeEach(() => {
    jest.clearAllMocks()
    crispClient.createConversation.mockResolvedValue(undefined)
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

    it("forwards gradeName and calendarName as independent metadata", async () => {
      await request(app)
        .post("/contact")
        .send({
          message: "My message",
          email: "martin.matin@email.com",
          gradeName: "My Grade",
          calendarName: "My Calendar",
        })
        .expect(201)

      expect(crispClient.createConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            gradeName: "My Grade",
            calendarName: "My Calendar",
          },
        }),
      )
    })

    it("forwards a legacy gradeName-only payload with no calendarName key", async () => {
      await request(app)
        .post("/contact")
        .send({
          message: "My message",
          email: "martin.matin@email.com",
          gradeName: "My Grade",
        })
        .expect(201)

      expect(crispClient.createConversation).toHaveBeenCalledWith(
        expect.objectContaining({ data: { gradeName: "My Grade" } }),
      )
    })

    it("keeps DTO validation failures at 400", async () => {
      await request(app).post("/contact").send({}).expect(400)

      expect(crispClient.createConversation).not.toHaveBeenCalled()
    })

    it("returns a static 503 when Crisp rejects metadata", async () => {
      crispClient.createConversation.mockRejectedValueOnce(
        new CrispDeliveryError("metadata"),
      )

      const response = await request(app)
        .post("/contact")
        .send({
          message: "private submitted message",
          email: "private@example.fr",
        })
        .expect(503)

      expect(response.body).toEqual({
        statusCode: 503,
        message: CONTACT_UNAVAILABLE_MESSAGE,
        error: "Service Unavailable",
      })
      expect(JSON.stringify(response.body)).not.toMatch(
        /invalid_data|private|example\.fr|session/i,
      )
      expect(crispClient.createConversation).toHaveBeenCalledTimes(1)
    })
  })
})
