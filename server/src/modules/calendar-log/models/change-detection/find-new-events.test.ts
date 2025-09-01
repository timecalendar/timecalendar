import { findNewEvents } from "./find-new-events"
import { EventForChangeDetection } from "./find-event-changes"

const createEvent = (
  uid: string,
  title: string,
  location: string | null = null,
  startsAt: Date = new Date("2024-01-15T10:00:00Z"),
  endsAt: Date = new Date("2024-01-15T11:00:00Z"),
): EventForChangeDetection => ({
  uid,
  title,
  location,
  startsAt,
  endsAt,
})

describe("findNewEvents", () => {
  const referenceDate = new Date("2024-01-10T00:00:00Z")

  describe("basic functionality", () => {
    it("should identify new events", () => {
      const oldArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
      ]
      const newArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
        createEvent("3", "Event 3"), // New event
      ]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(1)
      expect(result[0].uid).toBe("3")
    })

    it("should return empty array when no new events", () => {
      const oldArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
      ]
      const newArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
      ]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(0)
    })

    it("should identify multiple new events", () => {
      const oldArray = [createEvent("1", "Event 1")]
      const newArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"), // New event
        createEvent("3", "Event 3"), // New event
        createEvent("4", "Event 4"), // New event
      ]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(3)
      expect(result.map((e) => e.uid)).toEqual(["2", "3", "4"])
    })

    it("should not report existing events as new", () => {
      const oldArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
        createEvent("3", "Event 3"),
      ]
      const newArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
        createEvent("3", "Event 3"),
      ]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(0)
    })
  })

  describe("comparison modes", () => {
    it("should use UID comparison when compareWithContent is false", () => {
      const oldArray = [createEvent("1", "Event Title")]
      const newArray = [
        createEvent("2", "Event Title"), // Different UID, same content
      ]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      // With UID comparison, this should be considered a new event
      expect(result).toHaveLength(1)
      expect(result[0].uid).toBe("2")
    })

    it("should use content comparison when compareWithContent is true", () => {
      const oldArray = [createEvent("1", "Event Title")]
      const newArray = [
        createEvent("2", "Event Title"), // Different UID, same content
      ]

      const result = findNewEvents(oldArray, newArray, true, referenceDate)

      // With content comparison, this should not be considered new
      expect(result).toHaveLength(0)
    })

    it("should identify new events by content when compareWithContent is true", () => {
      const oldArray = [createEvent("1", "Old Title")]
      const newArray = [
        createEvent("2", "New Title"), // Different UID and content
      ]

      const result = findNewEvents(oldArray, newArray, true, referenceDate)

      // With content comparison, this should be considered new
      expect(result).toHaveLength(1)
      expect(result[0].uid).toBe("2")
    })

    it("should handle content comparison with location differences", () => {
      const oldArray = [createEvent("1", "Event Title", "Location A")]
      const newArray = [
        createEvent("2", "Event Title", "Location B"), // Different UID and location
      ]

      const result = findNewEvents(oldArray, newArray, true, referenceDate)

      // With content comparison, different location makes it new
      expect(result).toHaveLength(1)
      expect(result[0].uid).toBe("2")
    })

    it("should handle content comparison with date differences", () => {
      const oldArray = [
        createEvent("1", "Event Title", null, new Date("2024-01-15T10:00:00Z")),
      ]
      const newArray = [
        createEvent("2", "Event Title", null, new Date("2024-01-15T11:00:00Z")), // Different start time
      ]

      const result = findNewEvents(oldArray, newArray, true, referenceDate)

      // With content comparison, different time makes it new
      expect(result).toHaveLength(1)
      expect(result[0].uid).toBe("2")
    })
  })

  describe("past event handling", () => {
    it("should skip past events", () => {
      const oldArray: EventForChangeDetection[] = []
      const newArray = [
        createEvent(
          "1",
          "Past Event",
          null,
          new Date("2024-01-05T10:00:00Z"), // Before reference date
          new Date("2024-01-05T11:00:00Z"),
        ),
      ]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(0)
    })

    it("should process future events", () => {
      const oldArray: EventForChangeDetection[] = []
      const newArray = [
        createEvent(
          "1",
          "Future Event",
          null,
          new Date("2024-01-15T10:00:00Z"), // After reference date
          new Date("2024-01-15T11:00:00Z"),
        ),
      ]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(1)
      expect(result[0].uid).toBe("1")
    })

    it("should handle mixed past and future events", () => {
      const oldArray: EventForChangeDetection[] = []
      const pastEvent = createEvent(
        "1",
        "Past Event",
        null,
        new Date("2024-01-05T10:00:00Z"), // Before reference date
        new Date("2024-01-05T11:00:00Z"),
      )
      const futureEvent = createEvent(
        "2",
        "Future Event",
        null,
        new Date("2024-01-15T10:00:00Z"), // After reference date
        new Date("2024-01-15T11:00:00Z"),
      )
      const newArray = [pastEvent, futureEvent]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(futureEvent)
    })

    it("should skip past events even when they exist in old array", () => {
      const pastEvent = createEvent(
        "1",
        "Past Event",
        null,
        new Date("2024-01-05T10:00:00Z"), // Before reference date
        new Date("2024-01-05T11:00:00Z"),
      )
      const oldArray = [pastEvent]
      const newArray = [pastEvent] // Same past event

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(0)
    })
  })

  describe("edge cases", () => {
    it("should handle empty old array", () => {
      const oldArray: EventForChangeDetection[] = []
      const newArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
      ]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(2)
      expect(result.map((e) => e.uid)).toEqual(["1", "2"])
    })

    it("should handle empty new array", () => {
      const oldArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
      ]
      const newArray: EventForChangeDetection[] = []

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(0)
    })

    it("should handle both arrays empty", () => {
      const oldArray: EventForChangeDetection[] = []
      const newArray: EventForChangeDetection[] = []

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(0)
    })

    it("should handle events with null location", () => {
      const oldArray = [createEvent("1", "Event", "Old Location")]
      const newArray = [
        createEvent("2", "Event", null), // Different UID, null location
      ]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(1)
      expect(result[0].uid).toBe("2")
      expect(result[0].location).toBeNull()
    })

    it("should handle events with same content but different UIDs in UID comparison mode", () => {
      const oldArray = [createEvent("1", "Same Title", "Same Location")]
      const newArray = [
        createEvent("2", "Same Title", "Same Location"), // Different UID, same content
        createEvent("3", "Same Title", "Same Location"), // Different UID, same content
      ]

      const result = findNewEvents(
        oldArray,
        newArray,
        false, // UID comparison
        referenceDate,
      )

      expect(result).toHaveLength(2)
      expect(result.map((e) => e.uid)).toEqual(["2", "3"])
    })

    it("should handle all events being new", () => {
      const oldArray: EventForChangeDetection[] = []
      const newArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
        createEvent("3", "Event 3"),
      ]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      expect(result).toHaveLength(3)
      expect(result.map((e) => e.uid)).toEqual(["1", "2", "3"])
    })

    it("should handle complex mixed scenario", () => {
      const oldArray = [
        createEvent("1", "Existing Event"),
        createEvent("2", "Another Existing"),
      ]
      const newArray = [
        createEvent("1", "Existing Event"), // Unchanged
        createEvent("2", "Modified Existing"), // Changed content (but same UID)
        createEvent("3", "New Event 1"), // New
        createEvent("4", "New Event 2"), // New
      ]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      // Only events with UIDs 3 and 4 are truly new
      expect(result).toHaveLength(2)
      expect(result.map((e) => e.uid)).toEqual(["3", "4"])
    })

    it("should handle events at exactly the reference date", () => {
      const eventAtReferenceDate = createEvent(
        "1",
        "Event at reference",
        null,
        referenceDate, // Exactly at reference date
        new Date(referenceDate.getTime() + 3600000), // One hour later
      )
      const oldArray: EventForChangeDetection[] = []
      const newArray = [eventAtReferenceDate]

      const result = findNewEvents(oldArray, newArray, false, referenceDate)

      // Event at exactly reference date should be included (not in the past)
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(eventAtReferenceDate)
    })
  })
})
