import {
  formatClockTime,
  formatDayHeaderParts,
  formatDayMonth,
  formatEventDateRange,
  formatFullDateTime,
  formatFullDay,
  formatHourStartLabel,
  formatMonthYear,
  formatNarrowWeekday,
  formatShortDateTime,
  formatTime,
  formatTimeRange,
  resolveLocale,
} from "./format"

describe("formatClockTime", () => {
  const instant = new Date("2026-06-15T20:05:00.000Z")

  it.each([true, null] as const)(
    "uses the deterministic 24-hour convention for %s",
    (uses24HourClock) => {
      expect(
        formatClockTime(instant, "en", "Pacific/Noumea", uses24HourClock),
      ).toBe("07:05")
    },
  )

  it("uses localized 12-hour clock text when the device requests it", () => {
    expect(formatClockTime(instant, "en", "Pacific/Noumea", false)).toBe(
      "7:05 AM",
    )
    expect(formatClockTime(instant, "fr", "Pacific/Noumea", false)).toBe(
      "7:05 AM",
    )
  })
})

describe("formatHourStartLabel", () => {
  it.each(["en", "fr"] as const)(
    "uses deterministic 24-hour labels for true and null in %s",
    (locale) => {
      for (const [hour, expected] of [
        [0, "00:00"],
        [8, "08:00"],
        [12, "12:00"],
        [20, "20:00"],
      ] as const) {
        expect(formatHourStartLabel(hour, locale, true)).toBe(expected)
        expect(formatHourStartLabel(hour, locale, null)).toBe(expected)
      }
    },
  )

  it.each(["en", "fr"] as const)(
    "uses 12-hour day periods for false in %s",
    (locale) => {
      expect(
        [0, 8, 12, 20].map((hour) => formatHourStartLabel(hour, locale, false)),
      ).toEqual(["12 AM", "8 AM", "12 PM", "8 PM"])
    },
  )

  it.each([-1, 1.5, 24])("rejects the out-of-domain hour %s", (hour) => {
    expect(() => formatHourStartLabel(hour, "en", true)).toThrow(RangeError)
  })
})

// Fixtures are UTC INSTANTS and every assertion pins an explicit display zone,
// so the suite proves zone re-projection and never depends on the machine TZ
// (spec: zone-aware rendering proven in CI). Pacific/Noumea (UTC+11, no DST) is
// the canonical non-device zone; Europe/Paris (UTC+2 in June) covers the DST'd
// métropole case.

// 09:00 UTC on Monday 2026-06-15 → 11:00 Paris, 20:00 Nouméa.
const monday = new Date("2026-06-15T09:00:00.000Z")

describe("formatDayMonth", () => {
  it("formats the Home date in the display zone without the redundant year", () => {
    expect(formatDayMonth(monday, "en", "Europe/Paris")).toBe("Monday 15 June")
    expect(formatDayMonth(monday, "fr", "Europe/Paris")).toBe("lundi 15 juin")
  })

  it("rolls to the zone's next day across its midnight boundary", () => {
    // 23:30Z on the 15th is already 10:30 on the 16th in Nouméa.
    const lateEvening = new Date("2026-06-15T23:30:00.000Z")
    expect(formatDayMonth(lateEvening, "en", "Pacific/Noumea")).toBe(
      "Tuesday 16 June",
    )
  })
})

describe("formatDayHeaderParts", () => {
  it("uppercases the short weekday per locale", () => {
    expect(formatDayHeaderParts(monday, "en", "Europe/Paris").weekday).toBe(
      "MON",
    )
    expect(formatDayHeaderParts(monday, "fr", "Europe/Paris").weekday).toBe(
      "LUN.",
    )
  })

  it("returns the day-of-month number in the display zone", () => {
    expect(formatDayHeaderParts(monday, "en", "Europe/Paris").dayOfMonth).toBe(
      "15",
    )
    // 23:30Z crosses into the 16th in Nouméa.
    const lateEvening = new Date("2026-06-15T23:30:00.000Z")
    expect(
      formatDayHeaderParts(lateEvening, "en", "Pacific/Noumea").dayOfMonth,
    ).toBe("16")
  })

  it.each([
    ["en", "Europe/Paris", "TUE", "16"],
    ["fr", "Europe/Paris", "MAR.", "16"],
    ["en", "Pacific/Noumea", "TUE", "16"],
    ["fr", "Pacific/Noumea", "MAR.", "16"],
  ] as const)(
    "returns compact %s parts at the %s day boundary",
    (locale, zone, weekday, dayOfMonth) => {
      const instant = new Date("2026-06-15T23:30:00.000Z")
      expect(formatDayHeaderParts(instant, locale, zone)).toEqual({
        weekday,
        dayOfMonth,
      })
    },
  )
})

