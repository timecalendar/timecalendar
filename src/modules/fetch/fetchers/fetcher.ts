import { CalendarCustomData } from "../models/calendar-custom-data"
import { FetcherCalendarEvent } from "../models/event"

export interface Fetcher {
  fetch(url: string, data: CalendarCustomData): Promise<FetcherCalendarEvent[]>
}
