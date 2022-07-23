import { Body, Controller, Post } from "@nestjs/common"
import { CreateCalendarDto } from "modules/calendar-sync/models/dto/create-calendar.dto"
import { SyncCalendarsDto } from "modules/calendar-sync/models/dto/sync-calendars.dto"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"

@Controller("calendars")
export class CalendarSyncController {
  constructor(private readonly service: CalendarSyncService) {}

  @Post()
  createCalendar(@Body() payload: CreateCalendarDto) {
    return this.service.createCalendar(payload)
  }

  @Post("sync")
  syncCalendars(@Body() payload: SyncCalendarsDto) {
    return this.service.syncCalendars(payload)
  }
}