describe("formatNarrowWeekday", () => {
  const week = Array.from(
    { length: 7 },
    (_, offset) => new Date(Date.UTC(2026, 8, 14 + offset, 12)),
  )

  it("returns the system-language one-letter weekday sequence", () => {
    expect(
      week.map((day) => formatNarrowWeekday(day, "en", "Europe/Paris")),
    ).toEqual(["M", "T", "W", "T", "F", "S", "S"])
    expect(
      week.map((day) => formatNarrowWeekday(day, "fr", "Europe/Paris")),
    ).toEqual(["L", "M", "M", "J", "V", "S", "D"])
  })

  it("resolves the weekday after projecting into the display zone", () => {
    const lateMonday = new Date("2026-09-14T23:30:00.000Z")
    expect(formatNarrowWeekday(lateMonday, "en", "Pacific/Noumea")).toBe("T")
    expect(formatNarrowWeekday(lateMonday, "fr", "Pacific/Noumea")).toBe("M")
  })
})

describe("formatTimeRange / formatTime", () => {
  it("uses the event instant for a worldwide compatibility alias", () => {
    const winter = new Date("2026-01-15T12:00:00.000Z")
    const summer = new Date("2026-07-15T12:00:00.000Z")
    expect(formatTime(winter, "en", "US/Eastern")).toBe("07:00")
    expect(formatTime(summer, "en", "US/Eastern")).toBe("08:00")
  })
  it("re-projects the instants into the display zone (24-hour, zero-padded)", () => {
    const start = new Date("2026-06-15T07:00:00.000Z")
    const end = new Date("2026-06-15T11:30:00.000Z")
    expect(formatTimeRange(start, end, "en", "Europe/Paris")).toBe(
      "09:00 – 13:30",
    )
    expect(formatTimeRange(start, end, "fr", "Europe/Paris")).toBe(
      "09:00 – 13:30",
    )
    expect(formatTimeRange(start, end, "en", "Pacific/Noumea")).toBe(
      "18:00 – 22:30",
    )
    expect(formatTime(start, "en", "Europe/Paris")).toBe("09:00")
  })

  it("formats a zone midnight boundary time", () => {
    // 22:00Z = 00:00 Paris (UTC+2 in June).
    const start = new Date("2026-06-14T22:00:00.000Z")
    const end = new Date("2026-06-14T22:45:00.000Z")
    expect(formatTimeRange(start, end, "en", "Europe/Paris")).toBe(
      "00:00 – 00:45",
    )
  })
})

