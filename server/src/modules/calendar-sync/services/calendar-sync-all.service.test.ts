import { NestExpressApplication } from "@nestjs/platform-express"
import MockDate from "lib/mock-date"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { CalendarSyncAllService } from "modules/calendar-sync/services/calendar-sync-all.service"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
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

  describe("syncAllForUser", () => {
    beforeEach(() => {
      MockDate.set(new Date("2022-01-05T12:00:00Z"))
    })

    it("fetches a calendar", async () => {
      const calendar = await calendarFactory()
        .school()
        .create({ lastUpdatedAt: new Date("2022-01-05T11:00:00Z") })
      const data = await service.syncAllForUser({
        tokens: [calendar.token],
      })

      expect(data).toHaveLength(1)
      expect(data[0].calendar.id).toBe(calendar.id)
      expect(data[0].events).toHaveLength(1)
      expect(data[0].events[0].uid).toBe(events[0].uid)

      const updated = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: calendar.id })
      expect(updated.lastAccessedAt).not.toBeNull()
    })

    it("fetches multiple calendars", async () => {
      const expected = [
        await calendarFactory()
          .school()
          .create({ lastUpdatedAt: new Date("2022-01-05T11:00:00Z") }),
        await calendarFactory()
          .school()
          .create({ lastUpdatedAt: new Date("2022-01-05T11:00:00Z") }),
      ]

      const data = await service.syncAllForUser({
        tokens: expected.map(({ token }) => token),
      })

      expect(data).toHaveLength(2)
      expect(data[0].calendar.id).toBe(expected[1].id)
      expect(data[1].calendar.id).toBe(expected[0].id)
    })

    it("returns the calendar even when the sync fails", async () => {
      const anotherEvent = calendarEventFactory.build()
      const calendar = await calendarFactory()
        .transient({ events: [anotherEvent] })
        .create({ lastUpdatedAt: new Date("2022-01-05T11:00:00Z") })
      mockFetchService.fetchEvents = jest
        .fn()
        .mockRejectedValueOnce(new Error())

      const data = await service.syncAllForUser({
        tokens: [calendar.token],
      })

      expect(data).toHaveLength(1)
      expect(data[0].calendar.id).toBe(calendar.id)
      expect(data[0].events).toHaveLength(1)
      expect(data[0].events[0].uid).toBe(anotherEvent.uid)
    })

    it("syncs only user calendars", async () => {
      const [expected, untouched] = await calendarFactory().createList(2, {
        lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
      })

      await service.syncAllForUser({ tokens: [expected.token] })

      const expectedUpdated = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: expected.id })
      expect(expectedUpdated.lastUpdatedAt).toEqual(
        new Date("2022-01-05T12:00:00Z"),
      )
      const expectedUntouched = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: untouched.id })
      expect(expectedUntouched.lastUpdatedAt).toEqual(
        new Date("2022-01-05T11:00:00Z"),
      )
      expect(mockFetchService.fetchEvents).toHaveBeenCalledTimes(1)
    })

    it("sets last accessed at even for calendars that do not need a sync", async () => {
      const expected = await calendarFactory().create({
        lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
      })
      const untouched = await calendarFactory().create({
        lastUpdatedAt: new Date("2022-01-05T12:00:00Z"),
      })

      await service.syncAllForUser({
        tokens: [expected.token, untouched.token],
      })

      const expectedUpdated = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: expected.id })
      expect(expectedUpdated.lastUpdatedAt).toEqual(
        new Date("2022-01-05T12:00:00Z"),
      )
      expect(expectedUpdated.lastAccessedAt).toEqual(
        new Date("2022-01-05T12:00:00Z"),
      )
      const expectedUntouched = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: untouched.id })
      expect(expectedUntouched.lastUpdatedAt).toEqual(
        new Date("2022-01-05T12:00:00Z"),
      )
      expect(expectedUntouched.lastAccessedAt).toEqual(
        new Date("2022-01-05T12:00:00Z"),
      )

      expect(mockFetchService.fetchEvents).toHaveBeenCalledTimes(1)
    })
  })

  describe("syncAllForCronJob", () => {
    beforeEach(() => {
      MockDate.set(new Date("2022-01-05T12:00:00Z"))
    })

    it("syncs all calendars", async () => {
      await calendarFactory().createList(2, {
        lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
      })

      await service.syncAllForCronJob()

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

      await service.syncAllForCronJob()

      expect(calendar.lastUpdatedAt).toEqual(new Date("2022-01-05T11:50:00Z"))
      const content = await dataSource
        .getRepository(CalendarContent)
        .findOneByOrFail({ calendar: { id: calendar.id } })
      expect(content.events.length).toBe(0)
      expect(mockFetchService.fetchEvents).not.toHaveBeenCalled()
    })
  })
})
