import { Injectable } from "@nestjs/common"
import { CalendarHelper } from "modules/calendar/helpers/calendar.helper"
import { CalendarWithContent } from "modules/calendar/models/dto/calendar-with-content.dto"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"

@Injectable()
export class CalendarService {
  constructor(
    private readonly repository: CalendarRepository,
    private readonly calendarHelper: CalendarHelper,
  ) {}

  async calendarsForPublic(tokens: string[]): Promise<CalendarWithContent[]> {
    const calendarsWithContent = await this.repository.findByTokensWithContent(
      tokens,
    )

    return calendarsWithContent.map((calendar) =>
      this.calendarHelper.withContentForPublic(calendar),
    )
  }
}
