import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import parseTeachersPipe from "modules/fetch/pipes/parse-teachers-pipe"

describe("parseTeachersPipe", () => {
  it("should parse teachers", () => {
    const event = fetcherCalendarEventFactory.build({
      description:
        "1626957163460\n1I\n1IC\n2I\n5I-IN8\nAURION\nFOX RUDY\nCONNOR FIONA\n(Exported :29/08/2021 13:07)",
    })
    const newEvent = parseTeachersPipe()(event)

    expect(newEvent).toMatchObject({
      ...event,
      description:
        "1626957163460\n1I\n1IC\n2I\n5I-IN8\nAURION\n(Exported :29/08/2021 13:07)",
      teachers: ["FOX RUDY", "CONNOR FIONA"],
    })
  })

  it("should parse teachers with a custom regex", () => {
    const event = fetcherCalendarEventFactory.build({
      description:
        "1626957163460\n1I\n1IC\n2I\n5I-IN8\nAURION\nFOX R.\nCONNOR F.\n(Exported :29/08/2021 13:07)",
    })

    const newEvent = parseTeachersPipe(/^[A-Z- ]+ [A-Z-]+\.$/)(event)

    expect(newEvent).toMatchObject({
      ...event,
      description:
        "1626957163460\n1I\n1IC\n2I\n5I-IN8\nAURION\n(Exported :29/08/2021 13:07)",
      teachers: ["FOX R.", "CONNOR F."],
    })
  })
})