describe("formatEventDateRange", () => {
  // 09:00–10:30 Paris wall clock on Tuesday June 16.
  const start = new Date("2026-06-16T07:00:00.000Z")
  const end = new Date("2026-06-16T08:30:00.000Z")

  it("shows the full date + the HH:mm – HH:mm range for a same-zone-day event (EN)", () => {
    expect(formatEventDateRange(start, end, "en", false, "Europe/Paris")).toBe(
      "Tuesday, June 16th, 2026 · 09:00 – 10:30",
    )
  })

  it("shows the locale-appropriate full date (FR)", () => {
    expect(formatEventDateRange(start, end, "fr", false, "Europe/Paris")).toBe(
      "mardi 16 juin 2026 · 09:00 – 10:30",
    )
  })

  it("shows both full date-times for a cross-day event", () => {
    const nextDay = new Date("2026-06-16T23:00:00.000Z") // 01:00 Paris, June 17
    expect(
      formatEventDateRange(start, nextDay, "en", false, "Europe/Paris"),
    ).toBe("Tuesday, June 16th, 2026 09:00 – Wednesday, June 17th, 2026 01:00")
  })

  it("judges same-day on the ZONE's calendar days, not the device's", () => {
    // 23:30Z – 00:30Z spans UTC midnight, but in Nouméa it is 10:30 – 11:30 on
    // one single day (June 17) — same-day format, next-day date.
    const lateStart = new Date("2026-06-16T23:30:00.000Z")
    const lateEnd = new Date("2026-06-17T00:30:00.000Z")
    expect(
      formatEventDateRange(lateStart, lateEnd, "en", false, "Pacific/Noumea"),
    ).toBe("Wednesday, June 17th, 2026 · 10:30 – 11:30")
  })

  describe("all-day events (no time, keyed off the UTC floating day)", () => {
    // A single-day all-day event: UTC midnight start, EXCLUSIVE UTC-midnight end.
    const allDayStart = new Date("2026-05-25T00:00:00.000Z")
    const allDayEnd = new Date("2026-05-26T00:00:00.000Z")

    it("shows one full date with no time (EN)", () => {
      expect(
        formatEventDateRange(
          allDayStart,
          allDayEnd,
          "en",
          true,
          "Europe/Paris",
        ),
      ).toBe("Monday, May 25th, 2026")
    })

    it("does not shift the floating date for a UTC-negative display zone", () => {
      // Tahiti is UTC−10: a zone-projected May 25 midnight would read May 24.
      expect(
        formatEventDateRange(
          allDayStart,
          allDayEnd,
          "en",
          true,
          "Pacific/Tahiti",
        ),
      ).toBe("Monday, May 25th, 2026")
    })

    it("shows the locale-appropriate full date (FR)", () => {
      expect(
        formatEventDateRange(
          allDayStart,
          allDayEnd,
          "fr",
          true,
          "Europe/Paris",
        ),
      ).toBe("lundi 25 mai 2026")
    })

    it("shows a date range for a multi-day all-day event (exclusive end)", () => {
      // May 25 – 27 inclusive = DTEND 05-28 (exclusive); the last covered day is 27.
      const multiEnd = new Date("2026-05-28T00:00:00.000Z")
      expect(
        formatEventDateRange(allDayStart, multiEnd, "en", true, "Europe/Paris"),
      ).toBe("Monday, May 25th, 2026 – Wednesday, May 27th, 2026")
    })

    it("shows the single date for a degenerate zero-duration all-day event", () => {
      // end === start: the max() guard collapses the last day to start, not a
      // backwards "day-before – day" range (parity with the grid mapper's guard).
      expect(
        formatEventDateRange(
          allDayStart,
          allDayStart,
          "en",
          true,
          "Europe/Paris",
        ),
      ).toBe("Monday, May 25th, 2026")
    })
  })
})

describe("formatFullDateTime", () => {
  it("shows the full date + the time in the display zone (EN, 24-hour)", () => {
    const date = new Date("2026-06-15T20:05:00.000Z") // 22:05 Paris
    expect(formatFullDateTime(date, "en", "Europe/Paris")).toBe(
      "Monday, June 15th, 2026 · 22:05",
    )
  })

  it("shows the locale-appropriate full date (FR)", () => {
    const date = new Date("2026-06-14T22:00:00.000Z") // 00:00 Paris, June 15
    expect(formatFullDateTime(date, "fr", "Europe/Paris")).toBe(
      "lundi 15 juin 2026 · 00:00",
    )
  })
})

describe("formatFullDay", () => {
  it("shows the full localized date in the display zone", () => {
    expect(formatFullDay(monday, "en", "Europe/Paris")).toBe(
      "Monday, June 15th, 2026",
    )
    expect(formatFullDay(monday, "fr", "Europe/Paris")).toBe(
      "lundi 15 juin 2026",
    )
  })
})

describe("formatMonthYear", () => {
  const day = new Date("2026-07-05T10:00:00.000Z")

  it("shows the standalone month + year (EN)", () => {
    expect(formatMonthYear(day, "en", "Europe/Paris")).toBe("July 2026")
  })

  it("shows the locale-appropriate month + year (FR)", () => {
    expect(formatMonthYear(day, "fr", "Europe/Paris")).toBe("juillet 2026")
  })

  it("rolls the month across the zone's month boundary", () => {
    // 23:30Z on July 31 is already August 1 in Nouméa.
    const monthEdge = new Date("2026-07-31T23:30:00.000Z")
    expect(formatMonthYear(monthEdge, "en", "Pacific/Noumea")).toBe(
      "August 2026",
    )
  })
})

describe("formatShortDateTime", () => {
  it("shows a compact date + time in the display zone", () => {
    const date = new Date("2026-06-15T07:30:00.000Z")
    expect(formatShortDateTime(date, "en", "Europe/Paris")).toBe("15 Jun 09:30")
    expect(formatShortDateTime(date, "fr", "Europe/Paris")).toBe(
      "15 juin 09:30",
    )
    expect(formatShortDateTime(date, "en", "Pacific/Noumea")).toBe(
      "15 Jun 18:30",
    )
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
