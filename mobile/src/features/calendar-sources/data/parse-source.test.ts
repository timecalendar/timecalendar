import { parseScannedSource } from "./parse-source"

describe("parseScannedSource", () => {
  it("accepts an https URL verbatim", () => {
    expect(parseScannedSource("https://example.com/cal.ics")).toEqual({
      url: "https://example.com/cal.ics",
    })
  })

  it("accepts an http URL verbatim", () => {
    expect(parseScannedSource("http://example.com/cal.ics")).toEqual({
      url: "http://example.com/cal.ics",
    })
  })

  it("normalizes a webcal URL to https, keeping the rest verbatim", () => {
    expect(parseScannedSource("webcal://example.com/cal.ics")).toEqual({
      url: "https://example.com/cal.ics",
    })
  })

  it("trims surrounding whitespace before validating", () => {
    expect(parseScannedSource("  https://example.com/cal.ics  ")).toEqual({
      url: "https://example.com/cal.ics",
    })
  })

  it("trims before normalizing a webcal URL", () => {
    expect(parseScannedSource("\twebcal://example.com/cal.ics\n")).toEqual({
      url: "https://example.com/cal.ics",
    })
  })

  it("returns null for an empty string", () => {
    expect(parseScannedSource("")).toBeNull()
  })

  it("returns null for a whitespace-only string", () => {
    expect(parseScannedSource("   \t\n ")).toBeNull()
  })

  it("returns null for a non-URL string", () => {
    expect(parseScannedSource("BEGIN:VCARD")).toBeNull()
  })

  it("returns null for a non-http(s)/webcal scheme", () => {
    expect(parseScannedSource("ftp://example.com/cal.ics")).toBeNull()
  })
})
