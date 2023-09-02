import { Injectable } from "@nestjs/common"
import { CalendarEventHelper } from "modules/calendar/helpers/calendar-event.helper"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarForPublic } from "modules/calendar/models/dto/calendar-for-public.dto"
import { CalendarWithContent } from "modules/calendar/models/dto/calendar-with-content.dto"
import { slugify } from "modules/shared/utils/slugify"
import { EventSubject } from "modules/subject/models/event-subject.model"

type WithContentForPublicParams = {
  calendar: Calendar
  subjects: EventSubject[]
}

@Injectable()
export class CalendarHelper {
  constructor(private readonly calendarEventHelper: CalendarEventHelper) {}

  withContentForPublic({
    calendar,
    subjects,
  }: WithContentForPublicParams): CalendarWithContent {
    const colorBySubjects = subjects.reduce(
      (acc, subject) => ({ ...acc, [subject.name]: subject.color }),
      {} as Record<string, string>,
    )

    return {
      calendar: this.forPublic(calendar),
      events: calendar.content.events.map((event) =>
        this.calendarEventHelper.forPublic({
          calendarEvent: event,
          color: colorBySubjects[slugify(event.title)] || null,
        }),
      ),
    }
  }

  forPublic(calendar: Calendar): CalendarForPublic {
    return {
      id: calendar.id,
      token: calendar.token,
      name: calendar.name,
      schoolName: calendar.school?.name || calendar.schoolName,
      schoolId: calendar.schoolId,
      lastUpdatedAt: calendar.lastUpdatedAt,
      createdAt: calendar.createdAt,
    }
  }
}
