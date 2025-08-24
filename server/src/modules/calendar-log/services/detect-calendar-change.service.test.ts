import { NestExpressApplication } from "@nestjs/platform-express"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import { DetectCalendarChangeService } from "modules/calendar-log/services/detect-calendar-change.service"
import { CalendarContentUpdatedEvent } from "modules/calendar-sync/events/calendar-content-updated.event"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { EventType } from "modules/fetch/models/event.model"
import createTestApp from "test-utils/create-test-app"
import { assertChanges } from "test-utils/typeorm/assert-changes"
import { DataSource } from "typeorm"

describe("DetectCalendarChangeService", () => {
  let app: NestExpressApplication
  let service: DetectCalendarChangeService
  let repository: CalendarLogRepository
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarLogModule] })
    service = app.get(DetectCalendarChangeService)
    repository = app.get(CalendarLogRepository)
    dataSource = app.get(DataSource)
  })

  beforeEach(async () => {
    const mockDate = new Date("2024-01-15T12:00:00Z")
    jest.useFakeTimers({
      doNotFake: ["nextTick", "setImmediate"],
      now: mockDate,
    })
    await dataSource.query("DELETE FROM calendar_log")
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  afterAll(async () => {
    await app.close()
  })

  describe("handleCalendarContentUpdated", () => {
    it("should create calendar log when events are added", async () => {
      const calendar = await calendarFactory().create()

      const oldEvents: CalendarEvent[] = []
      const newEvents: CalendarEvent[] = [
        {
          uid: "test-event-1",
          title: "New Event",
          startsAt: new Date("2024-01-16T10:00:00Z"), // tomorrow from mock date
          endsAt: new Date("2024-01-16T11:00:00Z"), // tomorrow + 1 hour
          location: "Test Location",
          allDay: false,
          description: null,
          teachers: [],
          tags: [],
          type: EventType.CM,
          fields: null,
          exportedAt: new Date("2024-01-15T12:00:00Z"),
        },
      ]

      const event = new CalendarContentUpdatedEvent(
        calendar.id,
        oldEvents,
        newEvents,
      )

      await service.handleCalendarContentUpdated(event)

      const logs = await repository.findByCalendarId(calendar.id)
      expect(logs).toHaveLength(1)

      const savedLog = logs[0]
      expect(savedLog.calendar.id).toBe(calendar.id)

      const changes = savedLog.calendarChange
      expect(changes.newItems).toHaveLength(1)
      expect(changes.oldItems).toHaveLength(0)
      expect(changes.changedItems).toHaveLength(0)
      expect(changes.newItems[0].title).toBe("New Event")
    })

    it("should not create calendar log when no changes detected", async () => {
      const calendar = await calendarFactory().create()

      const events: CalendarEvent[] = [
        {
          uid: "test-event-1",
          title: "Same Event",
          startsAt: new Date("2024-01-16T10:00:00Z"), // tomorrow from mock date
          endsAt: new Date("2024-01-16T11:00:00Z"), // tomorrow + 1 hour
          location: "Test Location",
          allDay: false,
          description: null,
          teachers: [],
          tags: [],
          type: EventType.TD,
          fields: null,
          exportedAt: new Date("2024-01-15T12:00:00Z"),
        },
      ]

      const event = new CalendarContentUpdatedEvent(
        calendar.id,
        events, // same events for old and new
        events,
      )

      await service.handleCalendarContentUpdated(event)

      const logs = await repository.findByCalendarId(calendar.id)
      expect(logs).toHaveLength(0)
    })

    it("should detect event changes", async () => {
      const calendar = await calendarFactory().create()

      const oldEvents: CalendarEvent[] = [
        {
          uid: "test-event-1",
          title: "Old Title",
          startsAt: new Date("2024-01-16T10:00:00Z"), // tomorrow from mock date
          endsAt: new Date("2024-01-16T11:00:00Z"), // tomorrow + 1 hour
          location: "Old Location",
          allDay: false,
          description: null,
          teachers: [],
          tags: [],
          type: EventType.TP,
          fields: null,
          exportedAt: new Date("2024-01-15T12:00:00Z"),
        },
      ]

      const newEvents: CalendarEvent[] = [
        {
          uid: "test-event-1",
          title: "New Title", // changed title
          startsAt: new Date("2024-01-16T10:00:00Z"), // tomorrow from mock date
          endsAt: new Date("2024-01-16T11:00:00Z"), // tomorrow + 1 hour
          location: "New Location", // changed location
          allDay: false,
          description: null,
          teachers: [],
          tags: [],
          type: EventType.TP,
          fields: null,
          exportedAt: new Date("2024-01-15T12:00:00Z"),
        },
      ]

      const event = new CalendarContentUpdatedEvent(
        calendar.id,
        oldEvents,
        newEvents,
      )

      await assertChanges(dataSource, [[CalendarLog, 1]], () =>
        service.handleCalendarContentUpdated(event),
      )

      const logs = await repository.findByCalendarId(calendar.id)
      expect(logs).toHaveLength(1)

      const changes = logs[0].calendarChange
      expect(changes.changedItems).toHaveLength(1)
      expect(changes.newItems).toHaveLength(0)
      expect(changes.oldItems).toHaveLength(0)
    })
  })
})
