import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import univangersStrategy from "modules/fetch/schools/univangers/univangers-strategy"

describe("univangersStrategy", () => {
  describe("transformEvents", () => {
    it("parses an event", () => {
      const event = fetcherCalendarEventFactory.build({
        title:
          "CM - Salle 503 (40) - - équipé Projection - Gestion des ressources humaines - M2 Droit des Affaires / Droit de l'entreprise",
        description:
          "Catégorie : CM\nSalle : Salle 503 (40) - - équipé Projection\nMatière : Gestion des ressources humaines\nGroupe : M2 Droit des Affaires / Droit de l'entreprise\nPersonnel : MOREL Claudia\nRemarques :",
      })

      const parsedEvent = univangersStrategy.transformEvents([event])[0]

      expect(parsedEvent).toMatchObject({
        ...event,
        title: "Gestion des ressources humaines",
        teachers: ["MOREL Claudia"],
        description:
          "Catégorie : CM\nSalle : Salle 503 (40) - - équipé Projection\nGroupe : M2 Droit des Affaires / Droit de l'entreprise\nRemarques :",
      })
    })
  })
})
