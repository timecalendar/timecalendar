import { FetcherCalendarEvent } from "modules/fetch/models/event.model"

export type EventTransformPipe = (
  event: FetcherCalendarEvent,
) => FetcherCalendarEvent
