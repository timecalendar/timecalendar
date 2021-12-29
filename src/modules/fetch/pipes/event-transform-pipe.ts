import { FetcherCalendarEvent } from "../models/event"

export type EventTransformPipe = (
  event: FetcherCalendarEvent,
) => FetcherCalendarEvent
