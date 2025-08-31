import { Type } from "class-transformer"
import { IsDate, IsString, ValidateNested } from "class-validator"
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
}
