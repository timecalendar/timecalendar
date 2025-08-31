import { Body, Controller, HttpCode, Post } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { CalendarLogService } from "modules/calendar-log/services/calendar-log.service"
import { GetCalendarLogsDto } from "modules/calendar-log/models/dto/get-calendar-logs.dto"
import { CalendarLogGet } from "modules/calendar-log/models/dto/calendar-log-get.dto"

@Controller("calendar-logs")
@ApiTags("Calendar Logs")
export class CalendarLogController {
  constructor(private readonly service: CalendarLogService) {}

  @Post("search")
  @HttpCode(200)
  @ApiOperation({ summary: "Get calendar logs for given tokens" })
  async getCalendarLogs(
    @Body() payload: GetCalendarLogsDto,
  ): Promise<CalendarLogGet[]> {
    return this.service.getCalendarLogs(payload)
  }
}
