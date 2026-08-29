import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { PruneCalendarLogJob } from "./jobs/prune-calendar-log.job"
import { CalendarLog } from "./models/calendar-log.entity"
import { CalendarLogRepository } from "./repositories/calendar-log.repository"
import { DetectCalendarChangeService } from "./services/detect-calendar-change.service"
import { CalendarLogMetricsService } from "./services/calendar-log-metrics.service"
import { CalendarLogService } from "./services/calendar-log.service"
import { CalendarLogMapper } from "./mappers/calendar-log.mapper"
import { CalendarLogController } from "./controllers/calendar-log.controller"
import { CalendarLogV1Controller } from "./controllers/calendar-log-v1.controller"

@Module({
  imports: [TypeOrmModule.forFeature([CalendarLog])],
  providers: [
    CalendarLogRepository,
    DetectCalendarChangeService,
    CalendarLogService,
    CalendarLogMetricsService,
    CalendarLogMapper,
    PruneCalendarLogJob,
  ],
  controllers: [CalendarLogController, CalendarLogV1Controller],
  exports: [DetectCalendarChangeService],
})
export class CalendarLogModule {}
