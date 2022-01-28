import { Optional } from "@nestjs/common"
import { Type } from "class-transformer"
import {
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from "class-validator"
import { CalendarCustomData } from "modules/fetch/models/calendar-custom-data"

export class CreateCalendarDto {
  @IsString()
  url: string

  @IsUUID()
  @ValidateIf((o) => o.schoolName === undefined)
  schoolId: string

  @IsString()
  @ValidateIf((o) => o.schoolId === undefined)
  schoolName: string

  @IsString()
  @IsOptional()
  name: string

  @Type(() => CalendarCustomData)
  @ValidateNested()
  @Optional()
  customData?: CalendarCustomData
}
