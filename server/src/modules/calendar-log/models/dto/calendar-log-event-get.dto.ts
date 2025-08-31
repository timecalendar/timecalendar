import { PickType } from "@nestjs/swagger"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"

export class CalendarLogEventGet extends PickType(CalendarEvent, [
  "uid",
  "title",
  "startsAt",
  "endsAt",
  "location",
] as const) {}
