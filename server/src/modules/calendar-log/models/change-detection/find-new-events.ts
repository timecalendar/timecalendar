import { EventForChangeDetection } from "./find-event-changes"

/**
 * Compare events by their contents (title, location, start, end)
 *
 * @param a The first event
 * @param b The second event
 */
const eventContentEquals = (
  a: EventForChangeDetection,
  b: EventForChangeDetection,
) =>
  a.startsAt.getTime() === b.startsAt.getTime() &&
  a.endsAt.getTime() === b.endsAt.getTime() &&
  a.title === b.title &&
  a.location === b.location

/**
 * Compare events by their uids, or by their contents
 *
 * @param a The first event
 * @param b The second event
 * @param compareWithContent True if the contents should be compared. Defaults to false
 */
const eventEquals = (
  a: EventForChangeDetection,
  b: EventForChangeDetection,
  compareWithContent = false,
) => {
  if (compareWithContent) {
    return eventContentEquals(a, b)
  }
  return a.uid === b.uid
}

/**
 * Check if an event is in the past relative to the reference time
 *
 * @param event The event to check
 * @param referenceDate The reference date
 */
const isEventInPast = (
  event: EventForChangeDetection,
  referenceDate: Date,
): boolean => {
  return event.startsAt.getTime() < referenceDate.getTime()
}

/**
 * Process new events to identify which ones are truly new (not in old array)
 *
 * @param oldArray The old array of events
 * @param newArray The new array of events
 * @param compareWithContent Whether to compare by content instead of UID
 * @param referenceDate The reference date
 * @returns Array of new events
 */
export const findNewEvents = <T extends EventForChangeDetection>(
  oldArray: T[],
  newArray: T[],
  compareWithContent: boolean,
  referenceDate: Date,
): T[] => {
  const newItems: T[] = []

  newArray.forEach((newItem) => {
    // Do not add events in the past
    if (isEventInPast(newItem, referenceDate)) return
    const existingOldEvent = oldArray.find((oldItem) =>
      eventEquals(oldItem, newItem, compareWithContent),
    )
    if (!existingOldEvent) {
      newItems.push(newItem)
    }
  })

  return newItems
}
