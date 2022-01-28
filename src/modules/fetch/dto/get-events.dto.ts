import { Type } from "class-transformer"
import { IsOptional, IsString, ValidateNested } from "class-validator"
import { CalendarCustomData } from "modules/fetch/models/calendar-custom-data"

export class GetEventsDto {
  @IsString()
  url: string

  @IsString()
  school: string

  @IsOptional()
  @Type(() => CalendarCustomData)
  @ValidateNested()
  data?: CalendarCustomData
}
