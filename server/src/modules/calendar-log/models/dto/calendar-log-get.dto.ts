import { Type } from "class-transformer"
import { IsDate, IsString, ValidateNested } from "class-validator"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarChangeGet } from "./calendar-change-get.dto"

export class CalendarLogGet {
  @IsString()
  id: string

  @IsString()
  calendarId: string

  @IsString()
  calendarToken: string

  @IsString()
  calendarName: string

  @Type(() => CalendarChangeGet)
  @ValidateNested()
  calendarChange: CalendarChangeGet

  @Type(() => Date)
  @IsDate()
  createdAt: Date

  @Type(() => Date)
  @IsDate()
  updatedAt: Date

  static fromEntity(entity: CalendarLog): CalendarLogGet {
    const dto = new CalendarLogGet()
    dto.id = entity.id
    dto.calendarId = entity.calendar.id
    dto.calendarToken = entity.calendar.token
    dto.calendarName = entity.calendar.name
    dto.calendarChange = entity.calendarChange
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    return dto
  }
}
