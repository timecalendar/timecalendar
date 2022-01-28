import slug from "slug"
import { v5 } from "uuid"
import { FetcherCalendarEvent } from "modules/fetch/models/event"
import { EventTransformPipe } from "./event-transform-pipe"

const generateUid = (event: FetcherCalendarEvent) => {
  // Create uuid hash
  const hashComponents = []
  if (event.title) hashComponents.push(event.title)
  if (event.start) hashComponents.push(event.start.toISOString())
  const hash = hashComponents.join("-")
  const uuid = v5(hash, v5.URL)

  // Format event uid
  const components = []
  if (event.title) components.push(slug(event.title.substr(0, 10)) + "-")
  components.push(uuid)
  components.push("@timecalendar.app")
  return components.join("")
}

const generateUidPipe: EventTransformPipe = (event: FetcherCalendarEvent) => ({
  ...event,
  uid: event.uid || generateUid(event),
})

export default generateUidPipe
