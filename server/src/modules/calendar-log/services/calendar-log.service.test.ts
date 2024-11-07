import { NestExpressApplication } from "@nestjs/platform-express"
import MockDate from "lib/mock-date"
import { CalendarEventEmitterModule } from "modules/calendar-event-emitter/calendar-event-emitter.module"
import { CalendarContentEventEmitter } from "modules/calendar-event-emitter/events/calendar-content.event-emitter"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarLogService } from "modules/calendar-log/services/calendar-log.service"
import {
  CalendarEventFactory,
  calendarEventFactory,
} from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"

describe("CalendarLogService", () => {
  let app: NestExpressApplication
  let service: CalendarLogService
  let emitter: CalendarContentEventEmitter
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({
      imports: [CalendarLogModule, CalendarEventEmitterModule],
    })
    service = app.get(CalendarLogService)
    emitter = app.get(CalendarContentEventEmitter)
    dataSource = app.get(DataSource)
  })

  beforeEach(() => {
    MockDate.set(new Date("2023-01-01T00:00:00Z"))
  })

  describe("onCalendarContentChanged", () => {
    it("listens the emitter and creates a calendar log with changes", async () => {
      const oldCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 3 })
      const newCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 3 })

      // Event 1 has title changed
      newCalendarEvents[0].title = "New title"

      // Event 2 does not change
      newCalendarEvents[1] = oldCalendarEvents[1]

      // Event 3 is removed and replaced by a new event
      newCalendarEvents[2] = calendarEventFactory().build({
        uid: "new-event-3",
        title: "New Event 3",
        startsAt: new Date("2023-08-30T07:00:00.000Z"),
        endsAt: new Date("2023-08-30T08:00:00.000Z"),
      })

      const calendar = await calendarFactory()
        .transient({ events: oldCalendarEvents })
        .create()

      await assertChanges(dataSource, [[CalendarLog, 1]], () =>
        emitter.emit("calendarContentUpdated", {
          calendarId: calendar.id,
          oldCalendarEvents,
          newCalendarEvents,
        }),
      )

      const calendarLog = await dataSource
        .getRepository(CalendarLog)
        .findOneByOrFail({ calendar: { id: calendar.id } })

      expect(calendarLog.calendarChange.oldItems.length).toBe(1)
      expect(calendarLog.calendarChange.oldItems[0]).toEqual(
        expect.objectContaining({
          uid: oldCalendarEvents[2].uid,
          title: oldCalendarEvents[2].title,
          startsAt: oldCalendarEvents[2].startsAt,
          endsAt: oldCalendarEvents[2].endsAt,
        }),
      )

      expect(calendarLog.calendarChange.newItems.length).toBe(1)
      expect(calendarLog.calendarChange.newItems[0]).toEqual(
        expect.objectContaining({
          uid: newCalendarEvents[2].uid,
          title: newCalendarEvents[2].title,
          startsAt: newCalendarEvents[2].startsAt,
          endsAt: newCalendarEvents[2].endsAt,
        }),
      )

      expect(calendarLog.calendarChange.changedItems.length).toBe(1)
    })

    it("does not create a calendar log if there is no change", async () => {
      const calendar = await calendarFactory().create()

      await assertChanges(dataSource, [[CalendarLog, 0]], () =>
        service.onCalendarContentChanged({
          calendarId: calendar.id,
          oldCalendarEvents: [],
          newCalendarEvents: [],
        }),
      )
    })
  })
})
