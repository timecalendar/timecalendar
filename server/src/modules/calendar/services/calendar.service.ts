import { Injectable } from "@nestjs/common"
import { CalendarHelper } from "modules/calendar/helpers/calendar.helper"
import { CalendarForPublic } from "modules/calendar/models/dto/calendar-for-public.dto"
import { CalendarWithContent } from "modules/calendar/models/dto/calendar-with-content.dto"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { CalendarSubjectRepository } from "modules/subject/repositories/calendar-subject.repository"

@Injectable()
export class CalendarService {
  constructor(
    private readonly repository: CalendarRepository,
    private readonly calendarSubjectRepository: CalendarSubjectRepository,
    private readonly calendarHelper: CalendarHelper,
  ) {}

  async findCalendarByToken(token: string): Promise<CalendarForPublic> {
    const calendar = await this.repository.findOneByToken(token)
    return this.calendarHelper.forPublic(calendar)
  }

  /**
   * `lastUpdatedAt` is preserved by construction: the partial carries only
   * `name`, and `lastUpdatedAt` is written solely by the sync path. Spreading
   * the new name onto the already-loaded entity is exactly what a re-read would
   * return, so the response needs no second query.
   */
  async renameCalendar(
    token: string,
    name: string,
  ): Promise<CalendarForPublic> {
    const calendar = await this.repository.findOneByToken(token)
    await this.repository.update(calendar.id, { name })
    return this.calendarHelper.forPublic({ ...calendar, name })
  }

  async findCalendarsForPublic(
    tokens: string[],
  ): Promise<CalendarWithContent[]> {
    const calendarsWithContent =
      await this.repository.findByTokensWithContent(tokens)

    const subjects =
      await this.calendarSubjectRepository.findSubjectsByCalendarIds(
        calendarsWithContent.map((calendar) => calendar.id),
      )

    return calendarsWithContent.map((calendar) =>
      this.calendarHelper.withContentForPublic({
        calendar,
        subjects: subjects[calendar.id],
      }),
    )
  }
}
