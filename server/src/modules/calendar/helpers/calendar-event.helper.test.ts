import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarModule } from "modules/calendar/calendar.module"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { CalendarEventHelper } from "modules/calendar/helpers/calendar-event.helper"
import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import createTestApp from "test-utils/create-test-app"

describe("CalendarEventHelper", () => {
  let app: NestExpressApplication
  let helper: CalendarEventHelper

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarModule] })
    helper = app.get(CalendarEventHelper)
  })

  describe("forPublic", () => {
    it("returns a calendar event for public", async () => {
      const event = calendarEventFactory.build()

      const result = helper.forPublic({
        calendarEvent: event,
        color: "#ff00ff",
      })

      expect(result.uid).toBe(event.uid)
      expect(result.title).toBe(event.title)
      expect(result.color).toBe("#ff00ff")
      expect(result.groupColor).toBe("#ff80ff")
    })

    it("returns the default color", async () => {
      const event = calendarEventFactory.build()

      const result = helper.forPublic({
        calendarEvent: event,
        color: null,
      })

      expect(result.uid).toBe(event.uid)
      expect(result.title).toBe(event.title)
      expect(result.color).toBe("#ff80ff")
      expect(result.groupColor).toBe("#ff80ff")
    })
  })

  describe("fromFetcherCalendarEvent", () => {
    beforeEach(async () => {
      jest.useFakeTimers({ now: new Date("2022-07-01T00:00:00.000Z") })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it("returns a calendar event from a fetcher calendar event", async () => {
      const fetcherCalendarEvent = fetcherCalendarEventFactory.build()

      const result = helper.fromFetcherCalendarEvent(fetcherCalendarEvent)

      expect(result.uid).toBe(fetcherCalendarEvent.uid)
      expect(result.title).toBe(fetcherCalendarEvent.title)
      expect(result.startsAt).toEqual(fetcherCalendarEvent.start)
      expect(result.endsAt).toEqual(fetcherCalendarEvent.end)
      expect(result.exportedAt).toEqual(new Date("2022-07-01T00:00:00.000Z"))
    })
  })
})
