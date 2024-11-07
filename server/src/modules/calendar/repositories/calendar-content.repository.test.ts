import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarEventEmitterModule } from "modules/calendar-event-emitter/calendar-event-emitter.module"
import { CalendarContentEventEmitter } from "modules/calendar-event-emitter/events/calendar-content.event-emitter"
import { CalendarModule } from "modules/calendar/calendar.module"
import { calendarContentFactory } from "modules/calendar/factories/calendar-content.factory"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { CalendarContentRepository } from "modules/calendar/repositories/calendar-content.repository"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"

describe("CalendarContentRepository", () => {
  let app: NestExpressApplication
  let repository: CalendarContentRepository
  let dataSource: DataSource

  beforeEach(async () => {
    app = await createTestApp({
      imports: [CalendarModule, CalendarEventEmitterModule],
    })
    repository = app.get(CalendarContentRepository)
    dataSource = app.get(DataSource)
  })

  describe("save", () => {
    let updatedListener: jest.Mock

    beforeEach(() => {
      updatedListener = jest.fn()
      app
        .get(CalendarContentEventEmitter)
        .on("calendarContentUpdated", updatedListener)
    })

    it("creates a calendar content", async () => {
      const calendar = await calendarFactory().create({ content: undefined })
      const events = [calendarEventFactory().build()]

      await assertChanges(dataSource, [[CalendarContent, 1]], () =>
        repository.save(calendar.id, { events }),
      )

      const calendarContent = await dataSource
        .getRepository(CalendarContent)
        .findOneByOrFail({ calendar: { id: calendar.id } })

      expect(calendarContent.events[0].uid).toEqual(events[0].uid)
      expect(updatedListener).not.toHaveBeenCalled()
    })

    it("updates a calendar content", async () => {
      const oldEvents = [calendarEventFactory().build()]
      const newEvents = [
        calendarEventFactory().build({ uid: "new-uid" }),
        calendarEventFactory().build(),
      ]

      const calendarContent = await calendarContentFactory().create({
        events: oldEvents,
      })

      await assertChanges(dataSource, [[CalendarContent, 0]], () =>
        repository.save(calendarContent.calendarId, { events: newEvents }),
      )

      const updatedCalendarContent = await dataSource
        .getRepository(CalendarContent)
        .findOneByOrFail({ id: calendarContent.id })

      expect(updatedCalendarContent.events[0].uid).toEqual(newEvents[0].uid)
      expect(updatedCalendarContent.events[1].uid).toEqual(newEvents[1].uid)

      expect(updatedListener).toHaveBeenCalled()
      const updatedListenerParams = updatedListener.mock.calls[0][0]
      expect(updatedListenerParams.calendarId).toBe(calendarContent.calendarId)
      expect(updatedListenerParams.oldCalendarEvents).toEqual(oldEvents)
      expect(updatedListenerParams.newCalendarEvents).toEqual(newEvents)
    })
  })
})
