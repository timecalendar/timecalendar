import { CalendarCustomData } from "modules/fetch/models/calendar-source"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"

export interface Fetcher {
  fetch(url: string, data: CalendarCustomData): Promise<FetcherCalendarEvent[]>
}
