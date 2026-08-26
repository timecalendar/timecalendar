import { Body, Controller, Post } from "@nestjs/common"
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger"
import { CalendarImportErrorDto } from "modules/calendar-sync/models/dto/calendar-import-error.dto"
import { CreateCalendarRepDto } from "modules/calendar-sync/models/dto/create-calendar-rep.dto"
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
  @ApiOperation({ summary: "Create a calendar" })
  @ApiCreatedResponse({ type: CreateCalendarRepDto })
  @ApiUnprocessableEntityResponse({ type: CalendarImportErrorDto })
  createCalendar(
    @Body() payload: CreateCalendarDto,
  ): Promise<CreateCalendarRepDto> {
    return this.service.createCalendar(payload)
  }

  @Post("sync")
  @ApiOperation({ summary: "Sync calendars" })
  async syncCalendars(@Body() payload: SyncCalendarsDto) {
    return this.calendarSyncAllService.syncAllForUser(payload)
  }
}
