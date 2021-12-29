import { FetcherCalendarEvent, EventType } from "../../models/event"
import esieeGetUnitNamePipe from "./esiee-get-unit-name-pipe"

jest.mock("src/modules/storage/firestore", () => {
  return {
    appFirestore: {
      get: jest.fn((_, __, onChange) => {
        onChange({ "5I-IN8": "Usine logicielle" })
      }),
    },
  }
})

describe("esieeGetUnitNamePipe", () => {
  it("should replace unit codes by unit name", () => {
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
      fields: {},
    }

    const newEvent = esieeGetUnitNamePipe(event)

    expect(newEvent).toMatchObject({
      ...event,
      title: "Usine logicielle - TDRm",
      fields: {
        subject: "5I-IN8",
        unitType: "TDRm",
      },
    })
  })

  it("should not modify the title when the code is non-existant", () => {
    const event: FetcherCalendarEvent = {
      uid: "EDC903E2-3B29-4E7A-B335-20CF153FEDDB",
      title: "5I-IN9:TDRm",
      allDay: false,
      start: new Date("2021-08-30T07:00:00.000Z"),
      end: new Date("2021-08-30T08:00:00.000Z"),
      description:
        "1626957163460\n1I\n1IC\n2I\n5I-IN8\nAURION\nFOX R.\n(Exported :29/08/2021 13:07)",
      location: "Paris",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: {},
    }

    const newEvent = esieeGetUnitNamePipe(event)

    expect(newEvent).toMatchObject({
      ...event,
      title: "5I-IN9 - TDRm",
      fields: {
        subject: "5I-IN9",
        unitType: "TDRm",
      },
    })
  })
})
