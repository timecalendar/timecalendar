import { Body, Controller, HttpCode, Post } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { CalendarLogSearchV1Response } from "modules/calendar-log/models/dto/calendar-log-search-v1-response.dto"
import { SearchCalendarLogsV1Dto } from "modules/calendar-log/models/dto/search-calendar-logs-v1.dto"
import { CalendarLogService } from "modules/calendar-log/services/calendar-log.service"

/**
 * A literal `v1/` path prefix rather than `app.enableVersioning()`: versioning
 * is global in Nest and would rewrite the route table for every controller in
 * the app. Reusing `@ApiTags("Calendar Logs")` keeps Orval's tags-split output
 * in the existing generated calendar-logs module.
 *
 * POST, not GET: calendar tokens are bearer capabilities and must never appear
 * in a URL, where they would reach access logs, proxies, and browser history.
 */
@Controller("v1/calendar-logs")
@ApiTags("Calendar Logs")
export class CalendarLogV1Controller {
  constructor(private readonly service: CalendarLogService) {}

  @Post("search")
  @HttpCode(200)
  @ApiOperation({
    summary: "Search calendar logs for given tokens, newest first",
  })
  async searchCalendarLogs(
    @Body() payload: SearchCalendarLogsV1Dto,
  ): Promise<CalendarLogSearchV1Response> {
    return this.service.searchV1(payload)
  }
}
