import { Injectable } from "@nestjs/common"
import { CalendarEventHelper } from "modules/calendar/helpers/calendar-event.helper"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarForPublic } from "modules/calendar/models/dto/calendar-for-public.dto"
import { CalendarWithContent } from "modules/calendar/models/dto/calendar-with-content.dto"

@Injectable()
export class CalendarHelper {
  constructor(private readonly calendarEventHelper: CalendarEventHelper) {}

  withContentForPublic(calendar: Calendar): CalendarWithContent {
    return {
      calendar: this.forPublic(calendar),
      events: calendar.content.events.map((event) =>
        this.calendarEventHelper.forPublic(event),
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
