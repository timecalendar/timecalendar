import { CalendarCustomData } from "modules/fetch/models/calendar-source"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { FetchContext } from "modules/fetch/models/fetch-context"

export interface Fetcher {
  fetch(
    url: string,
    data: CalendarCustomData,
    context?: FetchContext,
  ): Promise<FetcherCalendarEvent[]>
}
