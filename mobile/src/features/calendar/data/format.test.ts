import { formatDayHeaderParts, formatTimeRange } from "./format"

// A known Monday (2026-06-15) and a Tuesday — local-time so the formatting is
// TZ-independent.
const monday = new Date(2026, 5, 15, 9, 0, 0, 0)

describe("formatDayHeaderParts", () => {
  it("uppercases the short weekday per locale", () => {
    expect(formatDayHeaderParts(monday, "en").weekday).toBe("MON")
    expect(formatDayHeaderParts(monday, "fr").weekday).toBe("LUN.")
  })

  it("returns the day-of-month number", () => {
    expect(formatDayHeaderParts(monday, "en").dayOfMonth).toBe("15")
    expect(formatDayHeaderParts(monday, "fr").dayOfMonth).toBe("15")
  })
})

describe("formatTimeRange", () => {
  it("formats HH:mm – HH:mm (24-hour, zero-padded)", () => {
    const start = new Date(2026, 5, 15, 9, 0, 0, 0)
    const end = new Date(2026, 5, 15, 13, 30, 0, 0)
    expect(formatTimeRange(start, end, "en")).toBe("09:00 – 13:30")
    expect(formatTimeRange(start, end, "fr")).toBe("09:00 – 13:30")
  })

  it("formats a midnight boundary time", () => {
    const start = new Date(2026, 5, 15, 0, 0, 0, 0)
    const end = new Date(2026, 5, 15, 0, 45, 0, 0)
    expect(formatTimeRange(start, end, "en")).toBe("00:00 – 00:45")
  })
})
