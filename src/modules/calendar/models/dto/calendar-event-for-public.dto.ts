import { IsString } from "class-validator"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"

export class CalendarEventForPublic extends CalendarEvent {
  @IsString()
  color: string

  @IsString()
  groupColor: string
}
