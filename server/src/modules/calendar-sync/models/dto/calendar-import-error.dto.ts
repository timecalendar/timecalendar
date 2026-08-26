import { ApiProperty } from "@nestjs/swagger"
import {
  CalendarImportClassification,
  CalendarImportHelpKey,
  calendarImportClassifications,
  calendarImportHelpKeys,
} from "modules/calendar-sync/recovery/calendar-import-recovery"

export class CalendarImportErrorDto {
  @ApiProperty({ enum: ["calendar_import_failed"] })
  code: "calendar_import_failed"

  @ApiProperty({ enum: calendarImportClassifications })
  classification: CalendarImportClassification

  @ApiProperty({ enum: calendarImportHelpKeys })
  helpKey: CalendarImportHelpKey

  @ApiProperty()
  retryable: boolean
}
