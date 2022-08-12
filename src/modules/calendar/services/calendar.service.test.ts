import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarModule } from "modules/calendar/calendar.module"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarService } from "modules/calendar/services/calendar.service"
import createTestApp from "test-utils/create-test-app"

describe("CalendarService", () => {
  let app: NestExpressApplication
  let service: CalendarService

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarModule] })
    service = app.get(CalendarService)
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

      const calendars = await service.calendarsForPublic(
        created.map((calendar) => calendar.id),
      )

      expect(calendars.length).toBe(2)
      const [{ calendar, events }] = calendars
      expect(calendar.id).toBe(created[1].id)
      expect(calendar.name).toBe(created[1].name)
      expect(events.length).toBe(1)
      expect(events[0].uid).toBe(event.uid)
    })
  })
})
