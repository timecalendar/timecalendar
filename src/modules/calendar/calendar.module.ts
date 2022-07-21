import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarController } from "modules/calendar/controllers/calendar.controller"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarService } from "modules/calendar/services/calendar.service"

@Module({
  imports: [TypeOrmModule.forFeature([Calendar])],
  providers: [CalendarService],
  controllers: [CalendarController],
  exports: [CalendarService],
})
export class CalendarModule {}
