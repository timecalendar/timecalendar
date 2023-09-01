import { Factory } from "fishery"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { EventType } from "modules/fetch/models/event.model"
import { v4 } from "uuid"

export const calendarEventFactory = Factory.define<CalendarEvent>(() => ({
  uid: v4(),
  title: "Cours",
  allDay: false,
  startsAt: new Date("2021-08-30T07:00:00.000Z"),
  endsAt: new Date("2021-08-30T08:00:00.000Z"),
  description: "",
  location: "Paris",
  type: EventType.CLASS,
  teachers: [],
  tags: [],
  fields: {},
  exportedAt: new Date("2020-08-01T07:00:00.000Z"),
}))
