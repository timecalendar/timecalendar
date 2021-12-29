import { FetcherCalendarEvent } from "../../models/event"
import { EventTransformPipe } from "src/modules/fetch/pipes/event-transform-pipe"
import { trimNewLines } from "src/modules/shared/helpers/trim"

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
