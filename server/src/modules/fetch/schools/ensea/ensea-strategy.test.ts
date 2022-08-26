import enseaStrategy from "modules/fetch/schools/ensea/ensea-strategy"

describe("ENSEA strategy", () => {
  describe("URL renamer", () => {
    it("should add the http protocol", () => {
      const url = "ade.ensea.fr/direct/"

      const newUrl = enseaStrategy.transformUrl(url, "ensea")

      expect(newUrl).toBe("http://ade.ensea.fr/direct/")
    })
  })
})
