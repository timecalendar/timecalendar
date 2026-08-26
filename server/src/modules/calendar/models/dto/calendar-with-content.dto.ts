import { CalendarEventForPublic } from "modules/calendar/models/dto/calendar-event-for-public.dto"
import { CalendarForPublic } from "modules/calendar/models/dto/calendar-for-public.dto"
import { CalendarSourceHealthDto } from "modules/calendar/models/dto/calendar-source-health.dto"

export class CalendarWithContent {
  calendar: CalendarForPublic
  events: CalendarEventForPublic[]
  sourceHealth: CalendarSourceHealthDto
}
