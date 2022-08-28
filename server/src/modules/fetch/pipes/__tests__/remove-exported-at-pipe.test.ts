import {
  FetcherCalendarEvent,
  EventType,
} from "modules/fetch/models/event.model"
import removeExportedAtPipe from "modules/fetch/pipes/remove-exported-at-pipe"

describe("removeExportedAtPipe", () => {
  it("should remove exported at lines", () => {
    const event: FetcherCalendarEvent = {
      uid: "EDC903E2-3B29-4E7A-B335-20CF153FEDDB",
      title: "Cours",
      allDay: false,
      start: new Date("2021-08-30T07:00:00.000Z"),
      end: new Date("2021-08-30T08:00:00.000Z"),
      description:
        "\n\nMMI1 - A\nMMI1 - B\nMMI1 - C\n(Exported :29/08/2021 11:27)\nMMI1 - D\n",
      location: "Paris",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: {},
    }

    const newEvent = removeExportedAtPipe(event)

    expect(newEvent).toMatchObject({
      ...event,
      description: "\n\nMMI1 - A\nMMI1 - B\nMMI1 - C\nMMI1 - D\n",
    })
  })
})
