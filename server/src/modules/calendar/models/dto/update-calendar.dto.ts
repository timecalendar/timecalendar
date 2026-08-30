import { IsString, MaxLength } from "class-validator"
import {
  CALENDAR_NAME_MAX_LENGTH,
  TrimCalendarName,
} from "modules/calendar/helpers/calendar-name"

export class UpdateCalendarDto {
  /**
   * The new calendar name. Required, but an empty result after trimming is a
   * valid cleared name.
   */
  @TrimCalendarName()
  @IsString()
  @MaxLength(CALENDAR_NAME_MAX_LENGTH)
  name: string
}
