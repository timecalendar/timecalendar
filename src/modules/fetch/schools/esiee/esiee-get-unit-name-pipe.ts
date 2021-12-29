import { FetcherCalendarEvent } from "../../models/event"
import { EventTransformPipe } from "../../pipes/event-transform-pipe"
import { esieeUnitsManager } from "./esiee-units-manager"

const esieeGetUnitNamePipe: EventTransformPipe = (
  event: FetcherCalendarEvent,
) => {
  // Unit name
  const matches = event.title.match(/(.*?):(.*)/)
  if (!matches) return event
  const [, code, type] = matches
  const unitName = esieeUnitsManager.getUnitNameByCode(code)
  const unitType = type.replace(/tps/gi, "TP")

  return {
    ...event,
    title: `${unitName ?? code} - ${unitType}`,
    fields: {
      ...event.fields,
      unitType,
      subject: code,
    },
  }
}

export default esieeGetUnitNamePipe
