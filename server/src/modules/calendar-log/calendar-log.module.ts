import { Global, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { PruneCalendarLogJob } from "./jobs/prune-calendar-log.job"
import { CalendarLog } from "./models/calendar-log.entity"
import { CalendarLogRepository } from "./repositories/calendar-log.repository"
import { DetectCalendarChangeService } from "./services/detect-calendar-change.service"
import { CalendarLogService } from "./services/calendar-log.service"
import { CalendarLogMapper } from "./mappers/calendar-log.mapper"
import { CalendarLogController } from "./controllers/calendar-log.controller"

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([CalendarLog])],
  providers: [
    CalendarLogRepository,
    DetectCalendarChangeService,
    CalendarLogService,
    CalendarLogMapper,
    PruneCalendarLogJob,
  ],
  controllers: [CalendarLogController],
  exports: [DetectCalendarChangeService, CalendarLogService],
})
export class CalendarLogModule {}
