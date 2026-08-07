import {
  JobProcessor,
  JobProcessorInterface,
  QueueService,
} from "@lyrolab/nest-shared/queue"
import { Injectable } from "@nestjs/common"
import { SYNC_QUEUE } from "config/queues"
import {
  calendarsActiveSince,
  calendarsDueBefore,
} from "modules/calendar-sync/calendar-sync.constants"
import {
  SYNC_CALENDAR_JOB,
  syncCalendarJobOptions,
} from "modules/calendar-sync/jobs/sync-calendar.job"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"

export const SYNC_CALENDARS_FANOUT_JOB = "sync_calendars_fanout"

@Injectable()
@JobProcessor({
  name: SYNC_CALENDARS_FANOUT_JOB,
  cron: "*/5 * * * *",
  queue: SYNC_QUEUE,
})
export class SyncCalendarsFanoutJob implements JobProcessorInterface {
  constructor(
    private readonly queueService: QueueService,
    private readonly calendarRepository: CalendarRepository,
  ) {}

  async process() {
    const calendarIds = await this.calendarRepository.findDueCalendarIds({
      lastUpdatedBefore: calendarsDueBefore(),
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
