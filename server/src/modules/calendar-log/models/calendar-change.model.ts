import { Type, plainToInstance } from "class-transformer"
import { CalendarChangedItem } from "modules/calendar-log/models/calendar-changed-item.model"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"

export class CalendarChange {
  @Type(() => CalendarEvent)
  oldItems: CalendarEvent[]

  @Type(() => CalendarEvent)
  newItems: CalendarEvent[]

  @Type(() => CalendarChangedItem)
  changedItems: CalendarChangedItem[]

  static buildEmpty() {
    return plainToInstance(CalendarChange, {
      oldItems: [],
      newItems: [],
      changedItems: [],
    })
  }
}

export const calendarChangeIsEmpty = (calendarChange: CalendarChange) =>
  calendarChange.oldItems.length === 0 &&
  calendarChange.newItems.length === 0 &&
  calendarChange.changedItems.length === 0
