import { Type } from "class-transformer"
import { ValidateNested } from "class-validator"
import { CalendarLogEventGet } from "./calendar-log-event-get.dto"

export class CalendarChangedItem {
  @Type(() => CalendarLogEventGet)
  @ValidateNested()
  previousItem: CalendarLogEventGet

  @Type(() => CalendarLogEventGet)
  @ValidateNested()
  newItem: CalendarLogEventGet
}
