import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarController } from "modules/calendar/controllers/calendar.controller"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarContentRepository } from "modules/calendar/repositories/calendar-content.repository"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { CalendarService } from "modules/calendar/services/calendar.service"

@Module({
  imports: [TypeOrmModule.forFeature([Calendar, CalendarContent])],
  providers: [CalendarService, CalendarRepository, CalendarContentRepository],
  controllers: [CalendarController],
  exports: [CalendarService, CalendarRepository, CalendarContentRepository],
})
export class CalendarModule {}
