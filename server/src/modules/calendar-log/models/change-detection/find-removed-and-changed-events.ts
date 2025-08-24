import { EventForChangeDetection } from "./find-event-changes"
import {
  eventContentEquals,
  eventEquals,
  shouldSkipPastEventPair,
} from "./event-comparison-utils"

/**
 * Process old events to identify which ones were removed or changed
 *
 * @param oldArray The old array of events
 * @param newArray The new array of events
 * @param compareWithContent Whether to compare by content instead of UID
 * @param referenceDate The reference date
 * @returns Object containing removed and changed items
 */
export const findRemovedAndChangedEvents = <T extends EventForChangeDetection>(
  oldArray: T[],
  newArray: T[],
  compareWithContent: boolean,
  referenceDate: Date,
): {
  oldItems: T[]
  changedItems: [T, T][]
} => {
  const oldItems: T[] = []
  const changedItems: [T, T][] = []

  oldArray.forEach((oldItem) => {
    const correspondingNewEv = newArray.find((newItem) =>
      eventEquals(oldItem, newItem, compareWithContent),
    )
    // Check if events are in the past
    if (shouldSkipPastEventPair(oldItem, correspondingNewEv, referenceDate)) {
      // Do not add events in the past
      return
    }

    if (correspondingNewEv && !compareWithContent) {
      // Check for changes
      if (!eventContentEquals(oldItem, correspondingNewEv)) {
        // item changes
        changedItems.push([oldItem, correspondingNewEv])
        // pass to other old item
      }
    }

    if (!correspondingNewEv) {
      oldItems.push(oldItem)
    }
  })

  return { oldItems, changedItems }
}
