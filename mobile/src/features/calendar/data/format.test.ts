import {
  formatDayHeaderParts,
  formatEventDateRange,
  formatFullDateTime,
  formatFullDay,
  formatMonthYear,
  formatTimeRange,
  resolveLocale,
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
    expect(formatEventDateRange(start, end, "en", false)).toBe(
      "Tuesday, June 16th, 2026 · 09:00 – 10:30",
    )
  })

  it("shows the locale-appropriate full date (FR)", () => {
    expect(formatEventDateRange(start, end, "fr", false)).toBe(
      "mardi 16 juin 2026 · 09:00 – 10:30",
    )
  })

  it("shows both full date-times for a cross-day event", () => {
    const nextDay = new Date(2026, 5, 17, 1, 0, 0, 0)
    expect(formatEventDateRange(start, nextDay, "en", false)).toBe(
      "Tuesday, June 16th, 2026 09:00 – Wednesday, June 17th, 2026 01:00",
    )
  })

  describe("all-day events (no time, keyed off the UTC floating day)", () => {
    // A single-day all-day event: UTC midnight start, EXCLUSIVE UTC-midnight end.
    const allDayStart = new Date("2026-05-25T00:00:00.000Z")
    const allDayEnd = new Date("2026-05-26T00:00:00.000Z")

    it("shows one full date with no time (EN)", () => {
      expect(formatEventDateRange(allDayStart, allDayEnd, "en", true)).toBe(
        "Monday, May 25th, 2026",
      )
    })

    it("shows the locale-appropriate full date (FR)", () => {
      expect(formatEventDateRange(allDayStart, allDayEnd, "fr", true)).toBe(
        "lundi 25 mai 2026",
      )
    })

    it("shows a date range for a multi-day all-day event (exclusive end)", () => {
      // May 25 – 27 inclusive = DTEND 05-28 (exclusive); the last covered day is 27.
      const multiEnd = new Date("2026-05-28T00:00:00.000Z")
      expect(formatEventDateRange(allDayStart, multiEnd, "en", true)).toBe(
        "Monday, May 25th, 2026 – Wednesday, May 27th, 2026",
      )
    })

    it("shows the single date for a degenerate zero-duration all-day event", () => {
      // end === start: the max() guard collapses the last day to start, not a
      // backwards "day-before – day" range (parity with the grid mapper's guard).
      expect(formatEventDateRange(allDayStart, allDayStart, "en", true)).toBe(
        "Monday, May 25th, 2026",
      )
    })
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

describe("formatFullDay", () => {
  const day = new Date(2026, 5, 15, 0, 0, 0, 0)

  it("shows the full localized date (EN)", () => {
    expect(formatFullDay(day, "en")).toBe("Monday, June 15th, 2026")
  })

  it("shows the locale-appropriate full date (FR)", () => {
    expect(formatFullDay(day, "fr")).toBe("lundi 15 juin 2026")
  })
})

describe("formatMonthYear", () => {
  const day = new Date(2026, 6, 5, 0, 0, 0, 0) // 2026-07-05, local

  it("shows the standalone month + year (EN)", () => {
    expect(formatMonthYear(day, "en")).toBe("July 2026")
  })

  it("shows the locale-appropriate month + year (FR)", () => {
    expect(formatMonthYear(day, "fr")).toBe("juillet 2026")
  })
})

describe("resolveLocale", () => {
  it("maps any fr* language tag to FR", () => {
    expect(resolveLocale("fr")).toBe("fr")
    expect(resolveLocale("fr-FR")).toBe("fr")
  })

  it("maps everything else to EN", () => {
    expect(resolveLocale("en")).toBe("en")
    expect(resolveLocale("en-US")).toBe("en")
    expect(resolveLocale("de")).toBe("en")
  })
})
