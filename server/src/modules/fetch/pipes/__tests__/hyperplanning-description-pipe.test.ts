import {
  FetcherCalendarEvent,
  EventType,
} from "modules/fetch/models/event.model"
import hyperplanningDescriptionPipe from "modules/fetch/pipes/hyperplanning-description-pipe"

describe("hyperplanningDescriptionPipe", () => {
  it("should parse the description", () => {
    const event: FetcherCalendarEvent = {
      uid: "Cours-808574-4-Prevost_Emeline-Index-Education",
      title:
        "droit maritime - Mme Guenole Martine - AI-M1 - CARRIERES JUDICIAIRES, AI-M1 - DT ACTI MARIT PORTUA, AI-M1 - DT INTERNAT AFFAIRES, AI-M1 - DT PUB COLL TERRITOR",
      allDay: false,
      start: new Date("2021-09-13T09:00:00.000Z"),
      end: new Date("2021-09-13T11:00:00.000Z"),
      description:
        "Matière : droit maritime\nEnseignant : M Jordan Granet\nPromotions : AI-M1 - CARRIERES JUDICIAIRES, AI-M1 - DT ACTI MARIT PORTUA, AI-M1 - DT INTERNAT AFFAIRES, AI-M1 - DT PUB COLL TERRITOR\nSalle : AI-Amphi 2",
      location: "AI-Amphi 2",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: {},
    }

    const newEvent = hyperplanningDescriptionPipe(event)

    expect(newEvent).toMatchObject({
      ...event,
      description: "",
      teachers: ["M Jordan Granet"],
    })
  })

  it("should parse canceled events", () => {
    const event: FetcherCalendarEvent = {
      uid: "Cours-808574-4-Prevost_Emeline-Index-Education",
      title:
        "droit maritime - Mme Guenole Martine - AI-M1 - CARRIERES JUDICIAIRES, AI-M1 - DT ACTI MARIT PORTUA, AI-M1 - DT INTERNAT AFFAIRES, AI-M1 - DT PUB COLL TERRITOR",
      allDay: false,
      start: new Date("2021-09-13T09:00:00.000Z"),
      end: new Date("2021-09-13T11:00:00.000Z"),
      description:
        "Matière : droit maritime\nEnseignant : M Jordan Granet\nPromotions : AI-M1 - CARRIERES JUDICIAIRES, AI-M1 - DT ACTI MARIT PORTUA, AI-M1 - DT INTERNAT AFFAIRES, AI-M1 - DT PUB COLL TERRITOR\nAbsence :\nSalle : AI-Amphi 2",
      location: "AI-Amphi 2",
      type: EventType.CLASS,
      teachers: [],
      tags: [],
      fields: {},
    }

    const newEvent = hyperplanningDescriptionPipe(event)

    expect(newEvent).toMatchObject({
      ...event,
      description: "",
      teachers: ["M Jordan Granet"],
      fields: {
        canceled: true,
      },
    })
  })
})
