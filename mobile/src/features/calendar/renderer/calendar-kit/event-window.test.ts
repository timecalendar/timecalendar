import { quarterStartMs, quarterWindow } from "./event-window"

describe("quarterStartMs", () => {
  it("snaps any day to the local-midnight first day of its calendar quarter", () => {
    expect(quarterStartMs(new Date(2026, 1, 14, 9, 30))).toBe(
      new Date(2026, 0, 1).getTime(),
    )
    expect(quarterStartMs(new Date(2026, 5, 30, 23, 59))).toBe(
      new Date(2026, 3, 1).getTime(),
    )
    expect(quarterStartMs(new Date(2026, 8, 1, 0, 0))).toBe(
      new Date(2026, 6, 1).getTime(),
    )
    expect(quarterStartMs(new Date(2026, 11, 31, 12, 0))).toBe(
      new Date(2026, 9, 1).getTime(),
    )
  })

  it("is stable across every day in a quarter", () => {
    const aug1 = quarterStartMs(new Date(2026, 7, 1))
    const sep30 = quarterStartMs(new Date(2026, 8, 30))
    const jul15 = quarterStartMs(new Date(2026, 6, 15))
    expect(aug1).toBe(sep30)
    expect(aug1).toBe(jul15)
  })

  it("changes across a quarter boundary", () => {
    expect(quarterStartMs(new Date(2026, 9, 1))).not.toBe(
      quarterStartMs(new Date(2026, 8, 30)),
    )
  })
})

describe("quarterWindow", () => {
  it("brackets the quarter with a two-month buffer on each side", () => {
    const { from, to } = quarterWindow(new Date(2026, 6, 1).getTime())
    expect(from.getTime()).toBe(new Date(2026, 4, 1).getTime())
    expect(to.getTime()).toBe(new Date(2026, 11, 1).getTime())
  })

  it("rolls the buffer across year boundaries", () => {
    const q1 = quarterWindow(new Date(2026, 0, 1).getTime())
    expect(q1.from.getTime()).toBe(new Date(2025, 10, 1).getTime())
    expect(q1.to.getTime()).toBe(new Date(2026, 5, 1).getTime())
    const q4 = quarterWindow(new Date(2026, 9, 1).getTime())
    expect(q4.from.getTime()).toBe(new Date(2026, 7, 1).getTime())
    expect(q4.to.getTime()).toBe(new Date(2027, 2, 1).getTime())
  })

  it("spans seven months", () => {
    const { from, to } = quarterWindow(new Date(2026, 6, 1).getTime())
    expect(
      (to.getFullYear() - from.getFullYear()) * 12 +
        (to.getMonth() - from.getMonth()),
    ).toBe(7)
  })
})
