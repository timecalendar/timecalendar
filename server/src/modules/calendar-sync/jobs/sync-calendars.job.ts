import { Injectable } from "@nestjs/common"
import { CalendarSyncAllService } from "modules/calendar-sync/services/calendar-sync-all.service"
import { QueueService } from "modules/queue/services/queue.service"

@Injectable()
export class SyncCalendarsJob {
  constructor(
    private readonly queueService: QueueService,
    private readonly calendarSyncAllService: CalendarSyncAllService,
  ) {
    this.queueService.register({
      name: "sync_calendars",
      handler: () => this.run(),
      cron: "*/5 * * * *",
      displayName: "Sync calendars",
      description: "Sync calendars",
    })
  }

  async run() {
    // await this.calendarSyncAllService.syncAllForCronJob()
  }
}
