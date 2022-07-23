import { Type } from "class-transformer"
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator"
import {
  CalendarEventCustomFields,
  EventTag,
  EventType,
} from "modules/fetch/models/event"

export class CalendarEvent {
  @IsString()
  uid: string

  @IsString()
  title: string

  @Type(() => Date)
  @IsDate()
  startsAt: Date

  @Type(() => Date)
  @IsDate()
  endsAt: Date

  @IsString()
  @IsOptional()
  location: string | null

  @IsBoolean()
  allDay: boolean

  @IsString()
  @IsOptional()
  description: string | null

  @IsString({ each: true })
  teachers: string[]

  @Type(() => EventTag)
  @ValidateNested()
  tags: EventTag[]

  @IsEnum(EventType)
  type: EventType

  @Type(() => CalendarEventCustomFields)
  fields: CalendarEventCustomFields | null

  @Type(() => Date)
  @IsDate()
  exportedAt: Date

  @IsString()
  color: string

  @IsString()
  groupColor: string
}
