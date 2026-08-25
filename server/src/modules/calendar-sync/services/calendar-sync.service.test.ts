// The real FetchService is used here — mocking at the fetcher boundary keeps
// strategy resolution (and therefore the resolved sync interval) real.
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

import { NotFoundException } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { NestExpressApplication } from "@nestjs/platform-express"
import { differenceInMinutes } from "date-fns"
import { CalendarSyncModule } from "modules/calendar-sync/calendar-sync.module"
import { CalendarContentUpdatedEvent } from "modules/calendar-sync/events/calendar-content-updated.event"
import { CalendarFailure } from "modules/calendar-sync/models/calendar-failure.entity"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
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
  let eventEmitter: EventEmitter2
  let events: FetcherCalendarEvent[]

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarSyncModule] })
    service = app.get(CalendarSyncService)
    dataSource = app.get(DataSource)
    eventEmitter = app.get(EventEmitter2)
  })

  beforeEach(() => {
    events = [fetcherCalendarEventFactory.build()]
    icalFetcher.fetch.mockImplementation(async () => events)
    jest.spyOn(eventEmitter, "emitAsync")
  })

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

      // Verify no event was emitted for calendar creation
      expect(eventEmitter.emitAsync).not.toHaveBeenCalledWith(
        "calendar.content.updated",
        expect.any(CalendarContentUpdatedEvent),
      )
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

    it("emits CalendarContentUpdatedEvent when updating existing calendar", async () => {
      // First sync to create initial content
      const initialEvents = [
        fetcherCalendarEventFactory.build({
          uid: "initial-event",
          title: "Initial Event",
        }),
      ]
      icalFetcher.fetch.mockImplementation(async () => initialEvents)
      await service.sync(calendar)

      // Clear the emit spy
      jest.clearAllMocks()

      // Update with new events
      const newEvents = [
        fetcherCalendarEventFactory.build({
          uid: "updated-event",
          title: "Updated Event",
        }),
      ]
      icalFetcher.fetch.mockImplementation(async () => newEvents)

      await service.sync(calendar)

      // Verify event was emitted
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        "calendar.content.updated",
        expect.any(CalendarContentUpdatedEvent),
      )

      // Verify the event contains correct data
      const emitCall = (eventEmitter.emitAsync as jest.Mock).mock.calls.find(
        (call) => call[0] === "calendar.content.updated",
      )
      expect(emitCall).toBeDefined()
      const emittedEvent = emitCall[1] as CalendarContentUpdatedEvent
      expect(emittedEvent.calendarId).toBe(calendar.id)
      expect(emittedEvent.oldEvents).toHaveLength(1)
      expect(emittedEvent.oldEvents[0].uid).toBe("initial-event")
      expect(emittedEvent.newEvents).toHaveLength(1)
      expect(emittedEvent.newEvents[0].uid).toBe("updated-event")
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

      // Verify no event was emitted for calendar creation
      expect(eventEmitter.emitAsync).not.toHaveBeenCalledWith(
        "calendar.content.updated",
        expect.any(CalendarContentUpdatedEvent),
      )
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

          // Verify no event was emitted when calendar creation fails
          expect(eventEmitter.emitAsync).not.toHaveBeenCalledWith(
            "calendar.content.updated",
            expect.any(CalendarContentUpdatedEvent),
          )
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

      // Verify no event was emitted when existing calendar update fails
      expect(eventEmitter.emitAsync).not.toHaveBeenCalledWith(
        "calendar.content.updated",
        expect.any(CalendarContentUpdatedEvent),
      )
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

      // Clear the emitAsync spy after the successful sync
      jest.clearAllMocks()

      // Now make the fetch fail
      icalFetcher.fetch.mockImplementation(async () => {
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

      // Verify no event was emitted when existing calendar sync fails
      expect(eventEmitter.emitAsync).not.toHaveBeenCalledWith(
        "calendar.content.updated",
        expect.any(CalendarContentUpdatedEvent),
      )
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
    })
  })
})
