import { type Interval, layoutOverlaps } from "./overlap-layout"

// Build an interval from two "HH:MM" times on a fixed day (UTC, irrelevant to
// the pure math — only relative ordering matters).
function at(start: string, end: string): Interval {
  return {
    startsAt: new Date(`2026-06-16T${start}:00.000Z`),
    endsAt: new Date(`2026-06-16T${end}:00.000Z`),
  }
}

describe("layoutOverlaps", () => {
  it("returns an empty array for no items", () => {
    expect(layoutOverlaps([])).toEqual([])
  })

  it("gives a single item one full-width column", () => {
    const [placed] = layoutOverlaps([at("09:00", "10:00")])
    expect(placed).toMatchObject({ column: 0, columns: 1, startX: 0, endX: 1 })
  })

  it("disjoint intervals share one column at full width", () => {
    const placed = layoutOverlaps([at("09:00", "10:00"), at("10:00", "11:00")])
    expect(placed.every((p) => p.columns === 1)).toBe(true)
    expect(placed.every((p) => p.startX === 0 && p.endX === 1)).toBe(true)
  })

  it("treats back-to-back intervals as non-overlapping (shared column)", () => {
    const placed = layoutOverlaps([at("09:00", "10:00"), at("10:00", "11:00")])
    expect(placed.map((p) => p.column)).toEqual([0, 0])
  })

  it("splits a three-way overlap into exact thirds", () => {
    const placed = layoutOverlaps([
      at("09:00", "12:00"),
      at("09:30", "12:00"),
      at("10:00", "12:00"),
    ])
    expect(placed.every((p) => p.columns === 3)).toBe(true)
    expect(placed.map((p) => p.column)).toEqual([0, 1, 2])
    expect(placed.map((p) => Number((p.endX - p.startX).toFixed(5)))).toEqual(
      [1 / 3, 1 / 3, 1 / 3].map((w) => Number(w.toFixed(5))),
    )
  })

  it("packs a five-way cluster into five even columns", () => {
    const placed = layoutOverlaps([
      at("09:00", "13:00"),
      at("09:15", "13:00"),
      at("09:30", "13:00"),
      at("09:45", "13:00"),
      at("10:00", "13:00"),
    ])
    expect(placed.every((p) => p.columns === 5)).toBe(true)
    expect(placed.map((p) => p.column)).toEqual([0, 1, 2, 3, 4])
    expect(placed.every((p) => Number((p.endX - p.startX).toFixed(5)) === 0.2))
  })

  it("reuses a freed column within a cluster", () => {
    // A spans the whole window; B then C are stacked in column 1 (B frees it
    // before C starts), so the cluster needs only 2 columns, not 3.
    const placed = layoutOverlaps([
      at("09:00", "12:00"), // A
      at("09:30", "10:30"), // B
      at("10:30", "11:30"), // C — starts when B ends, reuses B's column
    ])
    expect(placed.every((p) => p.columns === 2)).toBe(true)
    expect(placed.map((p) => p.column)).toEqual([0, 1, 1])
  })

  it("sorts chronologically: the earlier-start item gets column 0 regardless of input order", () => {
    const a = { ...at("09:00", "12:00"), id: "a" }
    const b = { ...at("10:00", "12:00"), id: "b" }
    // The output is ordered by start time (the engine's stable sort), so the
    // earlier-start item (a) is first with column 0 for either input order.
    for (const input of [
      [a, b],
      [b, a],
    ]) {
      const placed = layoutOverlaps(input)
      expect(placed.map((p) => p.item.id)).toEqual(["a", "b"])
      expect(placed.map((p) => p.column)).toEqual([0, 1])
    }
  })

  it("breaks ties by end time then by input index for equal starts", () => {
    // Two events share a start; the shorter one sorts first (end-time tie-break),
    // and two fully-identical events fall back to input index — all in one
    // 3-column cluster.
    const longer = { ...at("09:00", "12:00"), id: "longer" }
    const shorter = { ...at("09:00", "10:00"), id: "shorter" }
    const dupeA = { ...at("09:00", "12:00"), id: "dupeA" }
    const placed = layoutOverlaps([longer, shorter, dupeA])
    // shorter (earliest end) first, then longer/dupeA by input index.
    expect(placed.map((p) => p.item.id)).toEqual(["shorter", "longer", "dupeA"])
    expect(placed.every((p) => p.columns === 3)).toBe(true)
  })

  it("separates non-overlapping clusters", () => {
    const placed = layoutOverlaps([
      at("09:00", "10:00"),
      at("09:30", "10:00"),
      at("14:00", "15:00"),
    ])
    // First cluster: 2 columns. Second cluster: 1 column.
    expect(placed[0]!.columns).toBe(2)
    expect(placed[1]!.columns).toBe(2)
    expect(placed[2]!.columns).toBe(1)
  })
})
