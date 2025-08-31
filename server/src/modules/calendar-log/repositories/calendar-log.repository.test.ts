import { NestExpressApplication } from "@nestjs/platform-express"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { calendarLogFactory } from "modules/calendar-log/factories/calendar-log.factory"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import createTestApp from "test-utils/create-test-app"

describe("CalendarLogRepository", () => {
  let app: NestExpressApplication
  let repository: CalendarLogRepository

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarLogModule] })
    repository = app.get(CalendarLogRepository)
  })

  describe("save", () => {
    it("saves a calendar log", async () => {
      const calendar = await calendarFactory().create()
      const calendarLogData = {
        calendar,
        calendarChange: {
          oldItems: [],
          newItems: [
            {
              uid: "event-1",
              title: "Test Event",
              location: "Test Location",
              startsAt: new Date("2025-01-01T10:00:00Z"),
              endsAt: new Date("2025-01-01T11:00:00Z"),
            },
          ],
          changedItems: [],
        },
      }

      const savedLog = await repository.save(calendarLogData)

      expect(savedLog.id).toBeDefined()
      expect(savedLog.calendar.id).toBe(calendar.id)
      expect(savedLog.calendarChange.newItems).toHaveLength(1)
      expect(savedLog.calendarChange.newItems[0].title).toBe("Test Event")
    })
  })

  describe("findByCalendarId", () => {
    it("returns no logs when calendar has no logs", async () => {
      const calendar = await calendarFactory().create()
      const logs = await repository.findByCalendarId(calendar.id)
      expect(logs).toHaveLength(0)
    })

    it("returns logs for a specific calendar", async () => {
      const calendar = await calendarFactory().create()
      const log = await calendarLogFactory().calendar(calendar.id).create()

      const logs = await repository.findByCalendarId(calendar.id)

      expect(logs).toHaveLength(1)
      expect(logs[0].id).toBe(log.id)
      expect(logs[0].calendar.id).toBe(calendar.id)
    })

    it("does not return logs from other calendars", async () => {
      const calendar1 = await calendarFactory().create()
      const calendar2 = await calendarFactory().create()
      await calendarLogFactory().calendar(calendar2.id).create()

      const logs = await repository.findByCalendarId(calendar1.id)

      expect(logs).toHaveLength(0)
    })

    it("returns logs ordered by createdAt DESC", async () => {
      const calendar = await calendarFactory().create()
      // Create logs with slight delay to ensure different timestamps
      const log1 = await calendarLogFactory().calendar(calendar.id).create()
      await new Promise((resolve) => setTimeout(resolve, 10))
      const log2 = await calendarLogFactory().calendar(calendar.id).create()

      const logs = await repository.findByCalendarId(calendar.id)

      expect(logs).toHaveLength(2)
      expect(logs[0].id).toBe(log2.id) // Most recent first
      expect(logs[1].id).toBe(log1.id)
    })
  })

  describe("findByCalendarTokens", () => {
    it("returns no logs when no calendars match tokens", async () => {
      const logs = await repository.findByCalendarTokens(["non-existent-token"])
      expect(logs).toHaveLength(0)
    })

    it("returns logs for calendars with matching tokens", async () => {
      const calendar1 = await calendarFactory().create()
      const calendar2 = await calendarFactory().create()
      const log1 = await calendarLogFactory().calendar(calendar1.id).create()
      const log2 = await calendarLogFactory().calendar(calendar2.id).create()

      const logs = await repository.findByCalendarTokens([
        calendar1.token,
        calendar2.token,
      ])

      expect(logs).toHaveLength(2)
      const logIds = logs.map((log) => log.id).sort()
      expect(logIds).toEqual([log1.id, log2.id].sort())
    })

    it("returns logs for subset of matching tokens", async () => {
      const calendar1 = await calendarFactory().create()
      const calendar2 = await calendarFactory().create()
      const log1 = await calendarLogFactory().calendar(calendar1.id).create()
      await calendarLogFactory().calendar(calendar2.id).create()

      const logs = await repository.findByCalendarTokens([calendar1.token])

      expect(logs).toHaveLength(1)
      expect(logs[0].id).toBe(log1.id)
    })

    it("does not return duplicate logs for same token", async () => {
      const calendar = await calendarFactory().create()
      const log = await calendarLogFactory().calendar(calendar.id).create()

      const logs = await repository.findByCalendarTokens([
        calendar.token,
        calendar.token, // Duplicate token
      ])

      expect(logs).toHaveLength(1)
      expect(logs[0].id).toBe(log.id)
    })

    it("returns logs ordered by createdAt DESC", async () => {
      const calendar = await calendarFactory().create()
      // Create logs with slight delay to ensure different timestamps
      const log1 = await calendarLogFactory().calendar(calendar.id).create()
      await new Promise((resolve) => setTimeout(resolve, 10))
      const log2 = await calendarLogFactory().calendar(calendar.id).create()

      const logs = await repository.findByCalendarTokens([calendar.token])

      expect(logs).toHaveLength(2)
      expect(logs[0].id).toBe(log2.id) // Most recent first
      expect(logs[1].id).toBe(log1.id)
    })

    it("includes calendar relations", async () => {
      const calendar = await calendarFactory().create()
      await calendarLogFactory().calendar(calendar.id).create()

      const logs = await repository.findByCalendarTokens([calendar.token])

      expect(logs).toHaveLength(1)
      expect(logs[0].calendar).toBeDefined()
      expect(logs[0].calendar.id).toBe(calendar.id)
      expect(logs[0].calendar.token).toBe(calendar.token)
      expect(logs[0].calendar.name).toBe(calendar.name)
    })
  })
})
