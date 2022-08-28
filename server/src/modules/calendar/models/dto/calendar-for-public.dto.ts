import { PickType } from "@nestjs/swagger"
import { Calendar } from "modules/calendar/models/calendar.entity"

export class CalendarForPublic extends PickType(Calendar, [
  "id",
  "token",
  "name",
  "schoolName",
  "schoolId",
  "lastUpdatedAt",
  "createdAt",
] as const) {}
