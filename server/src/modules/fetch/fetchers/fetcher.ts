import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { FetchContext } from "modules/fetch/models/fetch-context"

export interface Fetcher {
  fetch(url: string, context?: FetchContext): Promise<FetcherCalendarEvent[]>
}
