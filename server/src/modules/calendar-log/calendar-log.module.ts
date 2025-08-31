import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarLog } from "./models/calendar-log.entity"
import { CalendarLogRepository } from "./repositories/calendar-log.repository"
import { DetectCalendarChangeService } from "./services/detect-calendar-change.service"
import { CalendarLogService } from "./services/calendar-log.service"
import { CalendarLogMapper } from "./mappers/calendar-log.mapper"
import { CalendarLogController } from "./controllers/calendar-log.controller"

@Module({
  imports: [TypeOrmModule.forFeature([CalendarLog])],
  providers: [
    CalendarLogRepository,
    DetectCalendarChangeService,
    CalendarLogService,
    CalendarLogMapper,
  ],
  controllers: [CalendarLogController],
  exports: [CalendarLogRepository, DetectCalendarChangeService],
})
export class CalendarLogModule {}
