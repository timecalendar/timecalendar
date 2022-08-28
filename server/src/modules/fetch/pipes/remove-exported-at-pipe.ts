import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { EventTransformPipe } from "modules/fetch/pipes/event-transform-pipe"

const removeExportedAtPipe: EventTransformPipe = (
  event: FetcherCalendarEvent,
) => ({
  ...event,
  description: event.description
    .split("\n")
    .filter(
      (line) =>
        !(
          line.match(/^\(Exported.*$/gm) ||
          line.match(/^\(Modifié le.*$/gm) ||
          line.match(/^Exporté via.*$/gm) ||
          line.match(/^\(Exporté le.*$/gm)
        ),
    )
    .join("\n"),
})

export default removeExportedAtPipe
