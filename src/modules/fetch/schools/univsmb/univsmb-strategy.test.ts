import univsmbStrategy from "modules/fetch/schools/univsmb/univsmb-strategy"

describe("Savoie Mont Blanc University strategy", () => {
  describe("URL renamer", () => {
    it("should add the firstDate parameter to the URL", () => {
      const url =
        "http://ade6-usmb-ro.grenet.fr/jsp/custom/modules/plannings/direct_cal.jsp?resources=5934&projectId=1&calType=ical&login=iCalExport&password=73rosav&lastDate=2040-08-14"

      const newUrl = univsmbStrategy.transformUrl(url, "univsmb")

      expect(newUrl).toBe(
        "http://ade6-usmb-ro.grenet.fr/jsp/custom/modules/plannings/direct_cal.jsp?resources=5934&projectId=1&calType=ical&login=iCalExport&password=73rosav&firstDate=2019-08-26&lastDate=2040-08-14",
      )
    })
  })
})
