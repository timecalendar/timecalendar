import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { CalendarModule } from "modules/calendar/calendar.module"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import createTestApp from "test-utils/create-test-app"

describe("CalendarSyncController", () => {
  let app: NestExpressApplication

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarModule] })
  })

  describe("GET /calendars/by-token/:token", () => {
    it("finds a calendar by token", async () => {
      const calendar = await calendarFactory().create()

      const { body } = await request(app)
        .get(`/calendars/by-token/${calendar.token}`)
        .expect(200)

      expect(body.token).toBe(calendar.token)
      expect(body.schoolName).toBe("My School")
      expect(body.name).toBe("My Calendar")
    })

    it("returns not found", async () => {
      await request(app).get(`/calendars/by-token/123`).expect(404)
    })
  })
})
