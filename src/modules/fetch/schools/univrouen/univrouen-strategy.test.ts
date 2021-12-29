import univrouenStrategy from "./univrouen-strategy"

describe("Rouen University strategy", () => {
  describe("URL renamer", () => {
    it("should replace the internal address with the public address", () => {
      const url =
        "http://ade-as.univ-rouen.fr:8080/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=11109&projectId=0&calType=ical&nbWeeks=4"

      const newUrl = univrouenStrategy.transformUrl(url, "univrouen")

      expect(newUrl).toBe(
        "http://adecampus.univ-rouen.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=11109&projectId=0&calType=ical&nbWeeks=4",
      )
    })
  })
})
