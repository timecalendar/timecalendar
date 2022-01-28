import { CalendarCustomData } from "modules/fetch/models/calendar-custom-data"
import { FetcherCalendarEvent } from "modules/fetch/models/event"

export interface Fetcher {
  fetch(url: string, data: CalendarCustomData): Promise<FetcherCalendarEvent[]>
}
