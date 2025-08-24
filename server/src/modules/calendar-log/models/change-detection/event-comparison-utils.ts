import { EventForChangeDetection } from "./find-event-changes"

/**
 * Compare events by their contents (title, location, start, end)
 *
 * @param a The first event
 * @param b The second event
 */
export const eventContentEquals = (
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
export const eventEquals = (
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
export const isEventInPast = (
  event: EventForChangeDetection,
  referenceDate: Date,
): boolean => {
  return event.startsAt.getTime() < referenceDate.getTime()
}

/**
 * Check if a pair of events (old and potentially new) should be skipped because they are in the past
 *
 * @param oldEvent The old event
 * @param newEvent The corresponding new event (if found)
 * @param referenceDate The reference date
 */
export const shouldSkipPastEventPair = (
  oldEvent: EventForChangeDetection,
  newEvent: EventForChangeDetection | undefined,
  referenceDate: Date,
): boolean => {
  return (
    isEventInPast(oldEvent, referenceDate) &&
    (!newEvent || isEventInPast(newEvent, referenceDate))
  )
}
