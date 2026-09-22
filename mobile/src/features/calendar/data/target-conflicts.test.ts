import {
  planTargetConflicts,
  type TargetConflictItem,
} from "./target-conflicts"

function item(
  key: string,
  startMinute: number,
  endMinute: number,
  startX = 0,
  endX = 1,
): TargetConflictItem {
  return {
    key,
    startMinute,
    endMinute,
    shape: startMinute === endMinute ? "point" : "interval",
    startX,
    endX,
  }
}

const plan = (
  items: readonly TargetConflictItem[],
  platform: "ios" | "android" = "ios",
) => planTargetConflicts({ items, pixelsPerHour: 60, platform })

describe("planTargetConflicts", () => {
  it("keeps an ordinary target direct and clamps edge points inside the day", () => {
    expect(plan([item("ordinary", 60, 120)])).toEqual([
      {
        key: "ordinary",
        items: [item("ordinary", 60, 120)],
        rectangle: { left: 0, right: 1, top: 60, bottom: 120 },
      },
    ])
    expect(plan([item("start", 0, 0), item("end", 1440, 1440)])).toEqual([
      expect.objectContaining({
        rectangle: expect.objectContaining({ top: 0 }),
      }),
      expect.objectContaining({
        rectangle: expect.objectContaining({ bottom: 1440 }),
      }),
    ])
  })

  it("connects chained point, tiny, and ordinary conflicts without a count threshold", () => {
    expect(
      plan([
        item("ordinary", 30, 60),
        item("tiny", 60, 62),
        item("point", 80, 80),
      ]).map((component) => component.items.map(({ key }) => key)),
    ).toEqual([["ordinary", "tiny", "point"]])
  })

  it("treats horizontal and vertical boundary touch as non-conflicting", () => {
    expect(
      plan([item("left", 60, 120, 0, 0.5), item("right", 60, 120, 0.5, 1)]),
    ).toHaveLength(2)
    expect(plan([item("early", 60, 104), item("late", 104, 148)])).toHaveLength(
      2,
    )
  })

  it("uses Android minimum geometry and returns stable component ordering", () => {
    const items = [
      item("z", 100, 101),
      item("a", 100, 101),
      item("short", 100, 100),
      item("later", 300, 360),
    ]
    const forward = plan(items, "android")
    const reverse = plan([...items].reverse(), "android")
    expect(reverse).toEqual(forward)
    expect(forward.map(({ key }) => key)).toEqual(["short|a|z", "later"])
    expect(
      forward[0]!.rectangle.bottom - forward[0]!.rectangle.top,
    ).toBeGreaterThanOrEqual(48)
  })

  it("keeps equivalent entries stable", () => {
    const duplicate = item("same", 100, 101)
    expect(plan([duplicate, { ...duplicate }])[0]!.items).toHaveLength(2)
  })
})
