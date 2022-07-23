import { Module } from "@nestjs/common"
import { CalendarSyncController } from "modules/calendar-sync/controllers/calendar-sync.controller"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { CalendarModule } from "modules/calendar/calendar.module"
import { FetchModule } from "modules/fetch/fetch.module"
import { SchoolModule } from "modules/school/school.module"

@Module({
  imports: [SchoolModule, FetchModule, CalendarModule],
  providers: [CalendarSyncService],
  controllers: [CalendarSyncController],
})
export class CalendarSyncModule {}
