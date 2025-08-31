import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { calendarLogFactory } from "modules/calendar-log/factories/calendar-log.factory"
import createTestApp from "test-utils/create-test-app"

describe("CalendarLogController", () => {
  let app: NestExpressApplication

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarLogModule] })
  })

  describe("POST /calendar-logs/search", () => {
    it("returns calendar logs for given tokens", async () => {
      // Arrange
      const calendar1 = await calendarFactory().create()
      const calendar2 = await calendarFactory().create()

      const log1 = await calendarLogFactory()
        .calendar(calendar1.id)
        .params({
          calendarChange: {
            oldItems: [],
            newItems: [
              {
                uid: "event-1",
                title: "New Event 1",
                location: "Location 1",
                startsAt: new Date("2025-01-01T10:00:00Z"),
                endsAt: new Date("2025-01-01T11:00:00Z"),
              },
            ],
            changedItems: [],
          },
        })
        .create()

      const log2 = await calendarLogFactory()
        .calendar(calendar2.id)
        .params({
          calendarChange: {
            oldItems: [
              {
                uid: "event-2",
                title: "Old Event 2",
                location: "Location 2",
                startsAt: new Date("2025-01-02T10:00:00Z"),
                endsAt: new Date("2025-01-02T11:00:00Z"),
              },
            ],
            newItems: [],
            changedItems: [],
          },
        })
        .create()

      // Act
      const { body } = await request(app)
        .post("/calendar-logs/search")
        .send({
          tokens: [calendar1.token, calendar2.token],
        })
        .expect(200)

      // Assert
      expect(body).toHaveLength(2)

      const logIds = body.map((log: any) => log.id).sort()
      expect(logIds).toEqual([log1.id, log2.id].sort())

      const log1Response = body.find((log: any) => log.id === log1.id)
      expect(log1Response).toMatchObject({
        id: log1.id,
        calendarId: calendar1.id,
        calendarToken: calendar1.token,
        calendarName: calendar1.name,
        calendarChange: {
          oldItems: [],
          newItems: [
            {
              uid: "event-1",
              title: "New Event 1",
              location: "Location 1",
              startsAt: "2025-01-01T10:00:00.000Z",
              endsAt: "2025-01-01T11:00:00.000Z",
            },
          ],
          changedItems: [],
        },
      })

      const log2Response = body.find((log: any) => log.id === log2.id)
      expect(log2Response).toMatchObject({
        id: log2.id,
        calendarId: calendar2.id,
        calendarToken: calendar2.token,
        calendarName: calendar2.name,
        calendarChange: {
          oldItems: [
            {
              uid: "event-2",
              title: "Old Event 2",
              location: "Location 2",
              startsAt: "2025-01-02T10:00:00.000Z",
              endsAt: "2025-01-02T11:00:00.000Z",
            },
          ],
          newItems: [],
          changedItems: [],
        },
      })

      // Verify timestamps are present
      expect(log1Response.createdAt).toBeDefined()
      expect(log1Response.updatedAt).toBeDefined()
      expect(log2Response.createdAt).toBeDefined()
      expect(log2Response.updatedAt).toBeDefined()
    })

    it("returns empty array for non-existent tokens", async () => {
      // Act
      const { body } = await request(app)
        .post("/calendar-logs/search")
        .send({
          tokens: ["non-existent-token-1", "non-existent-token-2"],
        })
        .expect(200)

      // Assert
      expect(body).toEqual([])
    })

    it("returns logs for subset of matching tokens", async () => {
      // Arrange
      const calendar1 = await calendarFactory().create()
      const calendar2 = await calendarFactory().create()

      const log1 = await calendarLogFactory().calendar(calendar1.id).create()
      await calendarLogFactory().calendar(calendar2.id).create() // This should not be returned

      // Act
      const { body } = await request(app)
        .post("/calendar-logs/search")
        .send({
          tokens: [calendar1.token], // Only requesting logs for calendar1
        })
        .expect(200)

      // Assert
      expect(body).toHaveLength(1)
      expect(body[0].id).toBe(log1.id)
      expect(body[0].calendarToken).toBe(calendar1.token)
    })

    it("handles multiple logs for same calendar", async () => {
      // Arrange
      const calendar = await calendarFactory().create()

      // Create two logs for the same calendar with slight delay to ensure different timestamps
      const log1 = await calendarLogFactory().calendar(calendar.id).create()
      await new Promise((resolve) => setTimeout(resolve, 10))
      const log2 = await calendarLogFactory().calendar(calendar.id).create()

      // Act
      const { body } = await request(app)
        .post("/calendar-logs/search")
        .send({
          tokens: [calendar.token],
        })
        .expect(200)

      // Assert
      expect(body).toHaveLength(2)

      // Verify both logs are returned
      const logIds = body.map((log: any) => log.id).sort()
      expect(logIds).toEqual([log1.id, log2.id].sort())

      // Verify they're ordered by createdAt DESC (most recent first)
      expect(new Date(body[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(body[1].createdAt).getTime(),
      )
    })

    it("validates request payload - missing tokens", async () => {
      // Act
      await request(app).post("/calendar-logs/search").send({}).expect(400)
    })
  })
})
