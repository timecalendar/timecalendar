import { findRemovedAndChangedEvents } from "./find-removed-and-changed-events"
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

describe("findRemovedAndChangedEvents", () => {
  const referenceDate = new Date("2024-01-10T00:00:00Z")

  describe("basic functionality", () => {
    it("should identify removed events", () => {
      const oldArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
        createEvent("3", "Event 3"),
      ]
      const newArray = [
        createEvent("1", "Event 1"),
        createEvent("3", "Event 3"),
      ]

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(1)
      expect(result.oldItems[0].uid).toBe("2")
      expect(result.changedItems).toHaveLength(0)
    })

    it("should identify changed events when not comparing by content", () => {
      const oldEvent = createEvent("1", "Old Title")
      const newEvent = createEvent("1", "New Title") // Same UID, different content

      const oldArray = [oldEvent]
      const newArray = [newEvent]

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(1)
      expect(result.changedItems[0]).toEqual([oldEvent, newEvent])
    })

    it("should not report changes when content is identical", () => {
      const oldEvent = createEvent("1", "Same Title")
      const newEvent = createEvent("1", "Same Title") // Same UID and content

      const oldArray = [oldEvent]
      const newArray = [newEvent]

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should handle mixed scenarios with removed and changed events", () => {
      const oldArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2 Old"),
        createEvent("3", "Event 3"),
        createEvent("4", "Event 4"),
      ]
      const newArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2 New"), // Changed content
        createEvent("4", "Event 4"),
      ]

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(1)
      expect(result.oldItems[0].uid).toBe("3")
      expect(result.changedItems).toHaveLength(1)
      expect(result.changedItems[0][0].uid).toBe("2")
    })
  })

  describe("comparison modes", () => {
    it("should not report content changes when compareWithContent is true", () => {
      const oldArray = [createEvent("1", "Old Title")]
      const newArray = [createEvent("1", "New Title")] // Same UID, different content

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        true,
        referenceDate,
      )

      // When compareWithContent is true, we don't check for content changes
      expect(result.changedItems).toHaveLength(0)
    })

    it("should use content comparison when compareWithContent is true", () => {
      const oldEvent = createEvent("1", "Same Title")
      const newEvent = createEvent("2", "Same Title") // Different UID, same content

      const oldArray = [oldEvent]
      const newArray = [newEvent]

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        true,
        referenceDate,
      )

      // With content comparison, these events should match
      expect(result.oldItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should use UID comparison when compareWithContent is false", () => {
      const oldEvent = createEvent("1", "Title")
      const newEvent = createEvent("2", "Title") // Different UID, same content

      const oldArray = [oldEvent]
      const newArray = [newEvent]

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      // With UID comparison, these events don't match
      expect(result.oldItems).toHaveLength(1)
      expect(result.oldItems[0]).toBe(oldEvent)
    })
  })

  describe("past event handling", () => {
    it("should skip past events", () => {
      const pastEvent = createEvent(
        "1",
        "Past Event",
        null,
        new Date("2024-01-05T10:00:00Z"), // Before reference date
        new Date("2024-01-05T11:00:00Z"),
      )
      const oldArray = [pastEvent]
      const newArray = []

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should process future events", () => {
      const futureEvent = createEvent(
        "1",
        "Future Event",
        null,
        new Date("2024-01-15T10:00:00Z"), // After reference date
        new Date("2024-01-15T11:00:00Z"),
      )
      const oldArray = [futureEvent]
      const newArray = []

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(1)
      expect(result.oldItems[0]).toBe(futureEvent)
    })

    it("should skip past event pairs even when both events exist", () => {
      const pastOldEvent = createEvent(
        "1",
        "Past Old Event",
        null,
        new Date("2024-01-05T10:00:00Z"), // Before reference date
        new Date("2024-01-05T11:00:00Z"),
      )
      const pastNewEvent = createEvent(
        "1",
        "Past New Event",
        null,
        new Date("2024-01-05T10:00:00Z"), // Before reference date
        new Date("2024-01-05T11:00:00Z"),
      )

      const oldArray = [pastOldEvent]
      const newArray = [pastNewEvent]

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should handle mixed past and future events", () => {
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

      const oldArray = [pastEvent, futureEvent]
      const newArray = []

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(1)
      expect(result.oldItems[0]).toBe(futureEvent)
    })
  })

  describe("edge cases", () => {
    it("should handle empty old array", () => {
      const oldArray: EventForChangeDetection[] = []
      const newArray = [createEvent("1", "Event 1")]

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should handle empty new array", () => {
      const oldArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
      ]
      const newArray: EventForChangeDetection[] = []

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(2)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should handle both arrays empty", () => {
      const oldArray: EventForChangeDetection[] = []
      const newArray: EventForChangeDetection[] = []

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should handle events with null location", () => {
      const oldEvent = createEvent("1", "Event", null)
      const newEvent = createEvent("1", "Event", "New Location")

      const oldArray = [oldEvent]
      const newArray = [newEvent]

      // Content is different due to location change

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.changedItems).toHaveLength(1)
      expect(result.changedItems[0]).toEqual([oldEvent, newEvent])
    })

    it("should handle all events being removed", () => {
      const oldArray = [
        createEvent("1", "Event 1"),
        createEvent("2", "Event 2"),
        createEvent("3", "Event 3"),
      ]
      const newArray: EventForChangeDetection[] = []

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(3)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should handle all events being changed", () => {
      const oldArray = [
        createEvent("1", "Old Event 1"),
        createEvent("2", "Old Event 2"),
      ]
      const newArray = [
        createEvent("1", "New Event 1"),
        createEvent("2", "New Event 2"),
      ]

      // All events have different content

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        false,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(2)
    })

    it("should handle events with same UID but different content in content comparison mode", () => {
      const oldEvent = createEvent("1", "Old Title")
      const newEvent = createEvent("1", "New Title")

      const oldArray = [oldEvent]
      const newArray = [newEvent]

      // In content comparison mode, these should be treated as different events

      const result = findRemovedAndChangedEvents(
        oldArray,
        newArray,
        true,
        referenceDate,
      )

      expect(result.oldItems).toHaveLength(1)
      expect(result.oldItems[0]).toBe(oldEvent)
      expect(result.changedItems).toHaveLength(0)
    })
  })
})
