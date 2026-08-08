import {
  addDaysInZone,
  atHourInZone,
  dayKey,
  dayKeyToDate,
  minuteOfDayInZone,
  startOfDayInZone,
  utcDayKey,
} from "./day-key"

// UTC-instant fixtures + explicit zones, so the suite proves display-zone day
// math regardless of the machine TZ (spec: the 23:30Z midnight-boundary proof).

describe("dayKey", () => {
  it("keys an instant on the display zone's calendar day", () => {
    const instant = new Date("2026-06-15T09:30:00.000Z")
    expect(dayKey(instant, "Europe/Paris")).toBe("2026-06-15")
    expect(dayKey(instant, "Pacific/Noumea")).toBe("2026-06-15")
  })

  it("rolls a 23:30Z instant onto the zone's NEXT day past its midnight", () => {
    const lateEvening = new Date("2026-03-01T23:30:00.000Z")
    // 00:30 March 2 in Paris (UTC+1 in March), 10:30 March 2 in Nouméa…
    expect(dayKey(lateEvening, "Europe/Paris")).toBe("2026-03-02")
    expect(dayKey(lateEvening, "Pacific/Noumea")).toBe("2026-03-02")
    // …but still 13:30 March 1 in Tahiti (UTC−10).
    expect(dayKey(lateEvening, "Pacific/Tahiti")).toBe("2026-03-01")
  })
})

describe("dayKeyToDate / startOfDayInZone", () => {
  it("round-trips a key through the zone's midnight instant", () => {
    const midnight = dayKeyToDate("2026-03-02", "Europe/Paris")
    expect(midnight.toISOString()).toBe("2026-03-01T23:00:00.000Z")
    expect(dayKey(midnight, "Europe/Paris")).toBe("2026-03-02")
  })

  it("yields an invalid date for a non-existent day key (the parseFocusDate guard)", () => {
    const invalid = dayKeyToDate("2026-02-31", "Europe/Paris")
    expect(Number.isNaN(invalid.getTime())).toBe(true)
  })

  it("startOfDayInZone lands on the zone's midnight of the instant's day", () => {
    const lateEvening = new Date("2026-03-01T23:30:00.000Z")
    const start = startOfDayInZone(lateEvening, "Europe/Paris")
    // The zone day is March 2; its midnight is 23:00Z March 1 (UTC+1).
    expect(start.toISOString()).toBe("2026-03-01T23:00:00.000Z")
  })
})

describe("addDaysInZone", () => {
  it("shifts by whole zone calendar days", () => {
    const start = dayKeyToDate("2026-06-15", "Pacific/Noumea")
    expect(
      dayKey(addDaysInZone(start, 7, "Pacific/Noumea"), "Pacific/Noumea"),
    ).toBe("2026-06-22")
  })

  it("keeps the zone midnight across a DST transition", () => {
    // Paris springs forward on 2026-03-29: the day is 23h long, but the shifted
    // instant must still be the NEXT zone midnight, not 01:00.
    const beforeDst = dayKeyToDate("2026-03-28", "Europe/Paris")
    const after = addDaysInZone(beforeDst, 2, "Europe/Paris")
    expect(dayKey(after, "Europe/Paris")).toBe("2026-03-30")
    expect(minuteOfDayInZone(after, "Europe/Paris")).toBe(0)
  })
})

describe("atHourInZone / minuteOfDayInZone", () => {
  it("places a wall-clock hour on the instant's zone day", () => {
    const lateEvening = new Date("2026-03-01T23:30:00.000Z") // March 2 in Nouméa
    const nine = atHourInZone(lateEvening, 9, "Pacific/Noumea")
    expect(dayKey(nine, "Pacific/Noumea")).toBe("2026-03-02")
    expect(minuteOfDayInZone(nine, "Pacific/Noumea")).toBe(9 * 60)
  })

  it("reads the zone wall-clock minute of an instant", () => {
    const instant = new Date("2026-06-15T07:45:00.000Z")
    expect(minuteOfDayInZone(instant, "Europe/Paris")).toBe(9 * 60 + 45)
    expect(minuteOfDayInZone(instant, "Pacific/Noumea")).toBe(18 * 60 + 45)
  })
})

describe("utcDayKey", () => {
  it("formats the UTC calendar day as zero-padded YYYY-MM-DD", () => {
    // An all-day event stored as UTC midnight keys on its UTC day in EVERY
    // timezone (the floating-date property) — read off UTC, never a zone.
    expect(utcDayKey(new Date("2026-05-25T00:00:00.000Z"))).toBe("2026-05-25")
    expect(utcDayKey(new Date("2026-01-05T00:00:00.000Z"))).toBe("2026-01-05")
  })

  it("keys the last covered day off the exclusive-end minus one millisecond", () => {
    // endsAt is the EXCLUSIVE end (05-26T00:00Z for a single May 25 all-day event);
    // endsAt − 1ms lands on the last covered UTC day.
    const exclusiveEnd = new Date("2026-05-26T00:00:00.000Z")
    expect(utcDayKey(new Date(exclusiveEnd.getTime() - 1))).toBe("2026-05-25")
  })
})
