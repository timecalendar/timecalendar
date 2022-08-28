import { Controller, Get, Param } from "@nestjs/common"
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger"
import { CalendarService } from "modules/calendar/services/calendar.service"

@Controller("calendars")
@ApiTags("Calendars")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get("by-token/:token")
  @ApiOperation({ summary: "Find a calendar by its token" })
  @ApiParam({
    name: "token",
    description: "The calendar token",
    type: "string",
  })
  findCalendarByToken(@Param("token") token: string) {
    return this.calendarService.findCalendarByToken(token)
  }
}
