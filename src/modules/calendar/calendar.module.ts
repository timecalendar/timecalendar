import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarController } from "./controllers/calendar.controller"
import { CalendarService } from "./services/calendar.service"
import { Calendar } from "./models/calendar.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Calendar])],
  providers: [CalendarService],
  controllers: [CalendarController],
  exports: [CalendarService],
})
export class CalendarModule {}
