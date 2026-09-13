import { dayKey } from "./day-key"
import { shiftWeekInZone, startOfWeekInZone } from "./week"

describe("display-zone week arithmetic", () => {
  it.each([
    ["2026-09-14", 1],
    ["2026-09-15", 1],
    ["2026-09-16", 1],
    ["2026-09-17", 1],
    ["2026-09-18", 1],
    ["2026-09-19", 1],
    ["2026-09-20", 1],
    ["2026-09-16", 0],
    ["2026-09-16", 3],
    ["2026-09-16", 6],
  ] as const)(
    "resolves the policy week containing %s with first weekday %i",
    (key, firstWeekday) => {
      const date = new Date(`${key}T12:00:00.000Z`)
      const result = startOfWeekInZone(date, "UTC", firstWeekday)
      const weekday = new Date(
        `${dayKey(result, "UTC")}T00:00:00.000Z`,
      ).getUTCDay()

      expect(weekday).toBe(firstWeekday)
      if (firstWeekday === 1) expect(dayKey(result, "UTC")).toBe("2026-09-14")
    },
  )

  it.each([
    ["Europe/Paris", "2026-03-23", 1, "2026-03-30"],
    ["Europe/Paris", "2026-10-19", 1, "2026-10-26"],
    ["America/New_York", "2026-03-02", 1, "2026-03-09"],
    ["America/New_York", "2026-10-26", 1, "2026-11-02"],
    ["Asia/Tokyo", "2026-03-23", 1, "2026-03-30"],
    ["Asia/Tokyo", "2026-10-19", 1, "2026-10-26"],
    ["UTC", "2026-12-28", 1, "2027-01-04"],
    ["UTC", "2026-01-26", 1, "2026-02-02"],
  ] as const)(
    "shifts a complete week in %s from %s",
    (zone, key, firstWeekday, expected) => {
      const anchor = startOfWeekInZone(
        new Date(`${key}T12:00:00.000Z`),
        zone,
        firstWeekday,
      )
      const next = shiftWeekInZone(anchor, 1, zone, firstWeekday)

      expect(dayKey(next, zone)).toBe(expected)
      expect(dayKey(shiftWeekInZone(next, -1, zone, firstWeekday), zone)).toBe(
        key,
      )
    },
  )

  it("round trips repeated whole-week shifts", () => {
    const zone = "Europe/Paris"
    let date = startOfWeekInZone(new Date("2026-01-01T12:00:00.000Z"), zone, 1)
    const original = dayKey(date, zone)
    for (let index = 0; index < 80; index += 1) {
      date = shiftWeekInZone(date, 1, zone, 1)
    }
    for (let index = 0; index < 80; index += 1) {
      date = shiftWeekInZone(date, -1, zone, 1)
    }
    expect(dayKey(date, zone)).toBe(original)
  })
})
