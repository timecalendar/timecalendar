import { FetcherCalendarEvent } from "modules/fetch/models/event"
import { EventTransformPipe } from "modules/fetch/pipes/event-transform-pipe"

const sortLocationPipe: EventTransformPipe = (event: FetcherCalendarEvent) => ({
  ...event,
  location: event.location.split(",").sort().join(", "),
})

export default sortLocationPipe
