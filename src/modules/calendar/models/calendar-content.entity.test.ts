import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarModule } from "modules/calendar/calendar.module"
import { calendarContentFactory } from "modules/calendar/factories/calendar-content.factory"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import createTestApp from "test-utils/create-test-app"
import { DataSource, Repository } from "typeorm"

describe("CalendarContentEntity", () => {
  let app: NestExpressApplication
  let dataSource: DataSource
  let repository: Repository<CalendarContent>

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarModule] })
    dataSource = app.get(DataSource)
    repository = dataSource.getRepository(CalendarContent)
  })

  describe("events transform", () => {
    it("transforms dates from json data", async () => {
      const event = calendarEventFactory.build()
      const created = await calendarContentFactory().create({
        events: [event],
      })

      const content = await repository.findOneByOrFail({ id: created.id })

      expect(content.events[0] instanceof CalendarEvent).toBeTruthy()
      expect(content.events[0].startsAt instanceof Date).toBeTruthy()
      expect(content.events[0].endsAt instanceof Date).toBeTruthy()
      expect(content.events[0].exportedAt instanceof Date).toBeTruthy()
      expect(content.events[0].startsAt).toEqual(event.startsAt)
      expect(content.events[0].endsAt).toEqual(event.endsAt)
      expect(content.events[0].exportedAt).toEqual(event.exportedAt)
    })
  })
})
