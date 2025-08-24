import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarLog } from "./models/calendar-log.entity"
import { CalendarLogRepository } from "./repositories/calendar-log.repository"
import { DetectCalendarChangeService } from "./services/detect-calendar-change.service"

@Module({
  imports: [TypeOrmModule.forFeature([CalendarLog])],
  providers: [CalendarLogRepository, DetectCalendarChangeService],
  exports: [CalendarLogRepository, DetectCalendarChangeService],
})
export class CalendarLogModule {}
