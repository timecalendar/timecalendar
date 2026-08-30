import { effectiveCalendarName } from "./effective-name"

// The whitespace reality this helper exists for (TIM-274): 80 685 live calendars
// have an empty name and 119 511 a whitespace-only one, and `" " || fallback`
// returns `" "` — a blank row. Display-only: the stored value is never rewritten.

describe("effectiveCalendarName", () => {
  it.each([
    ["empty", ""],
    ["a single space", " "],
    ["tabs and newlines", "\t\n  \n"],
    ["a non-breaking space", " "],
  ])("returns null for %s", (_label, stored) => {
    expect(effectiveCalendarName(stored)).toBeNull()
  })

  it("returns a real name unchanged", () => {
    expect(effectiveCalendarName("L3 Informatique")).toBe("L3 Informatique")
  })

  it("trims padding around a real name", () => {
    expect(effectiveCalendarName("  L3 Informatique \n")).toBe(
      "L3 Informatique",
    )
  })

  it("does not truncate a legacy name longer than the input maximum", () => {
    const long = "x".repeat(140)
    expect(effectiveCalendarName(long)).toBe(long)
  })

  it("does not mutate the value it is given", () => {
    const stored = "  L3  "
    effectiveCalendarName(stored)
    expect(stored).toBe("  L3  ")
  })
})
