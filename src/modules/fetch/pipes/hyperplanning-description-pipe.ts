import { FetcherCalendarEvent } from "../models/event"
import { EventTransformPipe } from "./event-transform-pipe"

const hyperplanningDescriptionPipe: EventTransformPipe = (
  event: FetcherCalendarEvent,
) => {
  return {
    ...event,
    title: event.title,
    description: event.description
      .split("\n")
      .filter(
        (line) =>
          ![
            "TD",
            "Matière",
            "Salle",
            "Salles",
            "Type",
            "Promotions",
            "Enseignant",
            "Enseignants",
            "Absence",
            "Absent",
          ].some((val) => line.startsWith(val)),
      )
      .join("\n"),
    teachers: event.description.split("\n").reduce((teachers, line) => {
      const matches = line.match(/^Enseignants? : (.*)/)
      return [...teachers, ...((matches ?? [])[1]?.split(",") ?? [])]
    }, event.teachers),
    fields: {
      ...event.fields,
      ...(event.description
        .split("\n")
        .some((line) => line.startsWith("Absence") || line.startsWith("Absent"))
        ? { canceled: true }
        : {}),
    },
  }
}

export default hyperplanningDescriptionPipe
