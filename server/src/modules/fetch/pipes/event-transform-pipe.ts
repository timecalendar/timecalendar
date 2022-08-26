import { FetcherCalendarEvent } from "modules/fetch/models/event"

export type EventTransformPipe = (
  event: FetcherCalendarEvent,
) => FetcherCalendarEvent
