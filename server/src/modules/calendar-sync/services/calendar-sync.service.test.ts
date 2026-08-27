// The real FetchService is used here — mocking at the fetcher boundary keeps
// strategy resolution (and therefore the resolved sync interval) real.
const icalFetcher: {
  fetch: jest.Mock<
    Promise<FetcherCalendarEvent[]>,
    [string?, unknown?, { signal?: AbortSignal }?]
  >
} = {
  fetch: jest.fn(() => Promise.resolve([])),
}

jest.mock("modules/fetch/fetchers/ical-fetcher", () => ({
  IcalFetcher: jest
    .fn()
    .mockImplementation(() => ({ fetch: icalFetcher.fetch })),
}))

import { NotFoundException } from "@nestjs/common"
import { NestExpressApplication } from "@nestjs/platform-express"
import { differenceInMinutes } from "date-fns"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { CalendarFailure } from "modules/calendar-sync/models/calendar-failure.entity"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { CalendarSyncMetricsService } from "modules/calendar-sync/services/calendar-sync-metrics.service"
import { CalendarSyncAbortError } from "modules/calendar-sync/models/calendar-sync-context"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarContentRepository } from "modules/calendar/repositories/calendar-content.repository"
import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
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
  let metrics: CalendarSyncMetricsService
  let contentRepository: CalendarContentRepository
  let events: FetcherCalendarEvent[]

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarSyncModule] })
    service = app.get(CalendarSyncService)
    dataSource = app.get(DataSource)
    metrics = app.get(CalendarSyncMetricsService)
    contentRepository = app.get(CalendarContentRepository)
  })

  beforeEach(async () => {
    events = [fetcherCalendarEventFactory.build()]
    icalFetcher.fetch.mockImplementation(async () => events)
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

      calendar = await calendarFactory().create({
        syncPlannedAt: new Date("2021-12-31T00:00:00.000Z"),
      })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    const makeDue = (calendarId: string) =>
      dataSource.getRepository(Calendar).update(calendarId, {
        syncPlannedAt: new Date("2021-12-31T00:00:00.000Z"),
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
      icalFetcher.fetch.mockImplementation(async () => initialEvents)
      await service.sync(calendar)
      // The first sync goes from empty content to one event, which is itself a
      // change — drop its log to isolate the update under test
      await dataSource.query("DELETE FROM calendar_log")
      await makeDue(calendar.id)

      const newEvents = [
        fetcherCalendarEventFactory.build({
          uid: "updated-event",
          title: "Updated Event",
          start: new Date("2022-01-02T09:00:00.000Z"),
          end: new Date("2022-01-02T10:00:00.000Z"),
        }),
      ]
      icalFetcher.fetch.mockImplementation(async () => newEvents)

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
      icalFetcher.fetch.mockImplementation(async () => sameEvents)
      await service.sync(calendar)
      await dataSource.query("DELETE FROM calendar_log")
      await makeDue(calendar.id)

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
      icalFetcher.fetch.mockImplementation(async () => {
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

      icalFetcher.fetch.mockImplementation(async () => {
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
      icalFetcher.fetch.mockImplementation(async () => initialEvents)
      await service.sync(calendar)

      // Verify initial content was saved
      const initialContent = await dataSource
        .getRepository(CalendarContent)
        .findOneByOrFail({ calendar: { id: calendar.id } })
      expect(initialContent.events).toHaveLength(1)
      expect(initialContent.events[0].uid).toBe("existing-event")

      // Now make the fetch fail
      icalFetcher.fetch.mockImplementation(async () => {
        throw new Error("Network error")
      })
      await makeDue(calendar.id)

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

    it.each([
      ["https://ade.ensea.fr/feed", "ensea.fr"],
      ["https://calendar.example.test/feed", "custom"],
      ["http://127.0.0.1/feed", "invalid"],
    ])(
      "records %s through the bounded %s metric bucket",
      async (url, domain) => {
        const add = jest.spyOn(metrics, "add").mockImplementation()

        await service.sync(calendarFactory().build({ url }))

        expect(add).toHaveBeenCalledWith(
          expect.objectContaining({ domain, status: "success" }),
        )
        add.mockRestore()
      },
    )

    it("restores timestamps when cancellation happens before persistence", async () => {
      const original = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: calendar.id })
      const controller = new AbortController()
      const reason = new CalendarSyncAbortError("deadline")
      icalFetcher.fetch.mockImplementationOnce(async () => {
        controller.abort(reason)
        throw reason
      })

      await expect(
        service.sync(calendar, { signal: controller.signal }),
      ).rejects.toBe(reason)

      const unchanged = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: calendar.id })
      expect(unchanged.lastUpdatedAt).toEqual(original.lastUpdatedAt)
      expect(unchanged.syncPlannedAt).toEqual(original.syncPlannedAt)
      expect(await findCalendarLogs(calendar.id)).toHaveLength(0)
    })

    it("does not enter the content transaction when cancellation wins after fetch", async () => {
      const original = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: calendar.id })
      const controller = new AbortController()
      const reason = new CalendarSyncAbortError("deadline")
      const calendarRepository = dataSource.getRepository(Calendar)
      const originalSave = calendarRepository.save.bind(calendarRepository)
      jest
        .spyOn(calendarRepository, "save")
        .mockImplementationOnce(async (...args) => {
          const saved = await originalSave(...args)
          controller.abort(reason)
          return saved
        })
      const transaction = jest.spyOn(contentRepository, "saveWithTransaction")

      await expect(
        service.sync(calendar, { signal: controller.signal }),
      ).rejects.toBe(reason)

      expect(transaction).not.toHaveBeenCalled()
      const unchanged = await dataSource
        .getRepository(Calendar)
        .findOneByOrFail({ id: calendar.id })
      expect(unchanged.lastUpdatedAt).toEqual(original.lastUpdatedAt)
      expect(unchanged.syncPlannedAt).toEqual(original.syncPlannedAt)
      expect(await findCalendarLogs(calendar.id)).toHaveLength(0)
    })

    it("lets an entered content transaction settle atomically after abort", async () => {
      events = [
        fetcherCalendarEventFactory.build({
          uid: "committed-after-boundary",
          start: new Date("2022-01-02T07:00:00.000Z"),
          end: new Date("2022-01-02T08:00:00.000Z"),
        }),
      ]
      const controller = new AbortController()
      const originalSave =
        contentRepository.saveWithTransaction.bind(contentRepository)
      jest
        .spyOn(contentRepository, "saveWithTransaction")
        .mockImplementationOnce(async (...args) => {
          controller.abort(new CalendarSyncAbortError("deadline"))
          return originalSave(...args)
        })

      await service.sync(calendar, { signal: controller.signal })

      const content = await dataSource
        .getRepository(CalendarContent)
        .findOneByOrFail({ calendar: { id: calendar.id } })
      expect(content.events[0].uid).toBe("committed-after-boundary")
      expect(await findCalendarLogs(calendar.id)).toHaveLength(1)
    })

    describe("syncPlannedAt", () => {
      const LYON1_URL =
        "https://adelb.univ-lyon1.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=12345&projectId=6&calType=ical"

      const createDueCalendar = (url?: string) =>
        calendarFactory().create({
          ...(url && { url }),
          syncPlannedAt: new Date("2021-12-31T00:00:00.000Z"),
        })

      const reloadPlan = async (calendarId: string) => {
        const { lastUpdatedAt, syncPlannedAt } = await dataSource
          .getRepository(Calendar)
          .findOneByOrFail({ id: calendarId })
        return {
          syncPlannedAt,
          plannedInMinutes: differenceInMinutes(syncPlannedAt, lastUpdatedAt),
        }
      }

      it("plans the next sync one default interval later", async () => {
        const dueCalendar = await createDueCalendar()

        await service.sync(dueCalendar)

        const { syncPlannedAt, plannedInMinutes } = await reloadPlan(
          dueCalendar.id,
        )
        expect(plannedInMinutes).toBe(30)
        expect(syncPlannedAt.getTime()).toBeGreaterThan(
          dueCalendar.syncPlannedAt.getTime(),
        )
      })

      it("plans the next sync from the interval the school declares", async () => {
        const dueCalendar = await createDueCalendar(LYON1_URL)

        await service.sync(dueCalendar)

        expect((await reloadPlan(dueCalendar.id)).plannedInMinutes).toBe(60)
      })

      it("still plans the next sync when the fetch fails", async () => {
        const dueCalendar = await createDueCalendar()
        icalFetcher.fetch.mockImplementation(async () => {
          throw new Error("Upstream is down")
        })

        await expect(service.sync(dueCalendar)).rejects.toThrow(
          new Error("Upstream is down"),
        )

        const { syncPlannedAt, plannedInMinutes } = await reloadPlan(
          dueCalendar.id,
        )
        expect(plannedInMinutes).toBe(30)
        expect(syncPlannedAt.getTime()).toBeGreaterThan(
          dueCalendar.syncPlannedAt.getTime(),
        )
      })

      it("returns last-known state without fetching when the claim is not due", async () => {
        const futureCalendar = await calendarFactory()
          .transient({
            events: [calendarEventFactory.build({ uid: "last-known-event" })],
          })
          .create({ syncPlannedAt: new Date("2022-01-01T01:00:00.000Z") })

        const result = await service.sync(futureCalendar)

        expect(icalFetcher.fetch).not.toHaveBeenCalled()
        expect(result.content.events[0].uid).toBe("last-known-event")
      })

      it("allows only one upstream fetch for concurrent Lyon callers", async () => {
        const dueCalendar = await createDueCalendar(LYON1_URL)

        await Promise.all([
          service.sync(dueCalendar),
          service.sync(dueCalendar),
        ])

        expect(icalFetcher.fetch).toHaveBeenCalledTimes(1)
        expect((await reloadPlan(dueCalendar.id)).plannedInMinutes).toBe(60)
      })

      it("keeps the Lyon claim after an upstream failure", async () => {
        const dueCalendar = await createDueCalendar(LYON1_URL)
        icalFetcher.fetch.mockRejectedValue(new Error("ADE unavailable"))

        await expect(service.sync(dueCalendar)).rejects.toThrow(
          "ADE unavailable",
        )
        await expect(service.sync(dueCalendar)).resolves.toMatchObject({
          id: dueCalendar.id,
        })

        expect(icalFetcher.fetch).toHaveBeenCalledTimes(1)
        expect((await reloadPlan(dueCalendar.id)).plannedInMinutes).toBe(60)
      })

      it("keeps the Lyon claim when persistence fails after upstream I/O", async () => {
        const dueCalendar = await createDueCalendar(LYON1_URL)
        const saveSpy = jest
          .spyOn(app.get(CalendarContentRepository), "saveWithTransaction")
          .mockRejectedValueOnce(new Error("persistence unavailable"))

        await expect(service.sync(dueCalendar)).rejects.toThrow(
          "persistence unavailable",
        )
        await expect(service.sync(dueCalendar)).resolves.toMatchObject({
          id: dueCalendar.id,
        })

        expect(icalFetcher.fetch).toHaveBeenCalledTimes(1)
        expect((await reloadPlan(dueCalendar.id)).plannedInMinutes).toBe(60)
        saveSpy.mockRestore()
      })
    })
  })
})
