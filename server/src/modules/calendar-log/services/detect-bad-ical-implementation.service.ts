import { Injectable } from "@nestjs/common"
import { CalendarChange } from "modules/calendar-log/models/calendar-change.model"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"

@Injectable()
export class DetectBadIcalImplementationService {
  /**
   * Detects bad ICal implementation
   *
   * Some providers do not provide the same event identifier with each request,
   * which prevents us from retrieving the list of changes.
   * Worse, we would detect a change every time it is updated.
   *
   * @param events The list of events
   * @param calendarChange The differences compared by uids
   * @return True if the given events come from a bad ICal implementation
   */
  isBadImplementation(events: CalendarEvent[], calendarChange: CalendarChange) {
    // Define the number of modified events from which to compute if ICal is well implemented.
    const nbEventsThreshold = Math.max(5, Math.ceil(events.length / 2))

    if (calendarChange.newItems.length >= nbEventsThreshold) {
      // Find the number of events really updated (title, location, start, end)
      let nbReallyUpdatedEvents = 0

      calendarChange.newItems.forEach((oldEv) => {
        // Find a corresponding event in the new array
        const correspondingEv = calendarChange.oldItems.find(
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
}
