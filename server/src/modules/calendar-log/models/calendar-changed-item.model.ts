import { Type } from "class-transformer"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"

export class CalendarChangedItem {
  @Type(() => CalendarEvent)
  oldEvent: CalendarEvent

  @Type(() => CalendarEvent)
  newEvent: CalendarEvent
}
