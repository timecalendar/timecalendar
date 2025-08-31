import { CalendarLogMapper } from "modules/calendar-log/mappers/calendar-log.mapper"
import { CalendarChange } from "modules/calendar-log/models/calendar-change"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"

describe("CalendarLogMapper", () => {
  let mapper: CalendarLogMapper

  beforeEach(() => {
    mapper = new CalendarLogMapper()
  })

  describe("toCalendarLogGet", () => {
    it("should map CalendarLog entity to CalendarLogGet DTO", () => {
      // Arrange
      const calendar: Calendar = {
        id: "calendar-123",
        token: "token-456",
        name: "Test Calendar",
        schoolName: "Test School",
        url: "https://test.com",
        customData: null,
        lastUpdatedAt: new Date("2025-01-01T10:00:00Z"),
        lastAccessedAt: new Date("2025-01-01T09:00:00Z"),
        createdAt: new Date("2025-01-01T08:00:00Z"),
        updatedAt: new Date("2025-01-01T11:00:00Z"),
      } as Calendar

      const calendarChange: CalendarChange = {
        oldItems: [
          {
            uid: "old-event-1",
            title: "Old Event 1",
            location: "Old Location 1",
            startsAt: new Date("2025-01-01T10:00:00Z"),
            endsAt: new Date("2025-01-01T11:00:00Z"),
          },
        ],
        newItems: [
          {
            uid: "new-event-1",
            title: "New Event 1",
            location: "New Location 1",
            startsAt: new Date("2025-01-02T10:00:00Z"),
            endsAt: new Date("2025-01-02T11:00:00Z"),
          },
        ],
        changedItems: [
          [
            {
              uid: "changed-event-1",
              title: "Old Title",
              location: "Old Location",
              startsAt: new Date("2025-01-03T10:00:00Z"),
              endsAt: new Date("2025-01-03T11:00:00Z"),
            },
            {
              uid: "changed-event-1",
              title: "New Title",
              location: "New Location",
              startsAt: new Date("2025-01-03T12:00:00Z"),
              endsAt: new Date("2025-01-03T13:00:00Z"),
            },
          ],
        ],
      }

      const calendarLog: CalendarLog = {
        id: "log-789",
        calendar,
        calendarChange,
        createdAt: new Date("2025-01-01T12:00:00Z"),
        updatedAt: new Date("2025-01-01T13:00:00Z"),
      } as CalendarLog

      // Act
      const result = mapper.toCalendarLogGet(calendarLog)

      // Assert
      expect(result).toEqual({
        id: "log-789",
        calendarId: "calendar-123",
        calendarToken: "token-456",
        calendarName: "Test Calendar",
        calendarChange: {
          oldItems: [
            {
              uid: "old-event-1",
              title: "Old Event 1",
              location: "Old Location 1",
              startsAt: new Date("2025-01-01T10:00:00Z"),
              endsAt: new Date("2025-01-01T11:00:00Z"),
            },
          ],
          newItems: [
            {
              uid: "new-event-1",
              title: "New Event 1",
              location: "New Location 1",
              startsAt: new Date("2025-01-02T10:00:00Z"),
              endsAt: new Date("2025-01-02T11:00:00Z"),
            },
          ],
          changedItems: [
            [
              {
                uid: "changed-event-1",
                title: "Old Title",
                location: "Old Location",
                startsAt: new Date("2025-01-03T10:00:00Z"),
                endsAt: new Date("2025-01-03T11:00:00Z"),
              },
              {
                uid: "changed-event-1",
                title: "New Title",
                location: "New Location",
                startsAt: new Date("2025-01-03T12:00:00Z"),
                endsAt: new Date("2025-01-03T13:00:00Z"),
              },
            ],
          ],
        },
        createdAt: new Date("2025-01-01T12:00:00Z"),
        updatedAt: new Date("2025-01-01T13:00:00Z"),
      })
    })
  })
})
