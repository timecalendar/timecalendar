import { Injectable } from "@nestjs/common"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { CalendarEventForPublic } from "modules/calendar/models/dto/calendar-event-for-public.dto"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"

@Injectable()
export class CalendarEventHelper {
  forPublic(calendarEvent: CalendarEvent): CalendarEventForPublic {
    return {
      ...calendarEvent,
      color: "#ff00ff",
      groupColor: "#ff00ff",
    }
  }

  fromFetcherCalendarEvent(
    fetcherCalendarEvent: FetcherCalendarEvent,
  ): CalendarEvent {
    const {
      uid,
      title,
      start,
      end,
      location,
      allDay,
      description,
      teachers,
      tags,
      type,
      fields,
    } = fetcherCalendarEvent

    return {
      uid,
      title,
      startsAt: start,
      endsAt: end,
      location,
      allDay,
      description,
      teachers,
      tags,
      type,
      fields,
      exportedAt: new Date(),
    }
  }
}
