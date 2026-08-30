import { Type } from "class-transformer"
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from "class-validator"
import {
  CALENDAR_NAME_MAX_LENGTH,
  TrimCalendarName,
} from "modules/calendar/helpers/calendar-name"
import { CalendarCustomData } from "modules/fetch/models/calendar-source"

export class CreateCalendarDto {
  @IsString()
  url: string

  @IsUUID()
  @ValidateIf((o) => o.schoolName === undefined)
  schoolId?: string

  @IsString()
  @ValidateIf((o) => o.schoolId === undefined)
  schoolName?: string

  @TrimCalendarName()
  @IsString()
  @MaxLength(CALENDAR_NAME_MAX_LENGTH)
  @IsOptional()
  name?: string

  @Type(() => CalendarCustomData)
  @ValidateNested()
  @IsOptional()
  customData: CalendarCustomData | null = null
}
