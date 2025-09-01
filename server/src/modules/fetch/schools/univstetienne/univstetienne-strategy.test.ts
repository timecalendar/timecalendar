import univstetienneStrategy from "modules/fetch/schools/univstetienne/univstetienne-strategy"

describe("St Etienne University strategy", () => {
  describe("URL renamer", () => {
    it("should replace the projectId to the correct one", () => {
      const url =
        "https://planning.univ-st-etienne.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=123&projectId=-1&calType=ical&firstDate=2025-08-18&lastDate=2026-08-17"

      const newUrl = univstetienneStrategy.transformUrl(url, "univstetienne")

      expect(newUrl).toBe(
        "https://planning.univ-st-etienne.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=123&projectId=3&calType=ical&firstDate=2025-08-18&lastDate=2026-08-17",
      )
    })
  })
})
