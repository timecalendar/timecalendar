import { dayKey } from "./day-key"
import { shiftWeekInZone, startOfWeekInZone, weekColumns } from "./week"

describe("display-zone week arithmetic", () => {
  describe("weekColumns", () => {
    it("returns Monday through Sunday with stable chronological keys", () => {
      const columns = weekColumns(
        new Date("2026-09-16T12:00:00.000Z"),
        "UTC",
        1,
        true,
      )

      expect(columns.map(({ key }) => key)).toEqual([
        "2026-09-14",
        "2026-09-15",
        "2026-09-16",
        "2026-09-17",
        "2026-09-18",
        "2026-09-19",
        "2026-09-20",
      ])
      expect(columns.map(({ weekday }) => weekday)).toEqual([
        1, 2, 3, 4, 5, 6, 0,
      ])
      expect(columns.map(({ isWeekend }) => isWeekend)).toEqual([
        false,
        false,
        false,
        false,
        false,
        true,
        true,
      ])
    })

    it("filters Saturday and Sunday by identity under an alternate policy", () => {
      const columns = weekColumns(
        new Date("2026-09-16T12:00:00.000Z"),
        "UTC",
        0,
        false,
      )

      expect(columns.map(({ key }) => key)).toEqual([
        "2026-09-14",
        "2026-09-15",
        "2026-09-16",
        "2026-09-17",
        "2026-09-18",
      ])
      expect(columns.every(({ isWeekend }) => !isWeekend)).toBe(true)
    })

    it.each([
      ["Europe/Paris", "2026-03-25", "2026-03-23", "2026-03-29"],
      ["Europe/Paris", "2026-10-21", "2026-10-19", "2026-10-25"],
      ["America/New_York", "2026-03-04", "2026-03-02", "2026-03-08"],
      ["America/New_York", "2026-10-28", "2026-10-26", "2026-11-01"],
      ["Pacific/Noumea", "2026-12-30", "2026-12-28", "2027-01-03"],
    ] as const)(
      "keeps consecutive civil keys across the %s boundary week containing %s",
      (zone, anchor, first, last) => {
        const columns = weekColumns(
          new Date(`${anchor}T12:00:00.000Z`),
          zone,
          1,
          true,
        )
        expect(columns).toHaveLength(7)
        expect(columns[0]?.key).toBe(first)
        expect(columns[6]?.key).toBe(last)
        expect(new Set(columns.map(({ key }) => key)).size).toBe(7)
      },
    )
  })

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
