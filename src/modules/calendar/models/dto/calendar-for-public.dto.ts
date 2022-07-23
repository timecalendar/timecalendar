import { PickType } from "@nestjs/swagger"
import { Calendar } from "modules/calendar/models/calendar.entity"

export class CalendarForPublic extends PickType(Calendar, [
  "id",
  "name",
  "schoolName",
  "schoolId",
  "lastUpdatedAt",
  "createdAt",
] as const) {}
