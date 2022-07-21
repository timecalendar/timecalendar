import { FetcherCalendarEvent, EventType } from "modules/fetch/models/event"
import esieeParseDescriptionPipe from "modules/fetch/schools/esiee/esiee-parse-description-pipe"

describe("esieeParseDescriptionPipe", () => {
  it("should remove useless description lines", () => {
    const event: FetcherCalendarEvent = {
      uid: "EDC903E2-3B29-4E7A-B335-20CF153FEDDB",
      title: "Usine logicielle - TDRm",
      allDay: false,
      start: new Date("2021-08-30T07:00:00.000Z"),
      end: new Date("2021-08-30T08:00:00.000Z"),
      description:
        "1626957163460\n1I\n1IC\n2I\n5I-IN8\nAURION\nFOX R.\n(Exported :29/08/2021 13:07)",
      location: "Paris",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: { subject: "5I-IN8" },
    }

    const newEvent = esieeParseDescriptionPipe(event)

    expect(newEvent).toMatchObject({
      ...event,
      description: "1I\n1IC\n2I\n5I-IN8\nFOX R.\n(Exported :29/08/2021 13:07)",
    })
  })
})
