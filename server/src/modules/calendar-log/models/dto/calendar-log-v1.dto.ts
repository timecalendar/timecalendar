import { OmitType } from "@nestjs/swagger"
import { CalendarLogGet } from "modules/calendar-log/models/dto/calendar-log-get.dto"

/**
 * The v1 log shape: `CalendarLogGet` minus `calendarToken`.
 *
 * Declared as an `OmitType` rather than a hand-copied class so the two DTOs
 * cannot drift, and so the omission is visible in the type instead of being a
 * runtime side effect of deleting a field after mapping.
 */
export class CalendarLogV1 extends OmitType(CalendarLogGet, [
  "calendarToken",
] as const) {}
