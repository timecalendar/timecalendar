import { EventForChangeDetection } from "modules/calendar-log/models/change-detection/find-event-changes"
import { CalendarChange } from "modules/calendar-log/models/calendar-change"

const eventContentEqualsByRepeatedScan = (
  first: EventForChangeDetection,
  second: EventForChangeDetection,
) =>
  first.startsAt.getTime() === second.startsAt.getTime() &&
  first.endsAt.getTime() === second.endsAt.getTime() &&
  first.title === second.title &&
  first.location === second.location

const eventEqualsByRepeatedScan = (
  first: EventForChangeDetection,
  second: EventForChangeDetection,
  compareWithContent: boolean,
) =>
  compareWithContent
    ? eventContentEqualsByRepeatedScan(first, second)
    : first.uid === second.uid

const findNewEventsByRepeatedScan = <T extends EventForChangeDetection>(
  oldEvents: T[],
  newEvents: T[],
  compareWithContent: boolean,
  referenceDate: Date,
) =>
  newEvents.filter(
    (newEvent) =>
      newEvent.startsAt.getTime() >= referenceDate.getTime() &&
      !oldEvents.find((oldEvent) =>
        eventEqualsByRepeatedScan(oldEvent, newEvent, compareWithContent),
      ),
  )

const findRemovedAndChangedEventsByRepeatedScan = <
  T extends EventForChangeDetection,
>(
  oldEvents: T[],
  newEvents: T[],
  compareWithContent: boolean,
  referenceDate: Date,
) => {
  const oldItems: T[] = []
  const changedItems: [T, T][] = []

  for (const oldEvent of oldEvents) {
    const correspondingNewEvent = newEvents.find((newEvent) =>
      eventEqualsByRepeatedScan(oldEvent, newEvent, compareWithContent),
    )
    if (
      oldEvent.startsAt.getTime() < referenceDate.getTime() &&
      (!correspondingNewEvent ||
        correspondingNewEvent.startsAt.getTime() < referenceDate.getTime())
    ) {
      continue
    }
    if (
      correspondingNewEvent &&
      !compareWithContent &&
      !eventContentEqualsByRepeatedScan(oldEvent, correspondingNewEvent)
    ) {
      changedItems.push([oldEvent, correspondingNewEvent])
    }
    if (!correspondingNewEvent) oldItems.push(oldEvent)
  }

  return { oldItems, changedItems }
}

const detectsBadIcalByRepeatedScan = <T extends EventForChangeDetection>(
  events: T[],
  difference: CalendarChange<T>,
) => {
  const eventThreshold = Math.max(5, Math.ceil(events.length / 2))
  if (difference.newItems.length < eventThreshold) return false

  let matchingEvents = 0
  for (const newEvent of difference.newItems) {
    if (
      difference.oldItems.find((oldEvent) =>
        eventContentEqualsByRepeatedScan(oldEvent, newEvent),
      )
    ) {
      matchingEvents++
    }
  }
  return matchingEvents > eventThreshold
}

/**
 * Versioned profile oracle for the repeated Array.find implementation replaced by
 * TIM-188. Keep this local to the synthetic fixture; production must use the indexed
 * detector.
 */
export const findEventChangesByRepeatedScan = <
  T extends EventForChangeDetection,
>(
  referenceDate: Date,
  oldEvents: T[],
  newEvents: T[],
  compareWithContent = false,
): CalendarChange<T> => {
  const { oldItems, changedItems } = findRemovedAndChangedEventsByRepeatedScan(
    oldEvents,
    newEvents,
    compareWithContent,
    referenceDate,
  )
  const newItems = findNewEventsByRepeatedScan(
    oldEvents,
    newEvents,
    compareWithContent,
    referenceDate,
  )
  const difference = { oldItems, newItems, changedItems }

  if (detectsBadIcalByRepeatedScan(newEvents, difference)) {
    return compareWithContent
      ? { oldItems: [], newItems: [], changedItems: [] }
      : findEventChangesByRepeatedScan(
          referenceDate,
          oldEvents,
          newEvents,
          true,
        )
  }
  return difference
}
