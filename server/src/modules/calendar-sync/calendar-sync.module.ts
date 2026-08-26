import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { CalendarSyncController } from "modules/calendar-sync/controllers/calendar-sync.controller"
import { LegacySchedulerCleanupService } from "modules/calendar-sync/jobs/legacy-scheduler-cleanup.service"
import { SyncCalendarJob } from "modules/calendar-sync/jobs/sync-calendar.job"
import { SyncCalendarsFanoutJob } from "modules/calendar-sync/jobs/sync-calendars-fanout.job"
import { SyncSchedulerStateService } from "modules/calendar-sync/jobs/sync-scheduler-state.service"
import { CalendarFailure } from "modules/calendar-sync/models/calendar-failure.entity"
import { CalendarFailureRepository } from "modules/calendar-sync/repositories/calendar-failure.repository"
import { CalendarSyncAllService } from "modules/calendar-sync/services/calendar-sync-all.service"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { CalendarModule } from "modules/calendar/calendar.module"
import { FetchModule } from "modules/fetch/fetch.module"
import { SchoolModule } from "modules/school/school.module"
import { SubjectModule } from "modules/subject/subject.module"
import { CalendarSyncMetricsService } from "./services/calendar-sync-metrics.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarFailure]),
    SchoolModule,
    FetchModule,
    CalendarModule,
    SubjectModule,
    CalendarLogModule,
  ],
  providers: [
    CalendarSyncService,
    CalendarSyncAllService,
    SyncCalendarsFanoutJob,
    SyncCalendarJob,
    LegacySchedulerCleanupService,
    SyncSchedulerStateService,
    CalendarFailureRepository,
    CalendarSyncMetricsService,
  ],
  controllers: [CalendarSyncController],
})
export class CalendarSyncModule {}
