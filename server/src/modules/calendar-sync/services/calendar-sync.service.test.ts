import { NotFoundException } from "@nestjs/common"
import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { CalendarFailure } from "modules/calendar-sync/models/calendar-failure.entity"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { FetchService } from "modules/fetch/services/fetch.service"
import { schoolFactory } from "modules/school/factories/school.factory"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { CalendarSubject } from "modules/subject/models/calendar-subject.entity"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"
import { v4 } from "uuid"

describe("CalendarSyncService", () => {
  let app: NestExpressApplication
  let service: CalendarSyncService
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
    service = app.get(CalendarSyncService)
    dataSource = app.get(DataSource)
  })

  beforeEach(async () => {
    events = [fetcherCalendarEventFactory.build()]
    mockFetchService.fetchEvents = jest.fn(async () => events)
    await dataSource.query("DELETE FROM calendar_log")
  })

  const findCalendarLogs = (calendarId: string) =>
    dataSource
      .getRepository(CalendarLog)
      .findBy({ calendar: { id: calendarId } })

  describe("createCalendar", () => {
    it("creates a calendar with an existing school", async () => {
      const school = await schoolFactory().create()

      const created = await service.createCalendar({
        url: "https://www.google.com/calendar/ical/",
        schoolId: school.id,
        name: "My Calendar",
        customData: null,
      })

      const calendars = await dataSource.getRepository(Calendar).find()
      expect(calendars).toHaveLength(1)
      const [calendar] = calendars
      expect(calendar.token).toBeTruthy()
      expect(calendar.token).toBe(created.token)
      expect(calendar.schoolId).toBe(school.id)
      expect(calendar.schoolName).toBeNull()

      const calendarContents = await dataSource
        .getRepository(CalendarContent)
        .findBy({ calendar: { id: calendar.id } })
      expect(calendarContents).toHaveLength(1)
      const [content] = calendarContents
      expect(content.events.length).toBe(1)
      expect(content.events[0].uid).toBe(events[0].uid)

      // Creation is not an update: no change detection, no CalendarLog
      expect(await findCalendarLogs(calendar.id)).toHaveLength(0)
    })

    it("creates a calendar with a custom school", async () => {
      const created = await service.createCalendar({
        url: "https://www.google.com/calendar/ical/",
        schoolName: "My school",
        name: "My Calendar",
        customData: null,
      })

      const calendars = await dataSource.getRepository(Calendar).find()
      expect(calendars).toHaveLength(1)
      const [calendar] = calendars
      expect(calendar.token).toBeTruthy()
      expect(calendar.token).toBe(created.token)
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
      await assertChanges(
        dataSource,
        [
          [Calendar, 0],
          [CalendarContent, 0],
        ],
        async () => {
          const promise = service.createCalendar({
            url: "https://www.google.com/calendar/ical/",
            schoolId: v4(),
            name: "My Calendar",
            customData: null,
          })

          await expect(promise).rejects.toThrow(
            /Could not find any entity of type/,
          )
        },
      )
    })

    it("throws when there are no events", async () => {
      events = []
      await assertChanges(
        dataSource,
        [
          [Calendar, 0],
          [CalendarContent, 0],
        ],
        async () => {
          const promise = service.createCalendar({
            url: "https://www.google.com/calendar/ical/",
            schoolName: "My school",
            name: "My Calendar",
            customData: null,
          })

          await expect(promise).rejects.toThrow(
            new NotFoundException("No events found"),
          )
        },
      )
    })
  })

  describe("sync", () => {
    let calendar: Calendar

    beforeEach(async () => {
      const mockDate = new Date("2022-01-01T00:00:00.000Z")
      jest.useFakeTimers({ advanceTimers: true, now: mockDate })

      calendar = await calendarFactory().create()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it("syncs events for an existing calendar", async () => {
      events = [
        fetcherCalendarEventFactory.build({
          uid: "new-event",
          title: "Physics",
        }),
      ]

      await service.sync(calendar)

      const calendarContents = await dataSource
        .getRepository(CalendarContent)
        .findBy({ calendar: { id: calendar.id } })
      expect(calendarContents).toHaveLength(1)
      const [content] = calendarContents
      expect(content.events.length).toBe(1)
      expect(content.events[0].uid).toBe("new-event")
      expect(content.events[0].startsAt).toEqual(events[0].start)
      expect(content.events[0].endsAt).toEqual(events[0].end)

      const subject = await dataSource
        .getRepository(CalendarSubject)
        .findOneByOrFail({ calendar: { id: calendar.id } })

      expect(subject.subjects).toMatchObject([
        {
          name: "physics",
          color: expect.stringMatching(/^#[0-9a-f]{6}$/),
        },
      ])
    })

    it("writes a CalendarLog with the new content when an update changes events", async () => {
      // Events must be in the future of the mocked clock (2022-01-01): change
      // detection ignores past events.
      const initialEvents = [
        fetcherCalendarEventFactory.build({
          uid: "initial-event",
          title: "Initial Event",
          start: new Date("2022-01-02T07:00:00.000Z"),
          end: new Date("2022-01-02T08:00:00.000Z"),
        }),
      ]
      mockFetchService.fetchEvents = jest.fn(async () => initialEvents)
      await service.sync(calendar)
      // The first sync goes from empty content to one event, which is itself a
      // change — drop its log to isolate the update under test
      await dataSource.query("DELETE FROM calendar_log")

      const newEvents = [
        fetcherCalendarEventFactory.build({
          uid: "updated-event",
          title: "Updated Event",
          start: new Date("2022-01-02T09:00:00.000Z"),
          end: new Date("2022-01-02T10:00:00.000Z"),
        }),
      ]
      mockFetchService.fetchEvents = jest.fn(async () => newEvents)

      await service.sync(calendar)

      // Content and its log are committed together (single transaction)
      const content = await dataSource
        .getRepository(CalendarContent)
        .findOneByOrFail({ calendar: { id: calendar.id } })
      expect(content.events[0].uid).toBe("updated-event")

      const logs = await findCalendarLogs(calendar.id)
      expect(logs).toHaveLength(1)
      expect(logs[0].calendarChange.newItems).toHaveLength(1)
      expect(logs[0].calendarChange.newItems[0].title).toBe("Updated Event")
      expect(logs[0].calendarChange.oldItems).toHaveLength(1)
      expect(logs[0].calendarChange.oldItems[0].title).toBe("Initial Event")
    })

    it("writes no CalendarLog when an update produces identical events", async () => {
      const sameEvents = [
        fetcherCalendarEventFactory.build({
          uid: "same-event",
          title: "Same Event",
          start: new Date("2022-01-02T07:00:00.000Z"),
          end: new Date("2022-01-02T08:00:00.000Z"),
        }),
      ]
      mockFetchService.fetchEvents = jest.fn(async () => sameEvents)
      await service.sync(calendar)
      await dataSource.query("DELETE FROM calendar_log")

      await service.sync(calendar)

      expect(await findCalendarLogs(calendar.id)).toHaveLength(0)
    })

    it("creates a new calendar with events", async () => {
      calendar = calendarFactory().build()

      const created = await assertChanges(
        dataSource,
        [
          [Calendar, 1],
          [CalendarContent, 1],
        ],
        () => service.sync(calendar),
      )

      const calendarContents = await dataSource
        .getRepository(CalendarContent)
        .find({
          where: { calendar: idToEntity(created.id) },
        })
      expect(calendarContents).toHaveLength(1)
      const [content] = calendarContents
      expect(content.events.length).toBe(1)
      expect(content.events[0].uid).toBe(events[0].uid)

      // Creation is not an update: no change detection, no CalendarLog
      expect(await findCalendarLogs(created.id)).toHaveLength(0)
    })

    it("does not create a calendar when there is an error", async () => {
      mockFetchService.fetchEvents = jest.fn(async () => {
        throw new Error("Something went wrong")
      })

      calendar = calendarFactory().build()

      await assertChanges(
        dataSource,
        [
          [Calendar, 0],
          [CalendarContent, 0],
          [CalendarFailure, 1],
        ],
        async () => {
          const promise = service.sync(calendar)

          await expect(promise).rejects.toThrow(
            new Error("Something went wrong"),
          )

          const calendarFailures = await dataSource
            .getRepository(CalendarFailure)
            .find()
          const [calendarFailure] = calendarFailures

          expect(calendarFailure.url).toBe(calendar.url)
          expect(JSON.parse(calendarFailure.error)).toMatchObject({
            name: "Error",
            message: "Something went wrong",
            stack: expect.any(String),
          })
        },
      )
    })

    it("updates the calendar lastUpdatedAt when there is an error", async () => {
      jest.useFakeTimers({
        doNotFake: ["nextTick", "setImmediate"],
        now: new Date("2022-01-01T00:00:01.000Z"),
      })

      mockFetchService.fetchEvents = jest.fn(async () => {
        throw new Error("Something went wrong")
      })
      await assertChanges(dataSource, [[CalendarFailure, 0]], async () => {
        const promise = service.sync(calendar)

        await expect(promise).rejects.toThrow(new Error("Something went wrong"))
      })

      const updatedCalendar = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: calendar.id })

      expect(updatedCalendar.lastUpdatedAt).not.toEqual(calendar.lastUpdatedAt)

      // A failed fetch never reaches the content+log transaction
      expect(await findCalendarLogs(calendar.id)).toHaveLength(0)
    })

    it("preserves existing events when sync fails for existing calendar", async () => {
      // First, sync the calendar with some events to establish existing content
      const initialEvents = [
        fetcherCalendarEventFactory.build({
          uid: "existing-event",
          title: "Existing Event",
        }),
      ]
      mockFetchService.fetchEvents = jest.fn(async () => initialEvents)
      await service.sync(calendar)

      // Verify initial content was saved
      const initialContent = await dataSource
        .getRepository(CalendarContent)
        .findOneByOrFail({ calendar: { id: calendar.id } })
      expect(initialContent.events).toHaveLength(1)
      expect(initialContent.events[0].uid).toBe("existing-event")

      // Now make the fetch fail
      mockFetchService.fetchEvents = jest.fn(async () => {
        throw new Error("Network error")
      })

      // Attempt to sync again - this should fail but preserve existing events
      await assertChanges(
        dataSource,
        [
          [Calendar, 0],
          [CalendarContent, 0],
          [CalendarFailure, 0],
        ],
        async () => {
          const promise = service.sync(calendar)
          await expect(promise).rejects.toThrow(new Error("Network error"))
        },
      )

      // Verify that the existing events are still there (not cleared)
      const contentAfterError = await dataSource
        .getRepository(CalendarContent)
        .findOneByOrFail({ calendar: { id: calendar.id } })
      expect(contentAfterError.events).toHaveLength(1)
      expect(contentAfterError.events[0].uid).toBe("existing-event")
      expect(contentAfterError.events[0].title).toBe("Existing Event")

      // Verify lastUpdatedAt was still updated despite the error
      const updatedCalendar = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: calendar.id })
      expect(updatedCalendar.lastUpdatedAt).not.toEqual(calendar.lastUpdatedAt)

      // A failed fetch never reaches the content+log transaction
      expect(await findCalendarLogs(calendar.id)).toHaveLength(0)
    })
  })
})
