import { AdeExportWindowRenamer } from "modules/fetch/renamers/ade-export-window-renamer"

describe("AdeExportWindowRenamer", () => {
  const renamer = new AdeExportWindowRenamer(
    () => new Date("2026-08-25T12:00:00.000Z"),
  )
  const anonymousUrl =
    "https://ade.example.fr/jsp/custom/modules/plannings/anonymous_cal.jsp"
  const directUrl =
    "http://ade.example.fr/jsp/custom/modules/plannings/direct_cal.jsp"

  const rename = (url: string) => renamer.rename(url)

  it.each([anonymousUrl, directUrl])(
    "normalizes an explicit pair on %s",
    (endpoint) => {
      const result = new URL(
        rename(
          `${endpoint}?firstDate=2020-01-01&resources=1&lastDate=2020-01-02&calType=ical`,
        ),
      )

      expect(result.searchParams.get("firstDate")).toBe("2025-08-25")
      expect(result.searchParams.get("lastDate")).toBe("2027-08-25")
      expect(result.searchParams.get("resources")).toBe("1")
    },
  )

  it("normalizes either date order", () => {
    const result = new URL(
      rename(
        `${anonymousUrl}?lastDate=2020-01-02&calType=ical&firstDate=2020-01-01`,
      ),
    )

    expect(result.searchParams.get("firstDate")).toBe("2025-08-25")
    expect(result.searchParams.get("lastDate")).toBe("2027-08-25")
  })

  it("replaces nbWeeks with the bounded date pair", () => {
    const result = new URL(
      rename(`${anonymousUrl}?resources=1&calType=ical&nbWeeks=4`),
    )

    expect(result.searchParams.has("nbWeeks")).toBe(false)
    expect(result.searchParams.get("firstDate")).toBe("2025-08-25")
    expect(result.searchParams.get("lastDate")).toBe("2027-08-25")
    expect(result.toString()).not.toContain("2000-01-01")
    expect(result.toString()).not.toContain("2038-01-01")
  })

  it("canonicalizes duplicate dates and preserves unrelated values and the fragment", () => {
    const result = new URL(
      rename(
        `${directUrl}?firstDate=2020-01-01&resources=1%2C2&firstDate=2021-01-01&projectId=-1&calType=ical&login=user&password=p%40ss&extra=a%20b&lastDate=2020-01-02&lastDate=2021-01-02#anchor`,
      ),
    )

    expect(result.searchParams.getAll("firstDate")).toEqual(["2025-08-25"])
    expect(result.searchParams.getAll("lastDate")).toEqual(["2027-08-25"])
    expect(result.searchParams.get("resources")).toBe("1,2")
    expect(result.searchParams.get("projectId")).toBe("-1")
    expect(result.searchParams.get("login")).toBe("user")
    expect(result.searchParams.get("password")).toBe("p@ss")
    expect(result.searchParams.get("extra")).toBe("a b")
    expect(result.hash).toBe("#anchor")
  })

  it.each([
    "not a url",
    "ftp://ade.example.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?calType=ical&firstDate=2020-01-01&lastDate=2020-01-02",
    "https://ade.example.fr/jsp/custom/modules/plannings/index.jsp?calType=ical&firstDate=2020-01-01&lastDate=2020-01-02",
    "https://ade.example.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?calType=html&firstDate=2020-01-01&lastDate=2020-01-02",
    "https://ade.example.fr/standard/direct_planning.jsp?calType=ical&firstDate=2020-01-01&lastDate=2020-01-02",
    "https://example.fr/calendar?calType=ical&firstDate=2020-01-01&lastDate=2020-01-02",
  ])("leaves an invalid or unsupported url unchanged: %s", (url) => {
    expect(rename(url)).toBe(url)
  })

  it.each([
    `${anonymousUrl}?calType=ical&firstDate=2020-01-01`,
    `${anonymousUrl}?calType=ical&lastDate=2020-01-02`,
  ])("leaves an incomplete explicit pair unchanged: %s", (url) => {
    expect(rename(url)).toBe(url)
  })

  it("normalizes nbWeeks even when an explicit pair is incomplete", () => {
    const result = new URL(
      rename(`${anonymousUrl}?calType=ical&lastDate=2020-01-02&nbWeeks=4`),
    )

    expect(result.searchParams.has("nbWeeks")).toBe(false)
    expect(result.searchParams.get("firstDate")).toBe("2025-08-25")
    expect(result.searchParams.get("lastDate")).toBe("2027-08-25")
  })
})
