import { ReplaceUrlRenamer } from "modules/fetch/renamers/replace-url-renamer"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

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

  describe("isMatchingCalendarSource", () => {
    it("should match the school by code", () => {
      const strategy = new SchoolStrategy({ school: "academiaschool" })

      const isMatching = strategy.isMatchingCalendarSource("academiaschool", {
        url: "http://example.com",
        customData: {},
      })

      expect(isMatching).toBe(true)
    })

    it("should not match the school by code", () => {
      const strategy = new SchoolStrategy({ school: "academiaschool" })

      const isMatching = strategy.isMatchingCalendarSource(
        "notacademiaschool",
        {
          url: "http://example.com",
          customData: {},
        },
      )

      expect(isMatching).toBe(false)
    })

    it("should match the school by url", () => {
      const strategy = new SchoolStrategy({
        match: [/example/],
      })

      const isMatching = strategy.isMatchingCalendarSource("academiaschool", {
        url: "http://example.com",
        customData: {},
      })

      expect(isMatching).toBe(true)
    })

    it("should not match the school by url", () => {
      const strategy = new SchoolStrategy({
        match: [/example/],
      })

      const isMatching = strategy.isMatchingCalendarSource("academiaschool", {
        url: "http://anotherurl.com",
        customData: {},
      })

      expect(isMatching).toBe(false)
    })

    it("should match the school by url with string", () => {
      const strategy = new SchoolStrategy({
        match: ["example"],
      })

      const isMatching = strategy.isMatchingCalendarSource("academiaschool", {
        url: "http://example.com",
        customData: {},
      })

      expect(isMatching).toBe(true)
    })

    it("should not match the school by url with string", () => {
      const strategy = new SchoolStrategy({
        match: ["example"],
      })

      const isMatching = strategy.isMatchingCalendarSource("academiaschool", {
        url: "http://anotherurl.com",
        customData: {},
      })

      expect(isMatching).toBe(false)
    })

    it("should match the school by url with function", () => {
      const strategy = new SchoolStrategy({
        match: [({ source }) => source.url.includes("example")],
      })

      const isMatching = strategy.isMatchingCalendarSource("academiaschool", {
        url: "http://example.com",
        customData: {},
      })

      expect(isMatching).toBe(true)
    })

    it("should not match the school by url with function", () => {
      const strategy = new SchoolStrategy({
        match: [({ source }) => source.url.includes("example")],
      })

      const isMatching = strategy.isMatchingCalendarSource("academiaschool", {
        url: "http://anotherurl.com",
        customData: {},
      })

      expect(isMatching).toBe(false)
    })

    it("should match the school by multiple matchers", () => {
      const strategy = new SchoolStrategy({
        match: ["example", /anotherurl/],
      })

      const isMatching = strategy.isMatchingCalendarSource("academiaschool", {
        url: "http://anotherurl.com",
        customData: {},
      })

      expect(isMatching).toBe(true)
    })
  })
})
