import {
  clearTimezoneRuntimeSupportCache,
  formatTimezoneOffset,
  getTimezoneCityLabel,
  getTimezoneRecord,
  isTimezoneRuntimeSupported,
  normalizeTimezoneSearch,
  searchTimezones,
  TIMEZONE_CATALOG,
  TIMEZONE_CATALOG_PROVENANCE,
} from "./index"

const formerCurated = [
  "Europe/Paris",
  "America/Guadeloupe",
  "America/Martinique",
  "America/Cayenne",
  "America/Miquelon",
  "Indian/Reunion",
  "Indian/Mayotte",
  "Pacific/Noumea",
  "Pacific/Wallis",
  "Pacific/Tahiti",
]

describe("generated timezone catalog", () => {
  afterEach(clearTimezoneRuntimeSupportCache)

  it("records exact inputs and preserves curated values, aliases, and UTC", () => {
    expect(TIMEZONE_CATALOG_PROVENANCE).toEqual({
      "@vvo/tzdb": "6.198.0",
      "cldr-dates-full": "48.2.0",
      "cldr-localenames-full": "48.2.0",
    })
    expect(formerCurated.every((id) => getTimezoneRecord(id)?.id === id)).toBe(
      true,
    )
    expect(getTimezoneRecord("US/Eastern")?.id).toBe("US/Eastern")
    expect(getTimezoneRecord("UTC")?.id).toBe("UTC")
    expect(new Set(TIMEZONE_CATALOG.map(({ id }) => id)).size).toBe(
      TIMEZONE_CATALOG.length,
    )
  })

  it("falls back from missing CLDR exemplars to supplied cities", () => {
    expect(getTimezoneCityLabel(getTimezoneRecord("Europe/Paris")!, "fr")).toBe(
      "Paris",
    )
  })

  it.each([
    ["Lyon", "Europe/Paris"],
    ["London", "Europe/London"],
    ["Londres", "Europe/London"],
    ["France", "Europe/Paris"],
    ["europe paris", "Europe/Paris"],
  ])("finds %s as %s", (query, expected) => {
    expect(searchTimezones(query, "en").map(({ id }) => id)).toContain(expected)
  })

  it("normalizes accents and requires every token", () => {
    expect(normalizeTimezoneSearch("  Montréal/Québec  ")).toBe(
      "montreal quebec",
    )
    expect(searchTimezones("Montreal", "fr").map(({ id }) => id)).toEqual(
      searchTimezones("Montréal", "fr").map(({ id }) => id),
    )
    expect(searchTimezones("Paris impossible", "en")).toEqual([])
  })

  it("pins the exact current value for empty queries", () => {
    expect(searchTimezones("   ", "fr", "Asia/Kathmandu")[0]?.id).toBe(
      "Asia/Kathmandu",
    )
  })

  it("classifies runtime support totally", () => {
    expect(isTimezoneRuntimeSupported("UTC")).toBe(true)
    expect(isTimezoneRuntimeSupported("Not/A_Zone")).toBe(false)
  })

  it.each([
    ["UTC", "2026-01-15T00:00:00Z", "UTC+00:00"],
    ["Europe/Paris", "2026-01-15T00:00:00Z", "UTC+01:00"],
    ["Europe/Paris", "2026-07-15T00:00:00Z", "UTC+02:00"],
    ["Asia/Kathmandu", "2026-01-15T00:00:00Z", "UTC+05:45"],
    ["Australia/Adelaide", "2026-07-15T00:00:00Z", "UTC+09:30"],
  ])("formats %s at the supplied instant", (id, instant, expected) => {
    expect(formatTimezoneOffset(id, new Date(instant))).toBe(expected)
  })
})
