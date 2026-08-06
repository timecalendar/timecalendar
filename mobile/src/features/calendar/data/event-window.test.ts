import { quarterStartMs, quarterWindow } from "./event-window"

describe("quarterStartMs", () => {
  it("snaps any day to the local-midnight first day of its calendar quarter", () => {
    // Q1 Jan–Mar, Q2 Apr–Jun, Q3 Jul–Sep, Q4 Oct–Dec.
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

  it("is STABLE across every day in a quarter (the memo key property)", () => {
    // The whole reason for the helper: two different days in the same quarter must
    // yield the SAME key so the grid's range memo keeps one identity while scrolling.
    const aug1 = quarterStartMs(new Date(2026, 7, 1))
    const sep30 = quarterStartMs(new Date(2026, 8, 30))
    const jul15 = quarterStartMs(new Date(2026, 6, 15))
    expect(aug1).toBe(sep30)
    expect(aug1).toBe(jul15)
  })

  it("changes across a quarter boundary", () => {
    const q3 = quarterStartMs(new Date(2026, 8, 30)) // Sep 30 — Q3
    const q4 = quarterStartMs(new Date(2026, 9, 1)) // Oct 1 — Q4
    expect(q4).not.toBe(q3)
  })
})

describe("quarterWindow", () => {
  it("brackets the quarter with a two-month buffer on each side (half-open)", () => {
    // Q3 2026 (Jul 1 start): from = May 1, to = Dec 1 (exclusive).
    const { from, to } = quarterWindow(new Date(2026, 6, 1).getTime())
    expect(from.getTime()).toBe(new Date(2026, 4, 1).getTime())
    expect(to.getTime()).toBe(new Date(2026, 11, 1).getTime())
  })

  it("rolls the buffer across year boundaries", () => {
    // Q1 2026 (Jan 1 start): from = Nov 1 2025, to = Jun 1 2026.
    const q1 = quarterWindow(new Date(2026, 0, 1).getTime())
    expect(q1.from.getTime()).toBe(new Date(2025, 10, 1).getTime())
    expect(q1.to.getTime()).toBe(new Date(2026, 5, 1).getTime())

    // Q4 2026 (Oct 1 start): from = Aug 1, to = Mar 1 2027.
    const q4 = quarterWindow(new Date(2026, 9, 1).getTime())
    expect(q4.from.getTime()).toBe(new Date(2026, 7, 1).getTime())
    expect(q4.to.getTime()).toBe(new Date(2027, 2, 1).getTime())
  })

  it("spans seven months so the buffer exceeds the grid's pagesPerSide pack reach", () => {
    // The window must be wider than calendar-kit's pre-pack reach around the settled
    // anchor (±(defaultOffset=7 · pagesPerSide=4) ≈ −4wk/+5wk) so a boundary page is
    // never left unfed. Seven whole months (quarter + 2mo each side) clears +35d.
    const { from, to } = quarterWindow(new Date(2026, 6, 1).getTime())
    const months =
      (to.getFullYear() - from.getFullYear()) * 12 +
      (to.getMonth() - from.getMonth())
    expect(months).toBe(7)
  })
})
