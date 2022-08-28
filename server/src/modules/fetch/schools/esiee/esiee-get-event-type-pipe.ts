import eventTags from "modules/fetch/data/tags"
import {
  EventType,
  EventTag,
  FetcherCalendarEvent,
} from "modules/fetch/models/event.model"
import { EventTransformPipe } from "modules/fetch/pipes/event-transform-pipe"

const mapUnitType: { [type: string]: { type: EventType; tags: EventTag[] } } = {
  td: { type: EventType.TD, tags: [eventTags.td] },
  tdm: { type: EventType.TD, tags: [eventTags.td] },
  tdr: { type: EventType.TD, tags: [eventTags.td] },
  tp: { type: EventType.TP, tags: [eventTags.tp] },
  tdrm: { type: EventType.TP2, tags: [eventTags.tp] },
  pers: { type: EventType.PROJECT, tags: [eventTags.pers] },
  project: { type: EventType.PROJECT, tags: [eventTags.project] },
  ctrl: { type: EventType.EXAM, tags: [eventTags.exam] },
  qcm: { type: EventType.EXAM, tags: [eventTags.exam] },
}

const esieeGetEventTypePipe: EventTransformPipe = (
  event: FetcherCalendarEvent,
) => {
  // Event type and tags
  const eventType = mapUnitType[event.fields.unitType?.toLocaleLowerCase()] ?? {
    type: event.type,
    tags: [],
  }

  return {
    ...event,
    type: eventType.type,
    tags: [...event.tags, ...eventType.tags],
    fields: {
      ...event.fields,
      groupColor: eventType.tags[0]?.color ?? undefined,
    },
  }
}

export default esieeGetEventTypePipe
