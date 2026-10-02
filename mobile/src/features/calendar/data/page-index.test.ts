import { addDaysInZone, dayKey, startOfDayInZone } from "./day-key"
import { epochDayKey, epochDayOfKey } from "./epoch-day"
import {
  convertPageIndex,
  pageAnchor,
  pageColumns,
  pageDays,
  pageIndexOfDay,
  pageIndexOfInstant,
  pageKey,
  type PageSpace,
  pageStartDay,
} from "./page-index"
import { type FirstWeekday, shiftWeekInZone, weekColumns } from "./week"
import { normalizeTimelineAnchor } from "./week-transition"

const MONDAY_WEEKS: PageSpace = { mode: "week", firstWeekday: 1 }
const DAYS: PageSpace = { mode: "day", firstWeekday: 1 }
const ZONES = [
  "UTC",
  "Europe/Paris",
  "America/New_York",
  "Australia/Lord_Howe",
  "Pacific/Kiritimati",
]
const FIRST_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const

function shiftedAnchor(
  anchor: Date,
  mode: PageSpace["mode"],
  direction: -1 | 1,
  zone: string,
  firstWeekday: FirstWeekday,
): Date {
  return mode === "day"
    ? addDaysInZone(startOfDayInZone(anchor, zone), direction, zone)
    : shiftWeekInZone(anchor, direction, zone, firstWeekday)
}

function anchorColumns(
  anchor: Date,
  mode: PageSpace["mode"],
  zone: string,
  firstWeekday: FirstWeekday,
  showWeekends: boolean,
) {
  if (mode === "week") {
    return weekColumns(anchor, zone, firstWeekday, showWeekends)
  }
  const key = dayKey(anchor, zone)
  return weekColumns(anchor, zone, firstWeekday, true).filter(
    (column) => column.key === key,
  )
}

describe("page identity", () => {
  it("indexes day pages by EpochDay", () => {
    const day = epochDayOfKey("2026-10-01")
    expect(pageIndexOfDay(DAYS, day)).toBe(day)
    expect(pageStartDay(DAYS, day)).toBe(day)
    expect(pageKey(DAYS, day)).toBe(`day:${day}`)
    expect(pageDays(DAYS, day)).toEqual([day])
  })

  it("indexes week pages by consecutive ordinals starting on firstWeekday", () => {
    const thursday = epochDayOfKey("2026-10-01")
    const index = pageIndexOfDay(MONDAY_WEEKS, thursday)
    expect(epochDayKey(pageStartDay(MONDAY_WEEKS, index))).toBe("2026-09-28")
    expect(epochDayKey(pageStartDay(MONDAY_WEEKS, index + 1))).toBe(
      "2026-10-05",
    )
    expect(epochDayKey(pageStartDay(MONDAY_WEEKS, index - 1))).toBe(
      "2026-09-21",
    )
    expect(pageKey(MONDAY_WEEKS, index)).toBe(
      `week:${epochDayOfKey("2026-09-28")}`,
    )
    expect(pageDays(MONDAY_WEEKS, index).map(epochDayKey)).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ])
  })

  it.each(FIRST_WEEKDAYS)(
    "maps every day of a week to the same page for firstWeekday %i, before and after 1970",
    (firstWeekday) => {
      const space: PageSpace = { mode: "week", firstWeekday }
      for (let day = -30; day < 30; day += 1) {
        const index = pageIndexOfDay(space, day)
        const start = pageStartDay(space, index)
        expect(day - start).toBeGreaterThanOrEqual(0)
        expect(day - start).toBeLessThan(7)
        expect(new Date(start * 86_400_000).getUTCDay()).toBe(firstWeekday)
        expect(pageIndexOfDay(space, start)).toBe(index)
        expect(pageStartDay(space, index + 1) - start).toBe(7)
      }
    },
  )

  it("keeps the page key distinct per firstWeekday", () => {
    const day = epochDayOfKey("2026-10-01")
    const keys = FIRST_WEEKDAYS.map((firstWeekday) => {
      const space: PageSpace = { mode: "week", firstWeekday }
      return pageKey(space, pageIndexOfDay(space, day))
    })
    expect(new Set(keys).size).toBe(7)
  })

  it("indexes an instant on the display zone's day", () => {
    const instant = new Date("2026-10-04T23:30:00.000Z")
    expect(epochDayKey(pageIndexOfInstant(DAYS, instant, "UTC"))).toBe(
      "2026-10-04",
    )
    expect(
      epochDayKey(
        pageStartDay(
          MONDAY_WEEKS,
          pageIndexOfInstant(MONDAY_WEEKS, instant, "Europe/Paris"),
        ),
      ),
    ).toBe("2026-10-05")
  })

  it("converts between modes through the page's first day", () => {
    const weekIndex = pageIndexOfDay(MONDAY_WEEKS, epochDayOfKey("2026-10-01"))
    expect(epochDayKey(convertPageIndex(MONDAY_WEEKS, weekIndex, DAYS))).toBe(
      "2026-09-28",
    )
    expect(
      convertPageIndex(DAYS, epochDayOfKey("2026-10-04"), MONDAY_WEEKS),
    ).toBe(weekIndex)
  })
})

