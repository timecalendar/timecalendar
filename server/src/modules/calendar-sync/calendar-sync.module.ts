import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarSyncController } from "modules/calendar-sync/controllers/calendar-sync.controller"
import { SyncCalendarsJob } from "modules/calendar-sync/jobs/sync-calendars.job"
import { CalendarFailure } from "modules/calendar-sync/models/calendar-failure.entity"
import { CalendarFailureRepository } from "modules/calendar-sync/repositories/calendar-failure.repository"
import { CalendarSyncAllService } from "modules/calendar-sync/services/calendar-sync-all.service"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { CalendarModule } from "modules/calendar/calendar.module"
import { FetchModule } from "modules/fetch/fetch.module"
import { QueueModule } from "modules/queue/queue.module"
import { SchoolModule } from "modules/school/school.module"
import { SubjectModule } from "modules/subject/subject.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarFailure]),
    SchoolModule,
    FetchModule,
    CalendarModule,
    QueueModule,
    SubjectModule,
  ],
  providers: [
    CalendarSyncService,
    CalendarSyncAllService,
    SyncCalendarsJob,
    CalendarFailureRepository,
  ],
  controllers: [CalendarSyncController],
})
export class CalendarSyncModule {}
