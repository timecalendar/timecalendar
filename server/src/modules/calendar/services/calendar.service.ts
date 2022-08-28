import { Injectable } from "@nestjs/common"
import { CalendarHelper } from "modules/calendar/helpers/calendar.helper"
import { CalendarForPublic } from "modules/calendar/models/dto/calendar-for-public.dto"
import { CalendarWithContent } from "modules/calendar/models/dto/calendar-with-content.dto"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"

@Injectable()
export class CalendarService {
  constructor(
    private readonly repository: CalendarRepository,
    private readonly calendarHelper: CalendarHelper,
  ) {}

  async findCalendarByToken(token: string): Promise<CalendarForPublic> {
    const calendar = await this.repository.findOneByToken(token)
    return this.calendarHelper.forPublic(calendar)
  }

  async calendarsForPublic(tokens: string[]): Promise<CalendarWithContent[]> {
    const calendarsWithContent = await this.repository.findByTokensWithContent(
      tokens,
    )

    return calendarsWithContent.map((calendar) =>
      this.calendarHelper.withContentForPublic(calendar),
    )
  }
}
