import { CalendarEvent } from "src/modules/fetch/models/event"

export interface Difference {
  oldItems: CalendarEvent[]
  newItems: CalendarEvent[]
  changedItems: [CalendarEvent, CalendarEvent][]
}
