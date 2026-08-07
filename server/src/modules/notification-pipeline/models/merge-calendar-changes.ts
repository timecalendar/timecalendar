import { addDays } from "date-fns"
import { EventForChangeDetection } from "modules/calendar-log/models/change-detection/find-event-changes"
import { CalendarChangeItem } from "modules/notifier/models/notifier"

// calendarChange comes out of a json column: dates arrive as ISO strings.
type SerializedEvent = Omit<EventForChangeDetection, "startsAt" | "endsAt"> & {
  startsAt: string | Date
  endsAt: string | Date
}

export interface SerializedCalendarChange {
  oldItems: SerializedEvent[]
  newItems: SerializedEvent[]
  changedItems: [SerializedEvent, SerializedEvent][]
}

const reviveEvent = (event: SerializedEvent): EventForChangeDetection => ({
  ...event,
  startsAt: new Date(event.startsAt),
  endsAt: new Date(event.endsAt),
})

const flattenCalendarChange = (
  change: SerializedCalendarChange,
): CalendarChangeItem[] => [
  ...change.newItems.map((event) => ({
    type: "new" as const,
    event: reviveEvent(event),
  })),
  ...change.oldItems.map((event) => ({
    type: "cancel" as const,
    event: reviveEvent(event),
  })),
  ...change.changedItems.map(([, newEvent]) => ({
    type: "edit" as const,
    event: reviveEvent(newEvent),
  })),
]

// Changes must be passed oldest-first: when several logs touch the same event
// uid, the latest change wins (a user only cares about the final state).
export const mergeCalendarChanges = (
  changes: SerializedCalendarChange[],
): CalendarChangeItem[] => {
  const byUid = new Map<string, CalendarChangeItem>()
  for (const change of changes) {
    for (const item of flattenCalendarChange(change)) {
      byUid.set(item.event.uid, item)
    }
  }
  return [...byUid.values()]
}

export const filterByDaysAhead = (
  items: CalendarChangeItem[],
  nbDaysAhead: number,
  now: Date,
): CalendarChangeItem[] => {
  const horizon = addDays(now, nbDaysAhead)
  return items.filter((item) => item.event.startsAt <= horizon)
}
