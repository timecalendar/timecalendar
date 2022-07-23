import { NestExpressApplication } from "@nestjs/platform-express"
import request from "lib/supertest"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
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

  beforeAll(async () => {
    app = await createTestApp(
      { imports: [CalendarSyncModule] },
      {
        overrides: [
          {
            provide: FetchService,
            useValue: { fetchEvents: async () => events },
          },
        ],
      },
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
      expect(body.id).toBe(calendar.id)
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
})
