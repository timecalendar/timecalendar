import { CalendarChange } from "modules/calendar-log/models/calendar-change"
import { EventForChangeDetection } from "modules/calendar-log/models/change-detection/find-event-changes"

/**
 * Detects bad ICal implementation
 *
 * Some providers do not provide the same event identifier with each request,
 * which prevents us from retrieving the list of changes.
 * Worse, detects a change every time it is updated.
 *
 * @param events The list of events
 * @param difference The differences compared by uids
 * @return True if the given events come from a bad ICal implementation
 */
export const detectBadIcalImplementations = <T extends EventForChangeDetection>(
  events: T[],
  difference: CalendarChange<T>,
) => {
  // Define the threshold for detecting bad ICal implementations.
  // This threshold represents the minimum number of "new" events that must be detected
  // before we consider analyzing whether the provider has a bad implementation.
  //
  // Logic:
  // - Minimum threshold: 5 events (to avoid false positives with small calendars)
  // - Dynamic threshold: 50% of total events (to scale with calendar size)
  // - We use the maximum of these two values to ensure reliability
  //
  // Rationale: Bad ICal providers generate new UIDs for every sync, causing all events
  // to appear as "new" even when only content changed. A well-behaved provider should
  // only show truly new events, so a high ratio of new:total events indicates a problem.
  const nbEventsThreshold = Math.max(5, Math.ceil(events.length / 2))

  if (difference.newItems.length >= nbEventsThreshold) {
    // Find the number of events really updated (title, location, start, end)
    let nbReallyUpdatedEvents = 0

    difference.newItems.forEach((oldEv) => {
      // Find a corresponding event in the new array
      const correspondingEv = difference.oldItems.find(
        (newEv) =>
          newEv.title === oldEv.title &&
          newEv.location === oldEv.location &&
          newEv.startsAt.getTime() === oldEv.startsAt.getTime() &&
          newEv.endsAt.getTime() === oldEv.endsAt.getTime(),
      )

      if (correspondingEv) nbReallyUpdatedEvents++
    })

    if (nbReallyUpdatedEvents > nbEventsThreshold) {
      // It is a bad ICal implementation
      return true
    }
  }

  return false
}
