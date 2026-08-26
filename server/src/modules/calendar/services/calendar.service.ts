import { Injectable, Optional } from "@nestjs/common"
import { CalendarHelper } from "modules/calendar/helpers/calendar.helper"
import { CalendarForPublic } from "modules/calendar/models/dto/calendar-for-public.dto"
import { CalendarWithContent } from "modules/calendar/models/dto/calendar-with-content.dto"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { CalendarSubjectRepository } from "modules/subject/repositories/calendar-subject.repository"
import { CalendarLogService } from "modules/calendar-log/services/calendar-log.service"
import { classifyCalendarSourceHealth } from "modules/calendar/helpers/calendar-source-health.helper"

@Injectable()
export class CalendarService {
  constructor(
    private readonly repository: CalendarRepository,
    private readonly calendarSubjectRepository: CalendarSubjectRepository,
    private readonly calendarHelper: CalendarHelper,
    @Optional() private readonly calendarLogService?: CalendarLogService,
  ) {}

  async findCalendarByToken(token: string): Promise<CalendarForPublic> {
    const calendar = await this.repository.findOneByToken(token)
    return this.calendarHelper.forPublic(calendar)
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

    const latestChangeAtByCalendarId = this.calendarLogService
      ? await this.calendarLogService.getLatestChangeAtByCalendarIds(
          calendarsWithContent.map((calendar) => calendar.id),
        )
      : {}

    return calendarsWithContent.map((calendar) =>
      this.calendarHelper.withContentForPublic({
        calendar,
        subjects: subjects[calendar.id],
        sourceHealth: classifyCalendarSourceHealth({
          sourceUrl: calendar.url,
          schoolCode: calendar.school?.code,
          latestSuccessfulChangeAt: latestChangeAtByCalendarId[calendar.id],
          now: new Date(),
        }),
      }),
    )
  }
}
