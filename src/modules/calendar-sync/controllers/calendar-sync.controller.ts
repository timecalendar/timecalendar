import { Body, Controller, Post } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { CreateCalendarDto } from "modules/calendar-sync/models/dto/create-calendar.dto"
import { SyncCalendarsDto } from "modules/calendar-sync/models/dto/sync-calendars.dto"
import { CalendarSyncAllService } from "modules/calendar-sync/services/calendar-sync-all.service"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"

@Controller("calendars")
@ApiTags("Calendars")
export class CalendarSyncController {
  constructor(
    private readonly service: CalendarSyncService,
    private readonly calendarSyncAllService: CalendarSyncAllService,
  ) {}

  @Post()
  createCalendar(@Body() payload: CreateCalendarDto) {
    return this.service.createCalendar(payload)
  }

  @Post("sync")
  async syncCalendars(@Body() payload: SyncCalendarsDto) {
    return this.calendarSyncAllService.syncAllForUser(payload)
  }
}
