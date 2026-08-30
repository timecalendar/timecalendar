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
 * POST, not GET, so the tokens travel in a body instead of a URL, where they
 * would reach access logs, proxies, and browser history. That is this route's
 * default, not an API-wide rule: this is a greenfield surface with no legacy
 * caller, so keeping a bearer capability out of the URL costs nothing.
 * `CalendarV1Controller` deliberately does the opposite — `PATCH
 * /v1/calendars/:token` carries the token in the path, because the
 * pre-existing, high-traffic `GET /calendars/by-token/:token` already exposes
 * the same token the same way to the same logs. Unifying the two conventions
 * is the deferred API-wide `/v1` migration: both routes move together, or
 * neither does.
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
