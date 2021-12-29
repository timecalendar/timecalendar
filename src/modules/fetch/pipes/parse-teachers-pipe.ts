import { FetcherCalendarEvent } from "../models/event"
import { EventTransformPipe } from "./event-transform-pipe"

const ParseTeachersPipe: (regex?: RegExp) => EventTransformPipe =
  (regex = /^([a-zA-Z-]{2,} )+[a-zA-Z-]{2,}$/) =>
  (event: FetcherCalendarEvent) => {
    const lines = event.description.split("\n")

    const teachers = lines.filter((line) => line.match(regex))
    const description = lines.filter((line) => !line.match(regex)).join("\n")

    return {
      ...event,
      teachers,
      description,
    }
  }

export default ParseTeachersPipe
