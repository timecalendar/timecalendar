import { dayKey } from "./day-key"
import {
  epochDayKey,
  epochDayOfInstant,
  epochDayOfKey,
  epochDayStart,
  weekdayOfEpochDay,
  weekStartEpochDay,
} from "./epoch-day"

describe("EpochDay", () => {
  it("counts civil days from 1970-01-01 in both directions", () => {
    expect(epochDayOfKey("1970-01-01")).toBe(0)
    expect(epochDayOfKey("1970-01-02")).toBe(1)
    expect(epochDayOfKey("1969-12-31")).toBe(-1)
    expect(epochDayOfKey("2026-10-01")).toBe(20_727)
    expect(epochDayKey(20_727)).toBe("2026-10-01")
    expect(epochDayKey(-1)).toBe("1969-12-31")
  })

  it("round-trips every day across leap years", () => {
    for (let day = epochDayOfKey("2023-12-01"); day < 20_727; day += 1) {
      expect(epochDayOfKey(epochDayKey(day))).toBe(day)
    }
    expect(epochDayKey(epochDayOfKey("2024-02-28") + 1)).toBe("2024-02-29")
    expect(epochDayKey(epochDayOfKey("2025-02-28") + 1)).toBe("2025-03-01")
  })

  it("rejects malformed and non-existent day keys", () => {
    expect(() => epochDayOfKey("2026-2-1")).toThrow(RangeError)
    expect(() => epochDayOfKey("2026-02-31")).toThrow(RangeError)
    expect(() => epochDayOfKey("2026-13-01")).toThrow(RangeError)
    expect(() => epochDayKey(1.5)).toThrow(RangeError)
  })

  it("keys an instant on the display zone's civil day", () => {
    const instant = new Date("2026-10-01T22:30:00.000Z")
    expect(epochDayKey(epochDayOfInstant(instant, "UTC"))).toBe("2026-10-01")
    expect(epochDayKey(epochDayOfInstant(instant, "Europe/Paris"))).toBe(
      "2026-10-02",
    )
    expect(epochDayKey(epochDayOfInstant(instant, "America/New_York"))).toBe(
      "2026-10-01",
    )
  })

  it.each([
    ["Europe/Paris", "2026-03-29", "2026-03-28T23:00:00.000Z"],
    ["Europe/Paris", "2026-03-30", "2026-03-29T22:00:00.000Z"],
    ["Europe/Paris", "2026-10-25", "2026-10-24T22:00:00.000Z"],
    ["Europe/Paris", "2026-10-26", "2026-10-25T23:00:00.000Z"],
    ["America/New_York", "2026-03-08", "2026-03-08T05:00:00.000Z"],
    ["America/New_York", "2026-11-02", "2026-11-02T05:00:00.000Z"],
    ["Australia/Lord_Howe", "2026-10-04", "2026-10-03T13:30:00.000Z"],
    ["Australia/Lord_Howe", "2026-10-05", "2026-10-04T13:00:00.000Z"],
  ])("starts %s %s at its local midnight across DST", (zone, key, iso) => {
    const start = epochDayStart(epochDayOfKey(key), zone)
    expect(start.toISOString()).toBe(iso)
    expect(dayKey(start, zone)).toBe(key)
  })

  it.each([
    ["America/Santiago", "2026-09-06", "2026-09-06T04:00:00.000Z"],
    ["Africa/Cairo", "2026-04-24", "2026-04-23T22:00:00.000Z"],
    ["America/Havana", "2026-03-08", "2026-03-08T05:00:00.000Z"],
  ])(
    "starts %s %s at the end of a DST gap that skips midnight",
    (zone, key, iso) => {
      const start = epochDayStart(epochDayOfKey(key), zone)
      expect(start.toISOString()).toBe(iso)
      expect(dayKey(start, zone)).toBe(key)
      expect(dayKey(new Date(start.getTime() - 1), zone)).not.toBe(key)
    },
  )

  it("names weekdays with Sunday as 0", () => {
    expect(weekdayOfEpochDay(0)).toBe(4)
    expect(weekdayOfEpochDay(epochDayOfKey("2026-10-04"))).toBe(0)
    expect(weekdayOfEpochDay(epochDayOfKey("2026-10-05"))).toBe(1)
    expect(weekdayOfEpochDay(-4)).toBe(0)
    expect(weekdayOfEpochDay(-5)).toBe(6)
  })

  it.each([0, 1, 2, 3, 4, 5, 6] as const)(
    "aligns week starts to firstWeekday %i",
    (firstWeekday) => {
      for (let day = -20; day < 20; day += 1) {
        const start = weekStartEpochDay(day, firstWeekday)
        expect(weekdayOfEpochDay(start)).toBe(firstWeekday)
        expect(day - start).toBeGreaterThanOrEqual(0)
        expect(day - start).toBeLessThan(7)
      }
    },
  )
})
