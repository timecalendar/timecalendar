import { EventForChangeDetection } from "./find-event-changes"
import { buildEventIndex, eventComparisonKey } from "./event-comparison-utils"

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
  const oldEventsByKey = buildEventIndex(oldArray, compareWithContent)

  newArray.forEach((newItem) => {
    // Do not add events in the past
    if (isEventInPast(newItem, referenceDate)) return
    const existingOldEvent = oldEventsByKey.get(
      eventComparisonKey(newItem, compareWithContent),
    )
    if (!existingOldEvent) {
      newItems.push(newItem)
    }
  })

  return newItems
}
