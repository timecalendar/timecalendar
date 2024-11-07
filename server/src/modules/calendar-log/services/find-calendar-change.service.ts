import { Injectable } from "@nestjs/common"
import { CalendarChange } from "modules/calendar-log/models/calendar-change.model"
import { DetectBadIcalImplementationService } from "modules/calendar-log/services/detect-bad-ical-implementation.service"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"

type RunParams = {
  oldCalendarEvents: CalendarEvent[]
  newCalendarEvents: CalendarEvent[]
  compareWithContent?: boolean
}

@Injectable()
export class FindCalendarChangeService {
  constructor(
    private readonly detectBadIcalImplementationService: DetectBadIcalImplementationService,
  ) {}

  run({
    oldCalendarEvents,
    newCalendarEvents,
    compareWithContent = false,
  }: RunParams): CalendarChange {
    const calendarChange = CalendarChange.buildEmpty()
    const now = new Date()

    oldCalendarEvents.forEach((oldItem) => {
      const correspondingNewEv = FindCalendarChangeService.findEqualEvent(
        newCalendarEvents,
        oldItem,
        compareWithContent,
      )

      // Check if events are in the past
      if (
        oldItem.startsAt < now &&
        (!correspondingNewEv || correspondingNewEv.startsAt < now)
      ) {
        // Do not add events in the past
        return
      }

      if (correspondingNewEv && oldItem.uid === correspondingNewEv.uid) {
        // Check for changes
        if (
          !FindCalendarChangeService.eventContentEquals(
            oldItem,
            correspondingNewEv,
          )
        ) {
          calendarChange.changedItems.push({
            oldEvent: oldItem,
            newEvent: correspondingNewEv,
          })
        }
      }

      if (!correspondingNewEv) {
        calendarChange.oldItems.push(oldItem)
      }
    })

    newCalendarEvents.forEach((newItem) => {
      if (newItem.startsAt < now) return

      const existingOldEvent = FindCalendarChangeService.findEqualEvent(
        oldCalendarEvents,
        newItem,
        compareWithContent,
      )

      if (!existingOldEvent) {
        calendarChange.newItems.push(newItem)
      }
    })

    // Check with this difference if the ICal has a bad implementation
    if (
      this.detectBadIcalImplementationService.isBadImplementation(
        newCalendarEvents,
        calendarChange,
      )
    ) {
      if (compareWithContent) {
        // This difference cannot be fixed
        // Return an empty difference
        return CalendarChange.buildEmpty()
      }

      // Try to find the changes with content
      return this.run({
        oldCalendarEvents,
        newCalendarEvents,
        compareWithContent: true,
      })
    }

    return calendarChange
  }

  private static findEqualEvent(
    events: CalendarEvent[],
    eventToFind: CalendarEvent,
    compareWithContent = false,
  ) {
    const eventFoundWithUid = events.find(
      (event) => eventToFind.uid === event.uid,
    )
    if (eventFoundWithUid) return eventFoundWithUid

    if (compareWithContent) {
      const eventFoundWithContent = events.find((event) =>
        this.eventContentEquals(event, eventToFind),
      )
      if (eventFoundWithContent) return eventFoundWithContent
    }

    return undefined
  }

  private static eventContentEquals(a: CalendarEvent, b: CalendarEvent) {
    return (
      a.startsAt.getTime() === b.startsAt.getTime() &&
      a.endsAt.getTime() === b.endsAt.getTime() &&
      a.title === b.title &&
      a.location === b.location
    )
  }
}
