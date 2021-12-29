import { ReplaceUrlRenamer } from "../../renamers/replace-url-renamer"
import { SchoolStrategy } from "../school-strategy"

describe("SchoolStrategy", () => {
  describe("transformUrl", () => {
    it("should transform the url", () => {
      const strategy = new SchoolStrategy({
        school: "generic",
        urlRenamers: [new ReplaceUrlRenamer("rename1", "rename2")],
        eventPipes: [],
      })

      const url = strategy.transformUrl("http://rename1", "generic")

      expect(url).toBe("http://rename2")
    })

    it("should use all url renamers", () => {
      const strategy = new SchoolStrategy({
        school: "generic",
        urlRenamers: [
          new ReplaceUrlRenamer("rename1", "rename2"),
          new ReplaceUrlRenamer("rename3", "rename4"),
        ],
        eventPipes: [],
      })

      const url = strategy.transformUrl("http://rename1/rename3", "generic")

      expect(url).toBe("http://rename2/rename4")
    })

    it("should not use specific renamers for another school", () => {
      const strategy = new SchoolStrategy({
        school: "generic",
        urlRenamers: [
          new ReplaceUrlRenamer("rename1", "rename2"),
          {
            renamer: new ReplaceUrlRenamer("rename3", "rename4"),
            onlyThisSchool: true,
          },
        ],
        eventPipes: [],
      })

      const url = strategy.transformUrl("http://rename1/rename3", "rouen")

      expect(url).toBe("http://rename2/rename3")
    })
  })
})
