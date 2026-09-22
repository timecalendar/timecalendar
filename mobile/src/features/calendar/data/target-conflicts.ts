import {
  eventInteractionGeometry,
  eventVisualGeometry,
} from "./timeline-geometry"

export interface TargetConflictItem {
  key: string
  startMinute: number
  endMinute: number
  shape: "point" | "interval"
  startX: number
  endX: number
}

export interface TargetRectangle {
  left: number
  right: number
  top: number
  bottom: number
}

export interface TargetConflictComponent<T extends TargetConflictItem> {
  key: string
  items: readonly T[]
  rectangle: TargetRectangle
}

function compareItems(left: TargetConflictItem, right: TargetConflictItem) {
  const byStart = left.startMinute - right.startMinute
  if (byStart !== 0) return byStart
  const byEnd = left.endMinute - right.endMinute
  if (byEnd !== 0) return byEnd
  return left.key < right.key ? -1 : left.key > right.key ? 1 : 0
}

function intersects(left: TargetRectangle, right: TargetRectangle) {
  return (
    left.left < right.right &&
    right.left < left.right &&
    left.top < right.bottom &&
    right.top < left.bottom
  )
}

export function planTargetConflicts<T extends TargetConflictItem>(input: {
  items: readonly T[]
  pixelsPerHour: number
  platform: "ios" | "android"
}): readonly TargetConflictComponent<T>[] {
  const dayHeight = 24 * input.pixelsPerHour
  const entries = [...input.items].sort(compareItems).map((item) => {
    const vertical = eventInteractionGeometry({
      visual: eventVisualGeometry({
        shape: item.shape,
        startMinute: item.startMinute,
        endMinute: item.endMinute,
        pixelsPerHour: input.pixelsPerHour,
      }),
      dayHeight,
      platform: input.platform,
    })
    return {
      item,
      rectangle: {
        left: item.startX,
        right: item.endX,
        top: vertical.top,
        bottom: vertical.top + vertical.height,
      },
    }
  })
  const seen = new Set<number>()
  const components: TargetConflictComponent<T>[] = []

  for (let root = 0; root < entries.length; root += 1) {
    if (seen.has(root)) continue
    seen.add(root)
    const pending = [root]
    const members: typeof entries = []
    while (pending.length > 0) {
      const current = pending.shift()!
      const entry = entries[current]!
      members.push(entry)
      for (let candidate = 0; candidate < entries.length; candidate += 1) {
        if (
          !seen.has(candidate) &&
          intersects(entry.rectangle, entries[candidate]!.rectangle)
        ) {
          seen.add(candidate)
          pending.push(candidate)
        }
      }
    }
    const items = members.map(({ item }) => item).sort(compareItems)
    components.push({
      key: items.map(({ key }) => key).join("|"),
      items,
      rectangle: {
        left: Math.min(...members.map(({ rectangle }) => rectangle.left)),
        right: Math.max(...members.map(({ rectangle }) => rectangle.right)),
        top: Math.min(...members.map(({ rectangle }) => rectangle.top)),
        bottom: Math.max(...members.map(({ rectangle }) => rectangle.bottom)),
      },
    })
  }
  return components
}
