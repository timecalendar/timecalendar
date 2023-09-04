import { Type } from "class-transformer"
import { IsOptional, IsString, ValidateNested } from "class-validator"
import { CalendarSource } from "modules/fetch/models/calendar-source"

export class GetEventsDto {
  @Type(() => CalendarSource)
  @ValidateNested()
  source: CalendarSource

  @IsString()
  @IsOptional()
  school: string
}
