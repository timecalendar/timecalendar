import { NotFoundException } from "@nestjs/common"
import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import { FetcherCalendarEvent } from "modules/fetch/models/event"
import { FetchService } from "modules/fetch/services/fetch.service"
import { schoolFactory } from "modules/school/factories/school.factory"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"
import { v4 } from "uuid"

describe("CalendarSyncService", () => {
  let app: NestExpressApplication
  let service: CalendarSyncService
  let dataSource: DataSource
  let events: FetcherCalendarEvent[] = [fetcherCalendarEventFactory.build()]

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
    service = app.get(CalendarSyncService)
    dataSource = app.get(DataSource)
  })

  describe("create", () => {
    it("creates a calendar with an existing school", async () => {
      const school = await schoolFactory().create()

      const created = await service.create({
        url: "https://www.google.com/calendar/ical/",
        schoolId: school.id,
        name: "My Calendar",
      })

      const calendars = await dataSource.getRepository(Calendar).find()
      expect(calendars).toHaveLength(1)
      const [calendar] = calendars
      expect(calendar.id).toBe(created.id)
      expect(calendar.schoolId).toBe(school.id)
      expect(calendar.schoolName).toBeNull()

      const calendarContents = await dataSource
        .getRepository(CalendarContent)
        .findBy({ calendar: { id: calendar.id } })
      expect(calendarContents).toHaveLength(1)
      const [content] = calendarContents
      expect(content.events.length).toBe(1)
      expect(content.events[0].uid).toBe(events[0].uid)
    })

    it("creates a calendar with a custom school", async () => {
      const created = await service.create({
        url: "https://www.google.com/calendar/ical/",
        schoolName: "My school",
        name: "My Calendar",
      })

      const calendars = await dataSource.getRepository(Calendar).find()
      expect(calendars).toHaveLength(1)
      const [calendar] = calendars
      expect(calendar.id).toBe(created.id)
      expect(calendar.school).toBeUndefined()
      expect(calendar.schoolName).toBe("My school")

      const calendarContents = await dataSource
        .getRepository(CalendarContent)
        .findBy({ calendar: { id: calendar.id } })
      expect(calendarContents).toHaveLength(1)
      const [content] = calendarContents
      expect(content.events.length).toBe(1)
      expect(content.events[0].uid).toBe(events[0].uid)
    })

    it("throws when the school does not exist", async () => {
      const promise = service.create({
        url: "https://www.google.com/calendar/ical/",
        schoolId: v4(),
        name: "My Calendar",
      })

      await expect(promise).rejects.toThrow(
        new NotFoundException("School not found"),
      )
      const calendars = await dataSource.getRepository(Calendar).find()
      expect(calendars).toHaveLength(0)
      const calendarContents = await dataSource
        .getRepository(CalendarContent)
        .find()
      expect(calendarContents).toHaveLength(0)
    })

    it("throws when there are no events", async () => {
      events = []
      const promise = service.create({
        url: "https://www.google.com/calendar/ical/",
        schoolName: "My school",
        name: "My Calendar",
      })

      await expect(promise).rejects.toThrow(
        new NotFoundException("No events found"),
      )
      const calendars = await dataSource.getRepository(Calendar).find()
      expect(calendars).toHaveLength(0)
      const calendarContents = await dataSource
        .getRepository(CalendarContent)
        .find()
      expect(calendarContents).toHaveLength(0)
    })
  })
})
