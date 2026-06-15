import { validateIcalUrl } from "./validate-url"

// The pure pre-filter (90% logic glob). Asserts the LITERAL keys it returns
// (the test-file literal-string exemption applies); the screen maps them to t().
describe("validateIcalUrl", () => {
  it("accepts a valid http URL", () => {
    expect(validateIcalUrl("http://example.com/cal.ics")).toBeNull()
  })

  it("accepts a valid https URL", () => {
    expect(validateIcalUrl("https://example.com/cal.ics")).toBeNull()
  })

  it("accepts a URL despite surrounding whitespace (trims first)", () => {
    expect(validateIcalUrl("  https://example.com/cal.ics  ")).toBeNull()
  })

  it("rejects an empty string with the empty key", () => {
    expect(validateIcalUrl("")).toBe("calendarSources.icalUrl.error.empty")
  })

  it("rejects a whitespace-only string with the empty key", () => {
    expect(validateIcalUrl("   ")).toBe("calendarSources.icalUrl.error.empty")
  })

  it("rejects a non-URL value with the invalid key", () => {
    expect(validateIcalUrl("not a url")).toBe(
      "calendarSources.icalUrl.error.invalid",
    )
  })

  it("rejects a non-http(s) scheme with the invalid key", () => {
    expect(validateIcalUrl("ftp://example.com/cal.ics")).toBe(
      "calendarSources.icalUrl.error.invalid",
    )
  })
})
