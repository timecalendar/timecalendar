import {
  formatDayHeaderParts,
  formatEventDateRange,
  formatFullDateTime,
  formatTimeRange,
} from "./format"

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

describe("formatEventDateRange", () => {
  const start = new Date(2026, 5, 16, 9, 0, 0, 0)
  const end = new Date(2026, 5, 16, 10, 30, 0, 0)

  it("shows the full date + the HH:mm – HH:mm range for a same-day event (EN)", () => {
    expect(formatEventDateRange(start, end, "en")).toBe(
      "Tuesday, June 16th, 2026 · 09:00 – 10:30",
    )
  })

  it("shows the locale-appropriate full date (FR)", () => {
    expect(formatEventDateRange(start, end, "fr")).toBe(
      "mardi 16 juin 2026 · 09:00 – 10:30",
    )
  })

  it("shows both full date-times for a cross-day event", () => {
    const nextDay = new Date(2026, 5, 17, 1, 0, 0, 0)
    expect(formatEventDateRange(start, nextDay, "en")).toBe(
      "Tuesday, June 16th, 2026 09:00 – Wednesday, June 17th, 2026 01:00",
    )
  })
})

describe("formatFullDateTime", () => {
  it("shows the full date + the time (EN, 24-hour)", () => {
    const date = new Date(2026, 5, 15, 22, 5, 0, 0)
    expect(formatFullDateTime(date, "en")).toBe(
      "Monday, June 15th, 2026 · 22:05",
    )
  })

  it("shows the locale-appropriate full date (FR)", () => {
    const date = new Date(2026, 5, 15, 0, 0, 0, 0)
    expect(formatFullDateTime(date, "fr")).toBe("lundi 15 juin 2026 · 00:00")
  })
})