describe("page stepping and columns", () => {
  const zone = "Europe/Paris"
  const paris = (space: PageSpace, iso: string) =>
    pageIndexOfInstant(space, new Date(iso), zone)

  it.each([
    ["day", 1, "2027-01-01"],
    ["day", -1, "2026-12-30"],
    ["week", 1, "2027-01-04"],
    ["week", -1, "2026-12-21"],
  ] as const)(
    "steps %s pages by their civil unit",
    (mode, direction, expected) => {
      const space: PageSpace = { mode, firstWeekday: 1 }
      const index = paris(space, "2026-12-31T12:00:00.000Z")
      expect(dayKey(pageAnchor(space, index + direction, zone), zone)).toBe(
        expected,
      )
    },
  )

  it("steps across a DST boundary without fixed-duration drift", () => {
    const saturday = paris(DAYS, "2026-03-28T12:00:00.000Z")
    const sunday = pageAnchor(DAYS, saturday + 1, zone)
    const mondayDate = pageAnchor(DAYS, saturday + 2, zone)
    expect(dayKey(sunday, zone)).toBe("2026-03-29")
    expect(dayKey(mondayDate, zone)).toBe("2026-03-30")
    expect(mondayDate.getTime() - sunday.getTime()).toBe(23 * 60 * 60 * 1000)
  })

  it("keeps weekend days visible in day mode when weekends are hidden", () => {
    const friday = paris(DAYS, "2026-09-18T12:00:00.000Z")
    expect(pageColumns(DAYS, friday, zone, false)).toHaveLength(1)
    expect(pageColumns(DAYS, friday + 1, zone, false)[0]?.key).toBe(
      "2026-09-19",
    )
    expect(pageColumns(DAYS, friday + 2, zone, false)[0]?.key).toBe(
      "2026-09-20",
    )
  })

  it("applies weekend visibility only to week columns", () => {
    const index = paris(MONDAY_WEEKS, "2026-09-16T12:00:00.000Z")
    expect(pageColumns(MONDAY_WEEKS, index, zone, true)).toHaveLength(7)
    expect(pageColumns(MONDAY_WEEKS, index, zone, false)).toHaveLength(5)
  })
})

describe("pages in a zone whose DST gap skips midnight", () => {
  it("advance one civil day per page and start each page on its own day", () => {
    const zone = "America/Santiago"
    const index = pageIndexOfDay(DAYS, epochDayOfKey("2026-09-05"))
    const keys = [0, 1, 2].map((offset) =>
      dayKey(pageAnchor(DAYS, index + offset, zone), zone),
    )
    expect(keys).toEqual(["2026-09-05", "2026-09-06", "2026-09-07"])
    expect(
      pageColumns(
        MONDAY_WEEKS,
        pageIndexOfDay(MONDAY_WEEKS, index),
        zone,
        true,
      ).map((column) => dayKey(column.date, zone)),
    ).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ])
  })
})

describe("page anchors and columns match the Date-based timeline helpers", () => {
  const instants = [
    "2026-03-29T00:30:00.000Z",
    "2026-03-08T07:00:00.000Z",
    "2026-10-25T01:30:00.000Z",
    "2026-11-01T06:00:00.000Z",
    "2026-10-04T15:00:00.000Z",
    "2026-12-31T23:59:59.999Z",
  ].map((iso) => new Date(iso))

  it.each(ZONES)("in %s", (zone) => {
    for (const firstWeekday of FIRST_WEEKDAYS as readonly FirstWeekday[]) {
      for (const mode of ["day", "week"] as const) {
        const space: PageSpace = { mode, firstWeekday }
        for (const instant of instants) {
          const index = pageIndexOfInstant(space, instant, zone)
          const expectedAnchor = normalizeTimelineAnchor(
            instant,
            mode,
            zone,
            firstWeekday,
          )
          expect(pageAnchor(space, index, zone)).toEqual(expectedAnchor)
          expect(pageAnchor(space, index + 1, zone)).toEqual(
            shiftedAnchor(expectedAnchor, mode, 1, zone, firstWeekday),
          )
          expect(pageAnchor(space, index - 1, zone)).toEqual(
            shiftedAnchor(expectedAnchor, mode, -1, zone, firstWeekday),
          )
          expect(dayKey(pageAnchor(space, index, zone), zone)).toBe(
            epochDayKey(pageStartDay(space, index)),
          )
          for (const showWeekends of [true, false]) {
            expect(pageColumns(space, index, zone, showWeekends)).toEqual(
              anchorColumns(
                expectedAnchor,
                mode,
                zone,
                firstWeekday,
                showWeekends,
              ),
            )
          }
        }
      }
    }
  })
})
