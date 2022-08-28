import slug from "slug"
import { v5 } from "uuid"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { EventTransformPipe } from "modules/fetch/pipes/event-transform-pipe"

const generateUid = (event: FetcherCalendarEvent) => {
  // Create uuid hash
  const hashComponents: string[] = []
  if (event.title) hashComponents.push(event.title)
  if (event.start) hashComponents.push(event.start.toISOString())
  const hash = hashComponents.join("-")
  const uuid = v5(hash, v5.URL)

  // Format event uid
  const components: string[] = []
  if (event.title) components.push(`${slug(event.title.substring(0, 10))}-`)
  components.push(uuid)
  components.push("@timecalendar.app")
  return components.join("")
}

const generateUidPipe: EventTransformPipe = (event: FetcherCalendarEvent) => ({
  ...event,
  uid: event.uid || generateUid(event),
})

export default generateUidPipe
