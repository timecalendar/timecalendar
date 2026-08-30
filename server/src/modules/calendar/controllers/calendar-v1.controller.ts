import { Body, Controller, Param, Patch } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger"
import { CalendarForPublic } from "modules/calendar/models/dto/calendar-for-public.dto"
import { UpdateCalendarDto } from "modules/calendar/models/dto/update-calendar.dto"
import { CalendarService } from "modules/calendar/services/calendar.service"

/**
 * A path-level `/v1` prefix on its own controller rather than
 * `app.enableVersioning()`: versioning is global in Nest and would apply a
 * default version to every controller, and Flutter release builds in the field
 * call the unversioned calendar read, create and sync paths.
 */
@Controller("v1/calendars")
@ApiTags("Calendars")
export class CalendarV1Controller {
  constructor(private readonly calendarService: CalendarService) {}

  @Patch(":token")
  @ApiOperation({
    summary: "Rename a calendar",
    description:
      "Possession of the calendar token is the only authorization: there is no owner, the rename is visible to every holder of that token, and the last write wins.",
  })
  @ApiParam({
    name: "token",
    description: "The calendar token",
    type: "string",
  })
  @ApiOkResponse({ type: CalendarForPublic })
  @ApiBadRequestResponse({
    description: "The name is missing, not a string, or too long once trimmed",
  })
  @ApiNotFoundResponse({ description: "No calendar matches this token" })
  renameCalendar(
    @Param("token") token: string,
    @Body() body: UpdateCalendarDto,
  ) {
    return this.calendarService.renameCalendar(token, body.name)
  }
}
