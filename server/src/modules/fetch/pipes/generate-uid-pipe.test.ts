import {
  FetcherCalendarEvent,
  EventType,
} from "modules/fetch/models/event.model"
import generateUidPipe from "modules/fetch/pipes/generate-uid-pipe"

describe("generateUidPipe", () => {
  it("should generate a uid", () => {
    const event: FetcherCalendarEvent = {
      uid: "",
      title: "Cours",
      allDay: false,
      start: new Date("2021-08-30T07:00:00.000Z"),
      end: new Date("2021-08-30T08:00:00.000Z"),
      description: "",
      location: "",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: {},
    }

    const newEvent = generateUidPipe(event)

    expect(newEvent).toMatchObject({
      ...event,
      uid: "cours-ace971b7-5d14-5a46-bc3a-1b1a0324c907@timecalendar.app",
    })
  })

  it("should not generate a uid for events with an existing uid", () => {
    const event: FetcherCalendarEvent = {
      uid: "EDC903E2-3B29-4E7A-B335-20CF153FEDDB",
      title: "Cours",
      allDay: false,
      start: new Date("2021-08-30T07:00:00.000Z"),
      end: new Date("2021-08-30T08:00:00.000Z"),
      description: "",
      location: "",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: {},
    }

    const newEvent = generateUidPipe(event)

    expect(newEvent).toMatchObject(event)
  })
})
