import { Type } from "class-transformer"
import { ValidateNested } from "class-validator"
import { CalendarLogEventGet } from "./calendar-log-event-get.dto"

export class CalendarChangeGet {
  @Type(() => CalendarLogEventGet)
  @ValidateNested({ each: true })
  oldItems: CalendarLogEventGet[]

  @Type(() => CalendarLogEventGet)
  @ValidateNested({ each: true })
  newItems: CalendarLogEventGet[]

  @Type(() => CalendarLogEventGet)
  @ValidateNested({ each: true })
  changedItems: [CalendarLogEventGet, CalendarLogEventGet][]
}
