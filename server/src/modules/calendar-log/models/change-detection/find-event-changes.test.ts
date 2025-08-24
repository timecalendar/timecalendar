import { findEventChanges, EventForChangeDetection } from "./find-event-changes"

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

describe("findEventChanges", () => {
  const referenceDate = new Date("2024-01-10T00:00:00Z")

  describe("nominal cases without bad ICal detection", () => {
    it("should identify new, removed, and changed events in a single operation", () => {
      const oldArray = [
        createEvent("1", "Unchanged Event"),
        createEvent("2", "Event to Change", "Old Location"),
        createEvent("3", "Event to Remove"),
      ]
      const newArray = [
        createEvent("1", "Unchanged Event"),
        createEvent("2", "Event to Change", "New Location"), // Changed
        createEvent("4", "New Event"), // New
      ]

      const result = findEventChanges(referenceDate, oldArray, newArray)

      expect(result.oldItems).toHaveLength(1)
      expect(result.oldItems[0].uid).toBe("3")

      expect(result.newItems).toHaveLength(1)
      expect(result.newItems[0].uid).toBe("4")

      expect(result.changedItems).toHaveLength(1)
      expect(result.changedItems[0][0].uid).toBe("2")
      expect(result.changedItems[0][0].location).toBe("Old Location")
      expect(result.changedItems[0][1].location).toBe("New Location")
    })

    it("should return empty changes when arrays are identical", () => {
      const events = [createEvent("1", "Event 1"), createEvent("2", "Event 2")]

      const result = findEventChanges(referenceDate, events, events)

      expect(result.oldItems).toHaveLength(0)
      expect(result.newItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should handle completely different arrays", () => {
      const oldArray = [
        createEvent("1", "Old Event 1"),
        createEvent("2", "Old Event 2"),
      ]
      const newArray = [
        createEvent("3", "New Event 1"),
        createEvent("4", "New Event 2"),
      ]

      const result = findEventChanges(referenceDate, oldArray, newArray)

      expect(result.oldItems).toHaveLength(2)
      expect(result.oldItems.map((e) => e.uid)).toEqual(["1", "2"])

      expect(result.newItems).toHaveLength(2)
      expect(result.newItems.map((e) => e.uid)).toEqual(["3", "4"])

      expect(result.changedItems).toHaveLength(0)
    })

    it("should use UID comparison by default", () => {
      const oldArray = [createEvent("1", "Same Title", "Same Location")]
      const newArray = [createEvent("2", "Same Title", "Same Location")]

      const result = findEventChanges(referenceDate, oldArray, newArray)

      // With UID comparison, these are different events
      expect(result.oldItems).toHaveLength(1)
      expect(result.newItems).toHaveLength(1)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should use content comparison when specified", () => {
      const oldArray = [createEvent("1", "Same Title", "Same Location")]
      const newArray = [createEvent("2", "Same Title", "Same Location")]

      const result = findEventChanges(
        referenceDate,
        oldArray,
        newArray,
        true, // compareWithContent
      )

      // With content comparison, these are the same event
      expect(result.oldItems).toHaveLength(0)
      expect(result.newItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(0)
    })
  })

  describe("bad ICal implementation detection and recovery", () => {
    it("should detect bad ICal implementation and retry with content comparison", () => {
      // Create 10 events to meet the threshold
      const totalEvents = 10
      const baseDate = new Date("2024-01-15T10:00:00Z")
      const endDate = new Date("2024-01-15T11:00:00Z")

      // Create old events
      const oldArray = Array.from({ length: totalEvents }, (_, i) =>
        createEvent(`old-${i}`, "Math Course", "Room 101", baseDate, endDate),
      )

      // Create new events with different UIDs but same content (simulating bad ICal)
      const newArray = Array.from({ length: totalEvents }, (_, i) =>
        createEvent(`new-${i}`, "Math Course", "Room 101", baseDate, endDate),
      )

      const result = findEventChanges(referenceDate, oldArray, newArray)

      // Should return empty changes after detecting bad implementation
      expect(result.oldItems).toHaveLength(0)
      expect(result.newItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should return empty changes when bad ICal is detected with content comparison already enabled", () => {
      const totalEvents = 10
      const baseDate = new Date("2024-01-15T10:00:00Z")
      const endDate = new Date("2024-01-15T11:00:00Z")

      const oldArray = Array.from({ length: totalEvents }, (_, i) =>
        createEvent(`old-${i}`, "Math Course", "Room 101", baseDate, endDate),
      )

      const newArray = Array.from({ length: totalEvents }, (_, i) =>
        createEvent(`new-${i}`, "Math Course", "Room 101", baseDate, endDate),
      )

      const result = findEventChanges(
        referenceDate,
        oldArray,
        newArray,
        true, // Already using content comparison
      )

      expect(result.oldItems).toHaveLength(0)
      expect(result.newItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should not trigger bad ICal detection when events are genuinely different", () => {
      const totalEvents = 10

      const oldArray = Array.from({ length: totalEvents }, (_, i) =>
        createEvent(`${i}`, `Old Event ${i}`, `Old Location ${i}`),
      )

      const newArray = Array.from({ length: totalEvents }, (_, i) =>
        createEvent(`${i + 100}`, `New Event ${i}`, `New Location ${i}`),
      )

      const result = findEventChanges(referenceDate, oldArray, newArray)

      // Should process normally without bad ICal detection
      expect(result.oldItems).toHaveLength(totalEvents)
      expect(result.newItems).toHaveLength(totalEvents)
      expect(result.changedItems).toHaveLength(0)
    })

    it("should detect bad ICal when many events appear as both new and removed with same content", () => {
      const baseDate = new Date("2024-01-15T10:00:00Z")
      const endDate = new Date("2024-01-15T11:00:00Z")

      // Create 12 total events to ensure we meet the threshold
      // Threshold = max(5, ceil(12/2)) = max(5, 6) = 6
      // We'll have 8 events that appear as both new and old (with same content but different UIDs)
      const oldArray = Array.from({ length: 8 }, (_, i) =>
        createEvent(`old-${i}`, "Math Course", "Room 101", baseDate, endDate),
      )

      const newArray = Array.from({ length: 8 }, (_, i) =>
        createEvent(`new-${i}`, "Math Course", "Room 101", baseDate, endDate),
      )

      const result = findEventChanges(referenceDate, oldArray, newArray)

      // Should detect bad ICal and return empty changes
      expect(result.oldItems).toHaveLength(0)
      expect(result.newItems).toHaveLength(0)
      expect(result.changedItems).toHaveLength(0)
    })
  })

  describe("integration with past event filtering", () => {
    it("should filter out past events from all change types", () => {
      const pastDate = new Date("2024-01-05T10:00:00Z") // Before reference date
      const futureDate = new Date("2024-01-15T10:00:00Z") // After reference date

      const oldArray = [
        createEvent("1", "Past Event", null, pastDate),
        createEvent("2", "Future Event", null, futureDate),
        createEvent("3", "Future Changed Event", "Old Location", futureDate),
      ]

      const newArray = [
        createEvent("1", "Past Event Modified", null, pastDate), // Past - should be ignored
        createEvent("4", "New Future Event", null, futureDate), // New future event
        createEvent("3", "Future Changed Event", "New Location", futureDate), // Changed future event
      ]

      const result = findEventChanges(referenceDate, oldArray, newArray)

      expect(result.oldItems).toHaveLength(1)
      expect(result.oldItems[0].uid).toBe("2") // Only future removed event

      expect(result.newItems).toHaveLength(1)
      expect(result.newItems[0].uid).toBe("4") // Only future new event

      expect(result.changedItems).toHaveLength(1)
      expect(result.changedItems[0][0].uid).toBe("3") // Only future changed event
    })
  })

  describe("complex realistic scenarios", () => {
    it("should handle a typical calendar sync scenario", () => {
      const oldArray = [
        createEvent("meeting-1", "Team Meeting", "Conference Room A"),
        createEvent("lunch-1", "Lunch with Client", "Restaurant"),
        createEvent("review-1", "Code Review", null),
        createEvent("training-1", "Security Training", "Training Room"),
      ]

      const newArray = [
        createEvent("meeting-1", "Team Meeting", "Conference Room B"), // Location changed
        createEvent("lunch-1", "Lunch with Client", "Restaurant"), // Unchanged
        // review-1 removed
        createEvent("training-1", "Security Training", "Training Room"), // Unchanged
        createEvent("standup-1", "Daily Standup", "Virtual"), // New event
        createEvent("demo-1", "Product Demo", "Main Hall"), // New event
      ]

      const result = findEventChanges(referenceDate, oldArray, newArray)

      expect(result.oldItems).toHaveLength(1)
      expect(result.oldItems[0].uid).toBe("review-1")

      expect(result.newItems).toHaveLength(2)
      expect(result.newItems.map((e) => e.uid)).toEqual(["standup-1", "demo-1"])

      expect(result.changedItems).toHaveLength(1)
      expect(result.changedItems[0][0].uid).toBe("meeting-1")
      expect(result.changedItems[0][0].location).toBe("Conference Room A")
      expect(result.changedItems[0][1].location).toBe("Conference Room B")
    })

    it("should handle large calendar with no bad ICal detection", () => {
      const totalEvents = 100
      const changedEvents = 5
      const newEvents = 10
      const removedEvents = 3

      // Create base events
      const baseEvents = Array.from({ length: totalEvents }, (_, i) =>
        createEvent(`event-${i}`, `Event ${i}`, `Location ${i}`),
      )

      // Create old array (remove some events that will be "removed")
      const oldArray = [
        ...baseEvents,
        ...Array.from({ length: removedEvents }, (_, i) =>
          createEvent(`removed-${i}`, `Removed Event ${i}`, null),
        ),
      ]

      // Create new array with changes
      const newArray = [
        // Keep most events unchanged
        ...baseEvents.slice(0, totalEvents - changedEvents),
        // Change some events
        ...Array.from({ length: changedEvents }, (_, i) => {
          const originalIndex = totalEvents - changedEvents + i
          return createEvent(
            `event-${originalIndex}`,
            `Modified Event ${originalIndex}`,
            `New Location ${originalIndex}`,
          )
        }),
        // Add new events
        ...Array.from({ length: newEvents }, (_, i) =>
          createEvent(`new-${i}`, `New Event ${i}`, `New Location ${i}`),
        ),
      ]

      const result = findEventChanges(referenceDate, oldArray, newArray)

      expect(result.oldItems).toHaveLength(removedEvents)
      expect(result.newItems).toHaveLength(newEvents)
      expect(result.changedItems).toHaveLength(changedEvents)

      // Verify no bad ICal detection was triggered
      expect(
        result.newItems.length +
          result.oldItems.length +
          result.changedItems.length,
      ).toBeGreaterThan(0)
    })
  })
})
