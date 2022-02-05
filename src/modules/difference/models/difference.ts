import { CalendarEvent } from "modules/calendar/models/calendar-event.model"

export interface Difference {
  oldItems: CalendarEvent[]
  newItems: CalendarEvent[]
  changedItems: [CalendarEvent, CalendarEvent][]
}
