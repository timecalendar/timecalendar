import { Type } from "class-transformer"
import { ValidateNested } from "class-validator"
import { CalendarLogEventGet } from "./calendar-log-event-get.dto"
import { CalendarChangedItem } from "./calendar-changed-item.dto"

export class CalendarChangeGet {
  @Type(() => CalendarLogEventGet)
  @ValidateNested({ each: true })
  oldItems: CalendarLogEventGet[]

  @Type(() => CalendarLogEventGet)
  @ValidateNested({ each: true })
  newItems: CalendarLogEventGet[]

  @Type(() => CalendarChangedItem)
  @ValidateNested({ each: true })
  changedItems: CalendarChangedItem[]
}
