import { JobProcessor, JobProcessorInterface } from "@lyrolab/nest-shared/queue"
import { Injectable } from "@nestjs/common"
import { subYears } from "date-fns"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import { now } from "modules/shared/dates/now"

export const PRUNE_CALENDAR_LOG_JOB = "prune_calendar_log"

// Caps in-app change history at 1 year (design D8).
export const CALENDAR_LOG_RETENTION_YEARS = 1
export const PRUNE_BATCH_SIZE = 1000

@Injectable()
@JobProcessor({ name: PRUNE_CALENDAR_LOG_JOB, cron: "0 3 * * *" })
export class PruneCalendarLogJob implements JobProcessorInterface {
  constructor(private readonly calendarLogRepository: CalendarLogRepository) {}

  async process() {
    await this.calendarLogRepository.pruneOlderThan(
      subYears(now(), CALENDAR_LOG_RETENTION_YEARS),
      PRUNE_BATCH_SIZE,
    )
  }
}
