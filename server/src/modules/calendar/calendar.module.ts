import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarController } from "modules/calendar/controllers/calendar.controller"
import { CalendarEventHelper } from "modules/calendar/helpers/calendar-event.helper"
import { CalendarHelper } from "modules/calendar/helpers/calendar.helper"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarContentRepository } from "modules/calendar/repositories/calendar-content.repository"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { CalendarService } from "modules/calendar/services/calendar.service"
import { SubjectModule } from "modules/subject/subject.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([Calendar, CalendarContent]),
    SubjectModule,
  ],
  providers: [
    CalendarService,
    CalendarRepository,
    CalendarContentRepository,
    CalendarHelper,
    CalendarEventHelper,
  ],
  controllers: [CalendarController],
  exports: [
    CalendarService,
    CalendarRepository,
    CalendarContentRepository,
    CalendarHelper,
    CalendarEventHelper,
  ],
})
export class CalendarModule {}
