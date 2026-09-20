import { planCalendarThreePageRange } from "./range-plan"

describe("planCalendarThreePageRange", () => {
  it("plans exactly previous/current/next Day across month and offset boundaries", () => {
    const plan = planCalendarThreePageRange({
      anchor: new Date("2026-03-29T12:00:00.000Z"),
      mode: "day",
      displayZone: "Europe/Paris",
      firstWeekday: 1,
      showWeekends: false,
    })

    expect(
      plan.pages.map(({ direction, key }) => ({ direction, key })),
    ).toEqual([
      { direction: -1, key: "2026-03-28" },
      { direction: 0, key: "2026-03-29" },
      { direction: 1, key: "2026-03-30" },
    ])
    expect(plan.pages.every((page) => page.columns.length === 1)).toBe(true)
    expect(plan.instant.from.toISOString()).toBe("2026-03-27T23:00:00.000Z")
    expect(plan.instant.to.toISOString()).toBe("2026-03-30T22:00:00.000Z")
    expect(plan.civil).toEqual({
      fromDay: "2026-03-28",
      toDay: "2026-03-31",
    })
  })

  it.each([
    [true, 7],
    [false, 5],
  ] as const)(
    "plans three complete Week pages with showWeekends=%s",
    (showWeekends, columnCount) => {
      const plan = planCalendarThreePageRange({
        anchor: new Date("2026-12-31T12:00:00.000Z"),
        mode: "week",
        displayZone: "UTC",
        firstWeekday: 1,
        showWeekends,
      })
      expect(plan.pages).toHaveLength(3)
      expect(plan.pages.map(({ key }) => key)).toEqual([
        "2026-12-21",
        "2026-12-28",
        "2027-01-04",
      ])
      expect(
        plan.pages.every((page) => page.columns.length === columnCount),
      ).toBe(true)
      expect(plan.instant.from.toISOString()).toBe("2026-12-21T00:00:00.000Z")
      expect(plan.instant.to.toISOString()).toBe("2027-01-11T00:00:00.000Z")
      expect(plan.civil).toEqual({
        fromDay: "2026-12-21",
        toDay: "2027-01-11",
      })
    },
  )

  it("uses the explicit first weekday and stable complete-plan identity", () => {
    const input = {
      anchor: new Date("2026-09-16T12:00:00.000Z"),
      mode: "week" as const,
      displayZone: "UTC",
      firstWeekday: 0 as const,
      showWeekends: true,
    }
    const first = planCalendarThreePageRange(input)
    const second = planCalendarThreePageRange(input)
    expect(first.pages[1].key).toBe("2026-09-13")
    expect(first.key).toBe(second.key)
    expect(first.pages.map(({ key }) => key)).toEqual(
      second.pages.map(({ key }) => key),
    )
  })
})
