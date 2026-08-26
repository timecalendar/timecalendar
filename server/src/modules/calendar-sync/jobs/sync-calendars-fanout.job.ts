import {
  JobProcessor,
  JobProcessorInterface,
  QueueService,
} from "@lyrolab/nest-shared/queue"
import { Injectable } from "@nestjs/common"
import { SYNC_CALENDARS_CRON } from "config/constants"
import { SYNC_QUEUE } from "config/queues"
import { calendarsActiveSince } from "modules/calendar-sync/calendar-sync.constants"
import {
  SYNC_CALENDAR_JOB,
  syncCalendarJobOptions,
} from "modules/calendar-sync/jobs/sync-calendar.job"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"

export const SYNC_CALENDARS_FANOUT_JOB = "sync_calendars_fanout"

@Injectable()
// An empty SYNC_CALENDARS_CRON registers the processor without a schedule, so
// the job stays invocable by hand while nothing fires it. SyncSchedulerStateService
// tears down any scheduler a previous boot armed.
@JobProcessor({
  name: SYNC_CALENDARS_FANOUT_JOB,
  cron: SYNC_CALENDARS_CRON || undefined,
  queue: SYNC_QUEUE,
})
export class SyncCalendarsFanoutJob implements JobProcessorInterface {
  constructor(
    private readonly queueService: QueueService,
    private readonly calendarRepository: CalendarRepository,
  ) {}

  async process() {
    // Selection bounds fan-out work but is not the throttle: every sync entry
    // point atomically claims the stored plan again before upstream I/O. A
    // duplicate job or concurrent request therefore loses the same claim.
    const calendarIds = await this.calendarRepository.findDueCalendarIds({
      syncPlannedBefore: new Date(),
      lastAccessedAtAfter: calendarsActiveSince(),
    })

    await this.queueService.addBulk(
      calendarIds.map((calendarId) => ({
        name: SYNC_CALENDAR_JOB,
        data: { calendarId },
        opts: { jobId: calendarId, ...syncCalendarJobOptions },
      })),
    )
  }
}
