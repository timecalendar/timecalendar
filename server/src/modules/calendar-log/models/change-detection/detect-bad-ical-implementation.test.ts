import { CalendarChange } from "modules/calendar-log/models/calendar-change"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { detectBadIcalImplementations } from "./detect-bad-ical-implementation"

describe("detectBadIcalImplementations", () => {
  const createCalendarChange = (
    oldItems: CalendarEvent[] = [],
    newItems: CalendarEvent[] = [],
    changedItems: [CalendarEvent, CalendarEvent][] = [],
  ): CalendarChange => ({
    oldItems,
    newItems,
    changedItems,
  })

  describe("when there are fewer new items than threshold", () => {
    it("should return false for small calendar with few new events", () => {
      const events = calendarEventFactory.buildList(3)
      const difference = createCalendarChange(
        [],
        calendarEventFactory.buildList(2),
      )

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false)
    })

    it("should return false for large calendar with few new events", () => {
      const events = calendarEventFactory.buildList(20)
      const difference = createCalendarChange(
        [],
        calendarEventFactory.buildList(5),
      )

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false)
    })

    it("should return false when exactly at threshold - 1", () => {
      const events = calendarEventFactory.buildList(10) // threshold = max(5, 5) = 5
      const difference = createCalendarChange(
        [],
        calendarEventFactory.buildList(4),
      )

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false)
    })
  })

  describe("when there are enough new items to trigger analysis", () => {
    it("should return false when events are truly different (good ICal implementation)", () => {
      const events = calendarEventFactory.buildList(10)

      // Create 6 truly new events (different content)
      const newItems = calendarEventFactory.buildList(6, {
        title: "New Event",
        location: "New Location",
      })

      // Create 6 old events that don't match the new ones
      const oldItems = calendarEventFactory.buildList(6, {
        title: "Old Event",
        location: "Old Location",
      })

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false)
    })

    it("should return true when many events have matching content but different UIDs (bad ICal)", () => {
      const events = calendarEventFactory.buildList(10) // threshold = 5

      const baseDate = new Date("2021-08-30T07:00:00.000Z")
      const endDate = new Date("2021-08-30T08:00:00.000Z")

      // Create 6 "new" items that are actually the same as old items (different UIDs only)
      const newItems = calendarEventFactory.buildList(6, {
        title: "Math Course",
        location: "Room 101",
        startsAt: baseDate,
        endsAt: endDate,
      })

      // Create 6 "old" items with same content but different UIDs
      const oldItems = calendarEventFactory.buildList(6, {
        title: "Math Course",
        location: "Room 101",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(true)
    })

    it("should return false when some events match but not enough to indicate bad implementation", () => {
      const events = calendarEventFactory.buildList(10) // threshold = 5

      const baseDate = new Date("2021-08-30T07:00:00.000Z")
      const endDate = new Date("2021-08-30T08:00:00.000Z")

      // Create 6 new items, but only 3 will match old items
      const newItems = [
        // 3 items that match old items (same content, different UID)
        ...calendarEventFactory.buildList(3, {
          title: "Math Course",
          location: "Room 101",
          startsAt: baseDate,
          endsAt: endDate,
        }),
        // 3 items that are truly different
        ...calendarEventFactory.buildList(3, {
          title: "Physics Course",
          location: "Lab 202",
        }),
      ]

      const oldItems = [
        // 3 items that match new items
        ...calendarEventFactory.buildList(3, {
          title: "Math Course",
          location: "Room 101",
          startsAt: baseDate,
          endsAt: endDate,
        }),
        // 3 items that don't match anything
        ...calendarEventFactory.buildList(3, {
          title: "Chemistry Course",
          location: "Lab 303",
        }),
      ]

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false)
    })
  })

  describe("threshold calculation edge cases", () => {
    it("should use minimum threshold of 5 for very small calendars", () => {
      const events = calendarEventFactory.buildList(2) // 50% would be 1, but min is 5
      const difference = createCalendarChange(
        [],
        calendarEventFactory.buildList(4),
      )

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false) // 4 < 5 (minimum threshold)
    })

    it("should use 50% threshold for larger calendars", () => {
      const events = calendarEventFactory.buildList(20) // 50% = 10, which is > 5

      // Create exactly 10 new items that match old items
      const baseDate = new Date("2021-08-30T07:00:00.000Z")
      const endDate = new Date("2021-08-30T08:00:00.000Z")

      const newItems = calendarEventFactory.buildList(10, {
        title: "Course",
        location: "Room",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const oldItems = calendarEventFactory.buildList(10, {
        title: "Course",
        location: "Room",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false) // 10 matches, but threshold is also 10, so not > threshold
    })

    it("should detect bad implementation when matches exceed 50% threshold", () => {
      const events = calendarEventFactory.buildList(20) // threshold = 10

      const baseDate = new Date("2021-08-30T07:00:00.000Z")
      const endDate = new Date("2021-08-30T08:00:00.000Z")

      // Create 11 new items that match old items (exceeds threshold of 10)
      const newItems = calendarEventFactory.buildList(11, {
        title: "Course",
        location: "Room",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const oldItems = calendarEventFactory.buildList(11, {
        title: "Course",
        location: "Room",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(true) // 11 matches > 10 threshold
    })
  })

  describe("content matching logic", () => {
    it("should match events by title, location, start time, and end time", () => {
      const events = calendarEventFactory.buildList(10)

      const baseDate = new Date("2021-08-30T07:00:00.000Z")
      const endDate = new Date("2021-08-30T08:00:00.000Z")

      const newItems = calendarEventFactory.buildList(6, {
        title: "Exact Match",
        location: "Exact Location",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const oldItems = calendarEventFactory.buildList(6, {
        title: "Exact Match",
        location: "Exact Location",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(true)
    })

    it("should not match events with different titles", () => {
      const events = calendarEventFactory.buildList(10)

      const baseDate = new Date("2021-08-30T07:00:00.000Z")
      const endDate = new Date("2021-08-30T08:00:00.000Z")

      const newItems = calendarEventFactory.buildList(6, {
        title: "Different Title",
        location: "Same Location",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const oldItems = calendarEventFactory.buildList(6, {
        title: "Original Title",
        location: "Same Location",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false)
    })

    it("should not match events with different locations", () => {
      const events = calendarEventFactory.buildList(10)

      const baseDate = new Date("2021-08-30T07:00:00.000Z")
      const endDate = new Date("2021-08-30T08:00:00.000Z")

      const newItems = calendarEventFactory.buildList(6, {
        title: "Same Title",
        location: "Different Location",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const oldItems = calendarEventFactory.buildList(6, {
        title: "Same Title",
        location: "Original Location",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false)
    })

    it("should not match events with different start times", () => {
      const events = calendarEventFactory.buildList(10)

      const startDate1 = new Date("2021-08-30T07:00:00.000Z")
      const startDate2 = new Date("2021-08-30T08:00:00.000Z")
      const endDate = new Date("2021-08-30T09:00:00.000Z")

      const newItems = calendarEventFactory.buildList(6, {
        title: "Same Title",
        location: "Same Location",
        startsAt: startDate1,
        endsAt: endDate,
      })

      const oldItems = calendarEventFactory.buildList(6, {
        title: "Same Title",
        location: "Same Location",
        startsAt: startDate2,
        endsAt: endDate,
      })

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false)
    })

    it("should not match events with different end times", () => {
      const events = calendarEventFactory.buildList(10)

      const startDate = new Date("2021-08-30T07:00:00.000Z")
      const endDate1 = new Date("2021-08-30T08:00:00.000Z")
      const endDate2 = new Date("2021-08-30T09:00:00.000Z")

      const newItems = calendarEventFactory.buildList(6, {
        title: "Same Title",
        location: "Same Location",
        startsAt: startDate,
        endsAt: endDate1,
      })

      const oldItems = calendarEventFactory.buildList(6, {
        title: "Same Title",
        location: "Same Location",
        startsAt: startDate,
        endsAt: endDate2,
      })

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false)
    })

    it("should handle null locations correctly", () => {
      const events = calendarEventFactory.buildList(10)

      const baseDate = new Date("2021-08-30T07:00:00.000Z")
      const endDate = new Date("2021-08-30T08:00:00.000Z")

      const newItems = calendarEventFactory.buildList(6, {
        title: "Same Title",
        location: null,
        startsAt: baseDate,
        endsAt: endDate,
      })

      const oldItems = calendarEventFactory.buildList(6, {
        title: "Same Title",
        location: null,
        startsAt: baseDate,
        endsAt: endDate,
      })

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(true)
    })

    it("should not match when one location is null and other is not", () => {
      const events = calendarEventFactory.buildList(10)

      const baseDate = new Date("2021-08-30T07:00:00.000Z")
      const endDate = new Date("2021-08-30T08:00:00.000Z")

      const newItems = calendarEventFactory.buildList(6, {
        title: "Same Title",
        location: null,
        startsAt: baseDate,
        endsAt: endDate,
      })

      const oldItems = calendarEventFactory.buildList(6, {
        title: "Same Title",
        location: "Some Location",
        startsAt: baseDate,
        endsAt: endDate,
      })

      const difference = createCalendarChange(oldItems, newItems)

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false)
    })
  })

  describe("edge cases", () => {
    it("should handle empty events array", () => {
      const events: CalendarEvent[] = []
      const difference = createCalendarChange(
        [],
        calendarEventFactory.buildList(6),
      )

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false) // threshold would be max(5, 0) = 5, and 6 >= 5, but no matches
    })

    it("should handle empty difference arrays", () => {
      const events = calendarEventFactory.buildList(10)
      const difference = createCalendarChange([], [])

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false)
    })

    it("should handle case where newItems exist but oldItems is empty", () => {
      const events = calendarEventFactory.buildList(10)
      const difference = createCalendarChange(
        [],
        calendarEventFactory.buildList(6),
      )

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false) // No old items to match against
    })

    it("should handle case where oldItems exist but newItems is empty", () => {
      const events = calendarEventFactory.buildList(10)
      const difference = createCalendarChange(
        calendarEventFactory.buildList(6),
        [],
      )

      const result = detectBadIcalImplementations(events, difference)

      expect(result).toBe(false) // No new items to analyze
    })
  })
})
