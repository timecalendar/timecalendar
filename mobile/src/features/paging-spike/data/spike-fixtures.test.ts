import {
  isoDate,
  pageDays,
  pageEvents,
  pageIndexOfDay,
  pageStartDay,
  todayEpochDay,
  weekStartDay,
} from "./spike-fixtures"

const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000

describe("paging spike fixtures", () => {
  it("indexes week pages by their Monday", () => {
    expect(weekStartDay(day("2026-10-01"))).toBe(day("2026-09-28"))
    expect(weekStartDay(day("1969-12-28"))).toBe(day("1969-12-22"))
    expect(isoDate(pageStartDay(pageIndexOfDay(day("2026-10-04"))))).toBe(
      "2026-09-28",
    )
  })

  it("labels a page's seven days and marks today", () => {
    const page = pageIndexOfDay(day("2026-10-01"))
    const days = pageDays(page, day("2026-10-01"))

    expect(days.map(({ weekday }) => weekday)).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ])
    expect(days.map(({ dayOfMonth }) => dayOfMonth)).toEqual([
      28, 29, 30, 1, 2, 3, 4,
    ])
    expect(days.filter(({ isToday }) => isToday)).toHaveLength(1)
  })

  it("builds a dense, deterministic weekday-only fixture week", () => {
    const events = pageEvents(pageIndexOfDay(day("2026-10-05")))

    expect(events).toEqual(pageEvents(pageIndexOfDay(day("2026-10-05"))))
    expect(events.length).toBeGreaterThanOrEqual(14)
    expect(events.every(({ column }) => column < 5)).toBe(true)
    expect(events.filter(({ laneCount }) => laneCount === 2)).toHaveLength(2)
  })

  it("reads today in local time", () => {
    const now = new Date(2026, 9, 1, 23, 30)

    expect(isoDate(todayEpochDay(now))).toBe("2026-10-01")
    expect(todayEpochDay()).toBeGreaterThan(day("2026-01-01"))
  })
})
