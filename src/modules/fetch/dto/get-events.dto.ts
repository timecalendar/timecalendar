import { Type } from "class-transformer"
import { IsString, ValidateNested } from "class-validator"
import { CalendarSource } from "modules/fetch/models/calendar-source"

export class GetEventsDto {
  @IsString()
  url: string

  @Type(() => CalendarSource)
  @ValidateNested()
  source: CalendarSource

  @IsString()
  school: string
}
