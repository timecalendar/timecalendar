import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarEventEmitterModule } from "modules/calendar-event-emitter/calendar-event-emitter.module"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import { CalendarLogService } from "modules/calendar-log/services/calendar-log.service"
import { DetectBadIcalImplementationService } from "modules/calendar-log/services/detect-bad-ical-implementation.service"
import { FindCalendarChangeService } from "modules/calendar-log/services/find-calendar-change.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarLog]),
    CalendarEventEmitterModule,
  ],
  providers: [
    CalendarLogService,
    CalendarLogRepository,
    DetectBadIcalImplementationService,
    FindCalendarChangeService,
  ],
})
export class CalendarLogModule {}
