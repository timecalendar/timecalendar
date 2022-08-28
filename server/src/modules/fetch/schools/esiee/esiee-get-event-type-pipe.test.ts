import eventTags from "modules/fetch/data/tags"
import colors from "modules/fetch/models/colors"
import {
  FetcherCalendarEvent,
  EventType,
} from "modules/fetch/models/event.model"
import esieeGetEventTypePipe from "modules/fetch/schools/esiee/esiee-get-event-type-pipe"

describe("esieeGetEventTypePipe", () => {
  it("should detect the event type", () => {
    const event: FetcherCalendarEvent = {
      uid: "EDC903E2-3B29-4E7A-B335-20CF153FEDDB",
      title: "5I-IN8:TDRm",
      allDay: false,
      start: new Date("2021-08-30T07:00:00.000Z"),
      end: new Date("2021-08-30T08:00:00.000Z"),
      description:
        "1626957163460\n1I\n1IC\n2I\n5I-IN8\nAURION\nFOX R.\n(Exported :29/08/2021 13:07)",
      location: "Paris",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: {
        subject: "5I-IN8",
        unitType: "TDRm",
      },
    }

    const newEvent = esieeGetEventTypePipe(event)

    expect(newEvent).toMatchObject({
      ...event,
      type: EventType.TP2,
      tags: [eventTags.tp],
      fields: {
        ...event.fields,
        groupColor: colors[EventType.TP],
      },
    })
  })

  it("should not modify the event type for unknown types", () => {
    const event: FetcherCalendarEvent = {
      uid: "EDC903E2-3B29-4E7A-B335-20CF153FEDDB",
      title: "BDE:KFET",
      allDay: false,
      start: new Date("2021-08-30T07:00:00.000Z"),
      end: new Date("2021-08-30T08:00:00.000Z"),
      description: "",
      location: "",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: {
        subject: "BDE",
        unitType: "KFET",
      },
    }

    const newEvent = esieeGetEventTypePipe(event)

    expect(newEvent).toMatchObject(event)
  })
})
