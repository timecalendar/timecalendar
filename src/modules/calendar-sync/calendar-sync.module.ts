import { Module } from "@nestjs/common"
import { CalendarSyncController } from "modules/calendar-sync/controllers/calendar-sync.controller"
import { SyncCalendarsJob } from "modules/calendar-sync/jobs/sync-calendars.job"
import { CalendarSyncAllService } from "modules/calendar-sync/services/calendar-sync-all.service"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { CalendarModule } from "modules/calendar/calendar.module"
import { FetchModule } from "modules/fetch/fetch.module"
import { QueueModule } from "modules/queue/queue.module"
import { SchoolModule } from "modules/school/school.module"

@Module({
  imports: [SchoolModule, FetchModule, CalendarModule, QueueModule],
  providers: [CalendarSyncService, CalendarSyncAllService, SyncCalendarsJob],
  controllers: [CalendarSyncController],
})
export class CalendarSyncModule {}
