import { Factory } from "fishery"
import {
  EventType,
  FetcherCalendarEvent,
} from "modules/fetch/models/event.model"
import { v4 } from "uuid"

export const fetcherCalendarEventFactory = Factory.define<FetcherCalendarEvent>(
  ({}) => ({
    uid: v4(),
    title: "Cours",
    allDay: false,
    start: new Date("2021-08-30T07:00:00.000Z"),
    end: new Date("2021-08-30T08:00:00.000Z"),
    description: "",
    location: "Paris",
    type: EventType.CLASS,
    teachers: [],
    tags: [],
    fields: {},
  }),
)
