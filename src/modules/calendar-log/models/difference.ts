import { CalendarEvent } from "modules/calendar/models/calendar-event.model"

export interface CalendarChange {
  oldItems: CalendarEvent[]
  newItems: CalendarEvent[]
  changedItems: [CalendarEvent, CalendarEvent][]
}
