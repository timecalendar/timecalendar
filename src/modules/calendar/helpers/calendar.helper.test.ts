import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarModule } from "modules/calendar/calendar.module"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarHelper } from "modules/calendar/helpers/calendar.helper"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"

describe("CalendarHelper", () => {
  let app: NestExpressApplication
  let dataSource: DataSource
  let helper: CalendarHelper

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarModule] })
    helper = app.get(CalendarHelper)
    dataSource = app.get(DataSource)
  })

  describe("withContentForPublic", () => {
    it("returns a calendar with content", async () => {
      const event = calendarEventFactory.build()
      const created = await calendarFactory()
        .transient({ events: [event] })
        .create()
      const calendarWithContent = await dataSource
        .getRepository(Calendar)
        .findOneOrFail({
          relations: { school: true, content: true },
          where: { id: created.id },
        })

      const { calendar, events } =
        helper.withContentForPublic(calendarWithContent)

      expect(calendar.id).toBe(created.id)
      expect(calendar.name).toBe(created.name)
      expect(events.length).toBe(1)
      expect(events[0].uid).toBe(event.uid)
    })
  })

  describe("forPublic", () => {
    it("returns a calendar for public", async () => {
      const calendar = await calendarFactory().create()

      const result = helper.forPublic(calendar)

      expect(result.id).toBe(calendar.id)
      expect(result.name).toBe(calendar.name)
      expect(result.schoolName).toBe(calendar.schoolName)
    })

    it("returns the school name", async () => {
      const created = await calendarFactory().school().create()
      const calendar = await dataSource.getRepository(Calendar).findOneOrFail({
        relations: { school: true },
        where: { id: created.id },
      })
      if (!calendar.school) throw new Error()

      const result = helper.forPublic(calendar)

      expect(result.id).toBe(calendar.id)
      expect(result.name).toBe(calendar.name)
      expect(result.schoolName).toBe(calendar.school.name)
    })
  })
})
