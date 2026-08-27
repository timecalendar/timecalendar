import { Body, Controller, Post, Req, Res } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { Request, Response } from "express"
import { USER_SYNC_WORK_DEADLINE_MS } from "modules/calendar-sync/calendar-sync.constants"
import { CalendarSyncAbortError } from "modules/calendar-sync/models/calendar-sync-context"
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
  createCalendar(@Body() payload: CreateCalendarDto) {
    return this.service.createCalendar(payload)
  }

  @Post("sync")
  @ApiOperation({ summary: "Sync calendars" })
  async syncCalendars(
    @Body() payload: SyncCalendarsDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const controller = new AbortController()
    const abortForDisconnect = () => {
      if (!response.writableEnded) {
        controller.abort(new CalendarSyncAbortError("client_cancelled"))
      }
    }
    const abortForDeadline = () =>
      controller.abort(new CalendarSyncAbortError("deadline"))
    const deadline = setTimeout(abortForDeadline, USER_SYNC_WORK_DEADLINE_MS)
    request.once("aborted", abortForDisconnect)
    response.once("close", abortForDisconnect)

    try {
      return await this.calendarSyncAllService.syncAllForUser(payload, {
        signal: controller.signal,
      })
    } finally {
      clearTimeout(deadline)
      request.off("aborted", abortForDisconnect)
      response.off("close", abortForDisconnect)
    }
  }
}
