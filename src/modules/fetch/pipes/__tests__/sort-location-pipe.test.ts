import { FetcherCalendarEvent, EventType } from "../../models/event"
import sortLocationPipe from "../sort-location-pipe"

describe("sortLocationPipe", () => {
  it("should sort the location", () => {
    const event: FetcherCalendarEvent = {
      uid: "EDC903E2-3B29-4E7A-B335-20CF153FEDDB",
      title: "Cours",
      allDay: false,
      start: new Date("2021-08-30T07:00:00.000Z"),
      end: new Date("2021-08-30T08:00:00.000Z"),
      description: "",
      location: "5301,5309,5308",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: {},
    }

    const newEvent = sortLocationPipe(event)

    expect(newEvent).toMatchObject({
      ...event,
      location: "5301, 5308, 5309",
    })
  })
})
