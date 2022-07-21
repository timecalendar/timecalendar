import { Body, Controller, Post } from "@nestjs/common"
import { CreateCalendarDto } from "modules/calendar-sync/dto/create-calendar.dto"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"

@Controller("calendars")
export class CalendarSyncController {
  constructor(private readonly service: CalendarSyncService) {}

  @Post()
  createCalendar(@Body() payload: CreateCalendarDto) {
    return this.service.create(payload)
  }
}
