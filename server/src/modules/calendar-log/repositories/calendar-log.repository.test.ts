import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { CalendarChange } from "modules/calendar-log/models/calendar-change.model"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"

describe("CalendarLogRepository", () => {
  let app: NestExpressApplication
  let repository: CalendarLogRepository
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({
      imports: [CalendarLogModule],
    })
    repository = app.get(CalendarLogRepository)
    dataSource = app.get(DataSource)
  })

  describe("createForCalendar", () => {
    it("creates a calendar log", async () => {
      const calendar = await calendarFactory().create()
      const calendarChange: CalendarChange = {
        oldItems: [],
        newItems: [calendarEventFactory().build()],
        changedItems: [],
      }

      await assertChanges(dataSource, [[CalendarLog, 1]], () =>
        repository.createForCalendar({
          calendarChange,
          calendarId: calendar.id,
        }),
      )

      const calendarLog = await dataSource
        .getRepository(CalendarLog)
        .findOneByOrFail({ calendar: { id: calendar.id } })

      expect(calendarLog.calendarChange).toEqual(calendarChange)
    })
  })
})
