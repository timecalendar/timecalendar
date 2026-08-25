// The real FetchService is used here — mocking at the fetcher boundary keeps
// strategy resolution (and therefore the resolved sync interval) real, which is
// what the Lyon 1 round-trip below actually exercises.
const icalFetcher: {
  fetch: jest.Mock<Promise<FetcherCalendarEvent[]>, []>
} = {
  fetch: jest.fn(() => Promise.resolve([])),
}

jest.mock("modules/fetch/fetchers/ical-fetcher", () => ({
  IcalFetcher: jest
    .fn()
    .mockImplementation(() => ({ fetch: icalFetcher.fetch })),
}))

import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { CalendarSyncAllService } from "modules/calendar-sync/services/calendar-sync-all.service"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import createTestApp from "test-utils/create-test-app"
import { DataSource } from "typeorm"

describe("CalendarSyncAllService", () => {
  let app: NestExpressApplication
  let service: CalendarSyncAllService
  let dataSource: DataSource
  let events: FetcherCalendarEvent[]

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarSyncModule] })
    service = app.get(CalendarSyncAllService)
    dataSource = app.get(DataSource)
  })

  beforeEach(() => {
    events = [fetcherCalendarEventFactory.build()]
    icalFetcher.fetch.mockImplementation(async () => events)
  })

  const findCalendar = (calendarId: string) =>
    dataSource.getRepository(Calendar).findOneByOrFail({ id: calendarId })

  describe("syncAllForUser", () => {
    beforeEach(async () => {
      const mockDate = new Date("2022-01-05T12:00:00Z")
      jest.useFakeTimers({
        doNotFake: ["nextTick", "setImmediate"],
        now: mockDate,
      })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it("fetches a calendar", async () => {
      const calendar = await calendarFactory()
        .school()
        .create({ syncPlannedAt: new Date("2022-01-05T11:00:00Z") })
      const data = await service.syncAllForUser({
        tokens: [calendar.token],
      })

      expect(data).toHaveLength(1)
      expect(data[0].calendar.id).toBe(calendar.id)
      expect(data[0].events).toHaveLength(1)
      expect(data[0].events[0].uid).toBe(events[0].uid)

      const updated = await findCalendar(calendar.id)
      expect(updated.lastAccessedAt).not.toBeNull()
    })

    it("fetches multiple calendars", async () => {
      const expected = [
        await calendarFactory()
          .school()
          .create({ syncPlannedAt: new Date("2022-01-05T11:00:00Z") }),
        await calendarFactory()
          .school()
          .create({ syncPlannedAt: new Date("2022-01-05T11:00:00Z") }),
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
        .create({ syncPlannedAt: new Date("2022-01-05T11:00:00Z") })
      icalFetcher.fetch.mockRejectedValueOnce(new Error())

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
        syncPlannedAt: new Date("2022-01-05T11:30:00Z"),
      })

      await service.syncAllForUser({ tokens: [expected.token] })

      const expectedUpdated = await findCalendar(expected.id)
      expect(expectedUpdated.lastUpdatedAt).toEqual(
        new Date("2022-01-05T12:00:00Z"),
      )
      const expectedUntouched = await findCalendar(untouched.id)
      expect(expectedUntouched.lastUpdatedAt).toEqual(
        new Date("2022-01-05T11:00:00Z"),
      )
      expect(icalFetcher.fetch).toHaveBeenCalledTimes(1)
    })

    it("sets last accessed at even for calendars that do not need a sync", async () => {
      const expected = await calendarFactory().create({
        lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
        syncPlannedAt: new Date("2022-01-05T11:30:00Z"),
      })
      const untouched = await calendarFactory().create({
        lastUpdatedAt: new Date("2022-01-05T11:00:00Z"),
        syncPlannedAt: new Date("2022-01-05T12:30:00Z"),
      })

      await service.syncAllForUser({
        tokens: [expected.token, untouched.token],
      })

      const expectedUpdated = await findCalendar(expected.id)
      expect(expectedUpdated.lastUpdatedAt).toEqual(
        new Date("2022-01-05T12:00:00Z"),
      )
      expect(expectedUpdated.lastAccessedAt).toEqual(
        new Date("2022-01-05T12:00:00Z"),
      )
      const expectedUntouched = await findCalendar(untouched.id)
      expect(expectedUntouched.lastUpdatedAt).toEqual(
        new Date("2022-01-05T11:00:00Z"),
      )
      expect(expectedUntouched.lastAccessedAt).toEqual(
        new Date("2022-01-05T12:00:00Z"),
      )

      expect(icalFetcher.fetch).toHaveBeenCalledTimes(1)
    })

    it("re-fetches a Lyon 1 calendar only once its hour has elapsed", async () => {
      const calendar = await calendarFactory().create({
        url: "https://adelb.univ-lyon1.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=12345&projectId=6&calType=ical",
        syncPlannedAt: new Date("2022-01-05T11:00:00Z"),
      })

      await service.syncAllForUser({ tokens: [calendar.token] })
      expect(icalFetcher.fetch).toHaveBeenCalledTimes(1)
      expect((await findCalendar(calendar.id)).syncPlannedAt).toEqual(
        new Date("2022-01-05T13:00:00Z"),
      )

      jest.setSystemTime(new Date("2022-01-05T12:45:00Z"))
      await service.syncAllForUser({ tokens: [calendar.token] })
      expect(icalFetcher.fetch).toHaveBeenCalledTimes(1)

      jest.setSystemTime(new Date("2022-01-05T13:05:00Z"))
      await service.syncAllForUser({ tokens: [calendar.token] })
      expect(icalFetcher.fetch).toHaveBeenCalledTimes(2)
    })
  })
})
