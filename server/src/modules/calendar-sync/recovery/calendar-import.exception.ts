import { UnprocessableEntityException } from "@nestjs/common"
import { CalendarImportErrorDto } from "modules/calendar-sync/models/dto/calendar-import-error.dto"
import { CalendarImportRecovery } from "./calendar-import-recovery"

export class CalendarImportException extends UnprocessableEntityException {
  constructor(recovery: CalendarImportRecovery) {
    const body: CalendarImportErrorDto = {
      code: "calendar_import_failed",
      classification: recovery.classification,
      helpKey: recovery.helpKey,
      retryable: recovery.retryable,
    }
    super(body)
  }
}
