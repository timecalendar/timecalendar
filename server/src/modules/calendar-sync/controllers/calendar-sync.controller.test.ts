import { NestExpressApplication } from "@nestjs/platform-express"
import MockDate from "lib/mock-date"
import request from "lib/supertest"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import { FetcherCalendarEvent } from "modules/fetch/models/event"
import { FetchService } from "modules/fetch/services/fetch.service"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"

describe("CalendarSyncController", () => {
  let app: NestExpressApplication
  let dataSource: DataSource
  const events: FetcherCalendarEvent[] = [fetcherCalendarEventFactory.build()]
  const mockFetchService = { fetchEvents: jest.fn(async () => events) }

  beforeAll(async () => {
    app = await createTestApp(
      { imports: [CalendarSyncModule] },
      { overrides: [{ provide: FetchService, useValue: mockFetchService }] },
    )
    dataSource = app.get(DataSource)
  })

  describe("POST /calendars", () => {
    it("creates a calendar", async () => {
      const { body } = await assertChanges(
        dataSource,
        [
          [Calendar, 1],
          [CalendarContent, 1],
        ],
        () =>
          request(app)
            .post("/calendars")
            .send({
              url: "https://www.google.com/calendar/ical/",
              schoolName: "My school",
              name: "My Calendar",
            })
            .expect(201),
      )

      const [calendar] = await dataSource.getRepository(Calendar).find()
      expect(calendar).toBeDefined()
      expect(body.token).toBe(calendar.token)
      expect(calendar.url).toBe("https://www.google.com/calendar/ical/")
      expect(calendar.schoolName).toBe("My school")
      expect(calendar.name).toBe("My Calendar")
    })

    it("fails when there is no school id or name", async () => {
      await request(app)
        .post("/calendars")
        .send({
          url: "https://www.google.com/calendar/ical/",
          name: "My Calendar",
        })
        .expect(400)
    })
  })

  describe("POST /calendars/sync", () => {
    let calendar: Calendar

    beforeEach(async () => {
      MockDate.set(new Date("2022-01-05T12:00:00Z"))

      calendar = await calendarFactory()
        .school()
        .create({ lastUpdatedAt: new Date("2022-01-05T11:00:00Z") })
    })

    it("fetches a calendar", async () => {
      const { body } = await request(app)
        .post("/calendars/sync")
        .send({
          tokens: [calendar.token],
        })

      expect(body).toHaveLength(1)
      expect(body[0].calendar.id).toBe(calendar.id)
      expect(body[0].events).toHaveLength(1)
      expect(body[0].events[0].uid).toBe(events[0].uid)
    })
  })
})
