import { JobProcessor, JobProcessorInterface } from "@lyrolab/nest-shared/queue"
import { Injectable } from "@nestjs/common"
import { Job, JobsOptions } from "bullmq"
import { SYNC_QUEUE } from "config/queues"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"

export const SYNC_CALENDAR_JOB = "sync_calendar"

export type SyncCalendarJobData = {
  calendarId: string
}

// Design D3: `jobId = calendarId` dedups against ANY still-stored job, so
// completed jobs must vanish immediately and failed ones well under the 30-min
// due cycle — a lingering stored job would block the calendar's next
// re-enqueue. Failure visibility comes from job-run logs + OTel metrics, not
// from Redis retention.
export const syncCalendarJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 60_000 },
  removeOnComplete: true,
  removeOnFail: { age: 15 * 60 },
}

@Injectable()
@JobProcessor({ name: SYNC_CALENDAR_JOB, queue: SYNC_QUEUE })
export class SyncCalendarJob implements JobProcessorInterface {
  constructor(
    private readonly calendarRepository: CalendarRepository,
    private readonly calendarSyncService: CalendarSyncService,
  ) {}

  async process(job: Job<SyncCalendarJobData>) {
    const calendar = await this.calendarRepository.findOneOrNull(
      job.data.calendarId,
    )
    if (!calendar) return

    await this.calendarSyncService.sync(calendar)
  }
}
