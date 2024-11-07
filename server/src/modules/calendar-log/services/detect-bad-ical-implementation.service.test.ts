import { NestExpressApplication } from "@nestjs/platform-express"
import { range } from "lodash"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { CalendarChange } from "modules/calendar-log/models/calendar-change.model"
import { DetectBadIcalImplementationService } from "modules/calendar-log/services/detect-bad-ical-implementation.service"
import { CalendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import createTestApp from "test-utils/create-test-app"

describe("DetectBadIcalImplementationService", () => {
  let app: NestExpressApplication
  let service: DetectBadIcalImplementationService

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarLogModule] })
    service = app.get(DetectBadIcalImplementationService)
  })

  describe("isBadImplementation", () => {
    it("returns true if the calendar has a bad implementation", () => {
      const events = CalendarEventFactory.buildList({ nbEvents: 6 })

      // same events but uid is 'updated-1' instead of 'event-1'
      const calendarChange: CalendarChange = {
        newItems: CalendarEventFactory.buildList({
          nbEvents: 6,
          uidPrefix: "updated",
        }),
        oldItems: events,
        changedItems: [],
      }

      const isBadImplementation = service.isBadImplementation(
        events,
        calendarChange,
      )

      expect(isBadImplementation).toBe(true)
    })

    it("returns false when there is not enough events", () => {
      const events = CalendarEventFactory.buildList({ nbEvents: 4 })

      // same events but uid is 'updated-1' instead of 'event-1'
      const calendarChange: CalendarChange = {
        newItems: CalendarEventFactory.buildList({
          nbEvents: 4,
          uidPrefix: "updated",
        }),
        oldItems: events,
        changedItems: [],
      }

      const isBadImplementation = service.isBadImplementation(
        events,
        calendarChange,
      )

      expect(isBadImplementation).toBe(false)
    })

    it("returns true when there is enough events based on the threshold", () => {
      const events = CalendarEventFactory.buildList({ nbEvents: 16 })
      const newItems = CalendarEventFactory.buildList({
        nbEvents: 16,
        uidPrefix: "updated",
      })

      // It requires more than 8 real changes to be considered a bad implementation
      range(0, 2).forEach((i) => {
        newItems[i].title = `Actually a new event ${i}`
      })

      // same events but uid is 'updated-1' instead of 'event-1'
      const calendarChange: CalendarChange = {
        newItems: newItems,
        oldItems: events,
        changedItems: [],
      }

      const isBadImplementation = service.isBadImplementation(
        events,
        calendarChange,
      )

      expect(isBadImplementation).toBe(true)
    })

    it("returns false when there is not enough events based on the threshold", () => {
      const events = CalendarEventFactory.buildList({ nbEvents: 16 })
      const newItems = CalendarEventFactory.buildList({
        nbEvents: 16,
        uidPrefix: "updated",
      })

      // It requires more than 8 real changes to be considered a bad implementation
      range(0, 8).forEach((i) => {
        newItems[i].title = `Actually a new event ${i}`
      })

      // same events but uid is 'updated-1' instead of 'event-1'
      const calendarChange: CalendarChange = {
        newItems: newItems,
        oldItems: events,
        changedItems: [],
      }

      const isBadImplementation = service.isBadImplementation(
        events,
        calendarChange,
      )

      expect(isBadImplementation).toBe(false)
    })

    it("returns false when new events are actually new events and not updates", () => {
      const events = CalendarEventFactory.buildList({ nbEvents: 8 })
      const newEvents = CalendarEventFactory.buildList({
        nbEvents: 8,
        uidPrefix: "updated",
      })
      newEvents[0].title = "A new event 1"
      newEvents[1].startsAt = new Date("2021-01-18T00:00:00.000Z")
      newEvents[1].endsAt = new Date("2021-01-18T01:00:00.000Z")
      newEvents[2].location = "Lyon"

      const calendarChange: CalendarChange = {
        newItems: newEvents,
        oldItems: events,
        changedItems: [],
      }

      const isBadImplementation = service.isBadImplementation(
        events,
        calendarChange,
      )

      expect(isBadImplementation).toBe(false)
    })
  })
})
