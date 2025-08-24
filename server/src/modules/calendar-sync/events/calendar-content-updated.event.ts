import { CalendarEvent } from "modules/calendar/models/calendar-event.model"

export class CalendarContentUpdatedEvent {
  constructor(
    public readonly calendarId: string,
    public readonly oldEvents: CalendarEvent[],
    public readonly newEvents: CalendarEvent[],
  ) {}
}
