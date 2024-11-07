import { NestExpressApplication } from "@nestjs/platform-express"
import MockDate from "lib/mock-date"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { FindCalendarChangeService } from "modules/calendar-log/services/find-calendar-change.service"
import { CalendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import createTestApp from "test-utils/create-test-app"

describe("DetectBadIcalImplementationService", () => {
  let app: NestExpressApplication
  let service: FindCalendarChangeService

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarLogModule] })
    service = app.get(FindCalendarChangeService)
  })

  beforeEach(() => {
    MockDate.set(new Date("2022-12-01T12:00:00Z"))
  })

  describe("run", () => {
    it("returns new items", () => {
      const oldCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 2 })
      const newCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 3 })

      const calendarChange = service.run({
        oldCalendarEvents,
        newCalendarEvents,
      })

      expect(calendarChange.newItems).toHaveLength(1)
      expect(calendarChange.newItems[0]).toEqual(newCalendarEvents[2])
      expect(calendarChange.oldItems).toHaveLength(0)
      expect(calendarChange.changedItems).toHaveLength(0)
    })

    it("returns changed items", () => {
      const oldCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 2 })
      const newCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 2 })
      newCalendarEvents[0].title = "New title"

      const calendarChange = service.run({
        oldCalendarEvents,
        newCalendarEvents,
      })

      expect(calendarChange.newItems).toHaveLength(0)
      expect(calendarChange.oldItems).toHaveLength(0)
      expect(calendarChange.changedItems).toHaveLength(1)
      expect(calendarChange.changedItems[0].oldEvent).toEqual(
        oldCalendarEvents[0],
      )
      expect(calendarChange.changedItems[0].newEvent).toEqual(
        newCalendarEvents[0],
      )
    })

    it("returns old items", () => {
      const oldCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 2 })
      const newCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 1 })

      const calendarChange = service.run({
        oldCalendarEvents,
        newCalendarEvents,
      })

      expect(calendarChange.newItems).toHaveLength(0)
      expect(calendarChange.oldItems).toHaveLength(1)
      expect(calendarChange.oldItems[0]).toEqual(oldCalendarEvents[1])
      expect(calendarChange.changedItems).toHaveLength(0)
    })

    it("does not return changes for new past events", () => {
      const oldCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 2 })
      const newCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 3 })
      newCalendarEvents[2].startsAt = new Date("2022-11-01T12:00:00Z")
      newCalendarEvents[2].endsAt = new Date("2022-11-01T13:00:00Z")

      const calendarChange = service.run({
        oldCalendarEvents,
        newCalendarEvents,
      })

      expect(calendarChange.newItems).toHaveLength(0)
      expect(calendarChange.oldItems).toHaveLength(0)
      expect(calendarChange.changedItems).toHaveLength(0)
    })

    it("does not return changes for changed past events", () => {
      const oldCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 2 })
      const newCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 2 })
      newCalendarEvents[0].title = "New title"
      oldCalendarEvents[0].startsAt = new Date("2022-11-01T12:00:00Z")
      oldCalendarEvents[0].endsAt = new Date("2022-11-01T13:00:00Z")
      newCalendarEvents[0].startsAt = new Date("2022-11-01T12:00:00Z")
      newCalendarEvents[0].endsAt = new Date("2022-11-01T13:00:00Z")

      const calendarChange = service.run({
        oldCalendarEvents,
        newCalendarEvents,
      })

      expect(calendarChange.newItems).toHaveLength(0)
      expect(calendarChange.oldItems).toHaveLength(0)
      expect(calendarChange.changedItems).toHaveLength(0)
    })

    it("does not return changes for old past events", () => {
      const oldCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 3 })
      const newCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 2 })
      oldCalendarEvents[2].startsAt = new Date("2022-11-01T12:00:00Z")
      oldCalendarEvents[2].endsAt = new Date("2022-11-01T13:00:00Z")

      const calendarChange = service.run({
        oldCalendarEvents,
        newCalendarEvents,
      })

      expect(calendarChange.newItems).toHaveLength(0)
      expect(calendarChange.oldItems).toHaveLength(0)
      expect(calendarChange.changedItems).toHaveLength(0)
    })

    it("compares with content", () => {
      const oldCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 5 })
      const newCalendarEvents = CalendarEventFactory.buildList({
        nbEvents: 5,
        uidPrefix: "updated",
      })
      newCalendarEvents[0].title = "New title"
      newCalendarEvents[1].startsAt = new Date("2023-02-01T12:00:00Z")
      newCalendarEvents[1].endsAt = new Date("2023-02-01T13:00:00Z")
      newCalendarEvents[2].location = "Lyon"

      // Event 4 is a changed event with the same uid
      newCalendarEvents[3].uid = "event-3"
      newCalendarEvents[3].title = "Updated Event 3"

      // Event 5 has not changed
      newCalendarEvents[4].uid = "event-4"

      const calendarChange = service.run({
        oldCalendarEvents,
        newCalendarEvents,
        compareWithContent: true,
      })

      expect(calendarChange.newItems).toHaveLength(3)
      expect(calendarChange.newItems[0]).toEqual(newCalendarEvents[0])
      expect(calendarChange.newItems[1]).toEqual(newCalendarEvents[1])
      expect(calendarChange.newItems[2]).toEqual(newCalendarEvents[2])

      expect(calendarChange.oldItems).toHaveLength(3)
      expect(calendarChange.oldItems[0]).toEqual(oldCalendarEvents[0])
      expect(calendarChange.oldItems[1]).toEqual(oldCalendarEvents[1])
      expect(calendarChange.oldItems[2]).toEqual(oldCalendarEvents[2])

      expect(calendarChange.changedItems).toHaveLength(1)
      expect(calendarChange.changedItems[0].oldEvent).toEqual(
        oldCalendarEvents[3],
      )
      expect(calendarChange.changedItems[0].newEvent).toEqual(
        newCalendarEvents[3],
      )
    })

    it("compares with content when it detects a bad implemenation", () => {
      const oldCalendarEvents = CalendarEventFactory.buildList({ nbEvents: 8 })
      const newCalendarEvents = CalendarEventFactory.buildList({
        nbEvents: 8,
        uidPrefix: "updated",
      })

      newCalendarEvents[0].title = "New title"

      const calendarChange = service.run({
        oldCalendarEvents,
        newCalendarEvents,
      })

      expect(calendarChange.newItems).toHaveLength(1)
      expect(calendarChange.newItems[0]).toEqual(newCalendarEvents[0])

      expect(calendarChange.oldItems).toHaveLength(1)
      expect(calendarChange.oldItems[0]).toEqual(oldCalendarEvents[0])

      expect(calendarChange.changedItems).toHaveLength(0)
    })
  })
})
