import { FetcherCalendarEvent, EventType } from "../../models/event"
import ParseTeachersPipe from "../parse-teachers-pipe"

describe("parseTeachersPipe", () => {
  it("should parse teachers", () => {
    const event: FetcherCalendarEvent = {
      uid: "EDC903E2-3B29-4E7A-B335-20CF153FEDDB",
      title: "5I-IN9:TDRm",
      allDay: false,
      start: new Date("2021-08-30T07:00:00.000Z"),
      end: new Date("2021-08-30T08:00:00.000Z"),
      description:
        "1626957163460\n1I\n1IC\n2I\n5I-IN8\nAURION\nFOX RUDY\nCONNOR FIONA\n(Exported :29/08/2021 13:07)",
      location: "",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: {},
    }
    const pipe = ParseTeachersPipe()

    const newEvent = pipe(event)

    expect(newEvent).toMatchObject({
      ...event,
      description:
        "1626957163460\n1I\n1IC\n2I\n5I-IN8\nAURION\n(Exported :29/08/2021 13:07)",
      teachers: ["FOX RUDY", "CONNOR FIONA"],
    })
  })

  it("should parse teachers with a custom regex", () => {
    const event: FetcherCalendarEvent = {
      uid: "EDC903E2-3B29-4E7A-B335-20CF153FEDDB",
      title: "5I-IN9:TDRm",
      allDay: false,
      start: new Date("2021-08-30T07:00:00.000Z"),
      end: new Date("2021-08-30T08:00:00.000Z"),
      description:
        "1626957163460\n1I\n1IC\n2I\n5I-IN8\nAURION\nFOX R.\nCONNOR F.\n(Exported :29/08/2021 13:07)",
      location: "",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: {},
    }
    const pipe = ParseTeachersPipe(/^[A-Z- ]+\ [A-Z-]+\.$/)

    const newEvent = pipe(event)

    expect(newEvent).toMatchObject({
      ...event,
      description:
        "1626957163460\n1I\n1IC\n2I\n5I-IN8\nAURION\n(Exported :29/08/2021 13:07)",
      teachers: ["FOX R.", "CONNOR F."],
    })
  })
})
