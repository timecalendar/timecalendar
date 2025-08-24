import { detectBadIcalImplementations } from "modules/calendar-log/models/change-detection/detect-bad-ical-implementation"
import { CalendarChange } from "modules/calendar-log/models/calendar-change"
import { findRemovedAndChangedEvents } from "./find-removed-and-changed-events"
import { findNewEvents } from "./find-new-events"

/**
 * Minimal interface for calendar event change detection
 * Contains only the fields needed for comparing and tracking changes
 */
export interface EventForChangeDetection {
  uid: string
  title: string
  location: string | null
  startsAt: Date
  endsAt: Date
}

const buildNewChange = <
  T extends EventForChangeDetection,
>(): CalendarChange<T> => ({
  oldItems: [],
  newItems: [],
  changedItems: [],
})

/**
 * Returns the list of differences between two arrays of events.
 *
 * The comparison between the events is made with their uid.
 * If the old and new elements are similar, the comparison is made
 * with their content (title, location, start, end). This allows to deal
 * with cases where providers return a different uid for the same event.
 *
 * Find differences between two array of events
 * @param referenceDate The current date
 * @param oldArray The old array to compare
 * @param newArray The new array to compare
 * @param compareWithContent True if the contents should be compared. Defaults to false
 */
export const findEventChanges = <T extends EventForChangeDetection>(
  referenceDate: Date,
  oldArray: T[],
  newArray: T[],
  compareWithContent = false,
) => {
  const { oldItems, changedItems } = findRemovedAndChangedEvents(
    oldArray,
    newArray,
    compareWithContent,
    referenceDate,
  )
  const newItems = findNewEvents(
    oldArray,
    newArray,
    compareWithContent,
    referenceDate,
  )

  const diff: CalendarChange<T> = {
    oldItems,
    newItems,
    changedItems,
  }

  // Check with this difference if the ICal has a bad implementation
  if (detectBadIcalImplementations(newArray, diff)) {
    if (compareWithContent) {
      // This difference cannot be fixed
      // Return an empty difference
      return buildNewChange<T>()
    }
    return findEventChanges(referenceDate, oldArray, newArray, true)
  }

  return diff
}
