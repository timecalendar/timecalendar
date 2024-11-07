import dayjs from "lib/dayjs"
import { Factory } from "fishery"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { EventType } from "modules/fetch/models/event.model"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"
import { v4 } from "uuid"

export class CalendarEventFactory extends AppFactory<CalendarEvent> {
  static buildList({
    nbEvents,
    uidPrefix = "event",
  }: {
    nbEvents: number
    uidPrefix?: string
  }) {
    const events: CalendarEvent[] = []

    for (let i = 0; i < nbEvents; i++) {
      events.push(
        calendarEventFactory().build({
          uid: `${uidPrefix}-${i}`,
          title: `Event ${i}`,
          startsAt: dayjs(new Date("2023-01-01T01:00:00.000Z"))
            .add(i, "day")
            .toDate(),
          endsAt: dayjs(new Date("2023-01-01T02:00:00.000Z"))
            .add(i, "day")
            .toDate(),
        }),
      )
    }

    return events
  }
}

export const calendarEventFactory = factoryBuilder(() => [
  CalendarEvent,
  Factory.define<CalendarEvent>(() => ({
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
  })),
])
