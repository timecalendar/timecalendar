export type SegmentPosition = "first" | "middle" | "last" | "single"

export function segmentPosition(index: number, count: number): SegmentPosition {
  if (count === 1) return "single"
  if (index === 0) return "first"
  return index === count - 1 ? "last" : "middle"
}
