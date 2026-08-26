import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { DEFAULT_MIN_SYNC_INTERVAL_MINUTES } from "modules/fetch/constants"
import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { FetchService } from "modules/fetch/services/fetch.service"
import { schoolFactory } from "modules/school/factories/school.factory"
import { CalendarFetchError } from "modules/fetch/models/calendar-fetch-outcome"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"

describe("CalendarSyncController", () => {
  let app: NestExpressApplication
  let dataSource: DataSource
  const events: FetcherCalendarEvent[] = [fetcherCalendarEventFactory.build()]
  // This suite is about the HTTP surface, not the fetch layer: the interval is
  // stubbed here and resolved for real in the service suites.
  const mockFetchService = {
    fetchEvents: jest.fn(async () => events),
    getMinSyncIntervalMinutes: jest.fn(() => DEFAULT_MIN_SYNC_INTERVAL_MINUTES),
  }

  beforeAll(async () => {
    app = await createTestApp(
      { imports: [CalendarSyncModule] },
      { overrides: [{ provide: FetchService, useValue: mockFetchService }] },
    )
    dataSource = app.get(DataSource)
  })

  describe("POST /calendars", () => {
    beforeEach(() => {
      mockFetchService.fetchEvents.mockResolvedValue(events)
    })

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

    it("rejects a Tours login page before fetching and returns only safe keys", async () => {
      const sentinel = "synthetic-login:synthetic-password"
      const response = await request(app)
        .post("/calendars")
        .send({
          url: `https://${sentinel}@ade.univ-tours.fr/login?resources=resource-123`,
          schoolName: "Tours",
          name: "Tours",
        })
        .expect(422)

      expect(mockFetchService.fetchEvents).not.toHaveBeenCalled()
      expect(response.body).toEqual({
        code: "calendar_import_failed",
        classification: "unsupported_link",
        helpKey: "tours_export",
        retryable: false,
      })
      expect(JSON.stringify(response.body)).not.toContain(sentinel)
      expect(JSON.stringify(response.body)).not.toContain("resource-123")
    })

    it("distinguishes an upstream outage from unsupported input", async () => {
      mockFetchService.fetchEvents.mockRejectedValueOnce(
        new CalendarFetchError("http_5xx"),
      )
      const school = await schoolFactory().create({ code: "univtoulouse3" })

      const response = await request(app)
        .post("/calendars")
        .send({
          url: "https://edt.univ-tlse3.fr/export.ics",
          schoolId: school.id,
          name: "Toulouse 3",
        })
        .expect(422)

      expect(response.body).toEqual({
        code: "calendar_import_failed",
        classification: "upstream_unavailable",
        helpKey: "toulouse3_outage",
        retryable: true,
      })
    })
  })

  describe("POST /calendars/sync", () => {
    let calendar: Calendar

    beforeEach(async () => {
      const mockDate = new Date("2022-01-05T12:00:00Z")
      jest.useFakeTimers({
        doNotFake: ["nextTick", "setImmediate"],
        now: mockDate,
      })

      calendar = await calendarFactory()
        .school()
        .create({ syncPlannedAt: new Date("2022-01-05T11:00:00Z") })
    })

    afterEach(() => {
      jest.useRealTimers()
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
