import { FetcherCalendarEvent } from "modules/fetch/models/event"
import { EventTransformPipe } from "modules/fetch/pipes/event-transform-pipe"
import { trimNewLines } from "modules/shared/helpers/trim"

const esieeParseDescriptionPipe: EventTransformPipe = (
  event: FetcherCalendarEvent,
) => ({
  ...event,
  description: trimNewLines(
    event.description
      .split("\n")
      .filter((line) => !(line.match(/^[0-9]{12,13}$/) || line.match(/AURION/)))
      .join("\n"),
  ),
})

export default esieeParseDescriptionPipe
