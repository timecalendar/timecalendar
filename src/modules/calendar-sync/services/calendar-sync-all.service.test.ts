import { NestExpressApplication } from "@nestjs/platform-express"
import MockDate from "lib/mock-date"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { CalendarSyncAllService } from "modules/calendar-sync/services/calendar-sync-all.service"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import { FetcherCalendarEvent } from "modules/fetch/models/event"
import { FetchService } from "modules/fetch/services/fetch.service"
import createTestApp from "test-utils/create-test-app"
import { DataSource, In } from "typeorm"

describe("CalendarSyncAllService", () => {
  let app: NestExpressApplication
  let service: CalendarSyncAllService
  let dataSource: DataSource
  let events: FetcherCalendarEvent[]
  const mockFetchService = {
    fetchEvents: jest.fn(),
  }

  beforeAll(async () => {
    app = await createTestApp(
      { imports: [CalendarSyncModule] },
      { overrides: [{ provide: FetchService, useValue: mockFetchService }] },
    )
    service = app.get(CalendarSyncAllService)
    dataSource = app.get(DataSource)
  })

  beforeEach(() => {
    events = [fetcherCalendarEventFactory.build()]
    mockFetchService.fetchEvents = jest.fn(() => events)
  })

  describe("syncAll", () => {
    beforeEach(() => {
      MockDate.set(new Date("2022-01-05T12:00:00Z"))
    })

    it("syncs all calendars", async () => {
      await calendarFactory().createList(2, {
        lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
      })

      await service.syncAll()

      const calendars = await dataSource.getRepository(Calendar).find()
      expect(calendars).toHaveLength(2)
      expect(calendars[0].lastUpdatedAt).toEqual(
        new Date("2022-01-05T12:00:00Z"),
      )
      expect(calendars[1].lastUpdatedAt).toEqual(
        new Date("2022-01-05T12:00:00Z"),
      )
      const contents = await dataSource
        .getRepository(CalendarContent)
        .findBy({ calendar: { id: In(calendars.map(({ id }) => id)) } })

      expect(contents[0].events.length).toBe(1)
      expect(contents[0].events[0].uid).toBe(events[0].uid)
      expect(contents[1].events.length).toBe(1)
      expect(contents[1].events[0].uid).toBe(events[0].uid)
      expect(mockFetchService.fetchEvents).toHaveBeenCalledTimes(2)
    })

    it("does not update a calendar updated less than 15 min ago", async () => {
      const calendar = await calendarFactory().create({
        lastUpdatedAt: new Date("2022-01-05T11:50:00Z"),
      })

      await service.syncAll()

      expect(calendar.lastUpdatedAt).toEqual(new Date("2022-01-05T11:50:00Z"))
      const content = await dataSource
        .getRepository(CalendarContent)
        .findOneByOrFail({ calendar: { id: calendar.id } })
      expect(content.events.length).toBe(0)
      expect(mockFetchService.fetchEvents).not.toHaveBeenCalled()
    })
  })
})
