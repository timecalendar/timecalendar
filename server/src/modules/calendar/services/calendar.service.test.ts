import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarModule } from "modules/calendar/calendar.module"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarService } from "modules/calendar/services/calendar.service"
import createTestApp from "test-utils/create-test-app"
import { CalendarLogService } from "modules/calendar-log/services/calendar-log.service"
import { CalendarSourceHealthStatus } from "modules/calendar/models/source-health.model"

describe("CalendarService", () => {
  let app: NestExpressApplication
  let service: CalendarService
  let calendarLogService: CalendarLogService

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarLogModule, CalendarModule] })
    service = app.get(CalendarService)
    calendarLogService = app.get(CalendarLogService)
  })

  describe("findCalendarByToken", () => {
    it("finds a school calendar by token", async () => {
      const calendar = await calendarFactory().school().create()

      const result = await service.findCalendarByToken(calendar.token)

      expect(result.token).toBe(calendar.token)
      expect(result.schoolName).toBe("My Gaming Academia")
      expect(result.name).toBe("My Calendar")
    })

    it("finds a calendar by token", async () => {
      const calendar = await calendarFactory().create()

      const result = await service.findCalendarByToken(calendar.token)

      expect(result.token).toBe(calendar.token)
      expect(result.schoolName).toBe("My School")
      expect(result.name).toBe("My Calendar")
    })
  })

  describe("calendarsForPublic", () => {
    it("returns multiple calendars", async () => {
      const event = calendarEventFactory.build()
      const created = [
        await calendarFactory().school().create(),
        await calendarFactory()
          .transient({ events: [event] })
          .create(),
      ]

      const calendars = await service.findCalendarsForPublic(
        created.map((calendar) => calendar.token),
      )

      expect(calendars.length).toBe(2)
      const [{ calendar, events }] = calendars
      expect(calendar.id).toBe(created[1].id)
      expect(calendar.name).toBe(created[1].name)
      expect(events.length).toBe(1)
      expect(events[0].uid).toBe(event.uid)
      expect(calendars[0].sourceHealth.status).toBe(
        CalendarSourceHealthStatus.Unknown,
      )
    })

    it("loads successful-change evidence once for a batch", async () => {
      const created = [
        await calendarFactory().create(),
        await calendarFactory().create(),
      ]
      const evidence = jest.spyOn(
        calendarLogService,
        "getLatestChangeAtByCalendarIds",
      )

      await service.findCalendarsForPublic(
        created.map((calendar) => calendar.token),
      )

      expect(evidence).toHaveBeenCalledTimes(1)
      expect(evidence).toHaveBeenCalledWith(
        expect.arrayContaining(created.map((calendar) => calendar.id)),
      )
    })
  })
})
