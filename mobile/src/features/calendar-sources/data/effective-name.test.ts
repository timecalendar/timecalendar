import { effectiveCalendarName } from "./effective-name"

// The pure display rule shared by the list row and the rename dialog. The cases
// that matter are the ones the naive `stored || fallback` gets wrong (whitespace)
// and the ones a length-capping "fix" would get wrong (an over-long stored name
// must still display in full — the 100-char maximum bounds what a rename WRITES).

const fallback = "My timetable"

describe("effectiveCalendarName", () => {
  it("returns the stored name when it carries content", () => {
    expect(effectiveCalendarName("L3 Informatique", fallback)).toBe(
      "L3 Informatique",
    )
  })

  it("trims a padded stored name for display", () => {
    expect(effectiveCalendarName("  L3 Informatique  ", fallback)).toBe(
      "L3 Informatique",
    )
  })

  it("falls back for an empty stored name", () => {
    expect(effectiveCalendarName("", fallback)).toBe(fallback)
  })

  it("falls back for a whitespace-only stored name (what `||` let through)", () => {
    expect(effectiveCalendarName("   ", fallback)).toBe(fallback)
    expect(effectiveCalendarName("\n\t ", fallback)).toBe(fallback)
  })

  it("displays an over-long stored name in full rather than truncating it", () => {
    const long = "x".repeat(140)
    expect(effectiveCalendarName(long, fallback)).toBe(long)
  })
})
