import { Injectable } from "@nestjs/common"
import { AsyncEventEmitter } from "lib/async-event-emitter"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"

export type CalendarContentUpdatedParams = {
  calendarId: string
  oldCalendarEvents: CalendarEvent[]
  newCalendarEvents: CalendarEvent[]
}

type Events = {
  calendarContentUpdated: (
    params: CalendarContentUpdatedParams,
  ) => Promise<void>
}

@Injectable()
export class CalendarContentEventEmitter extends AsyncEventEmitter<Events> {}
