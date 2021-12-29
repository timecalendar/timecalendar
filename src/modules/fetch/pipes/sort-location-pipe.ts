import { FetcherCalendarEvent } from "../models/event"
import { EventTransformPipe } from "./event-transform-pipe"

const sortLocationPipe: EventTransformPipe = (event: FetcherCalendarEvent) => ({
  ...event,
  location: event.location.split(",").sort().join(", "),
})

export default sortLocationPipe
