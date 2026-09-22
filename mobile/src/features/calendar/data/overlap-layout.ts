export interface OverlapIdentity {
  source: string
  uid: string
}

export interface Interval {
  identity: OverlapIdentity
  startsAt: Date
  endsAt: Date
}

export interface Placed<T extends Interval> {
  item: T
  column: number
  columns: number
  startX: number
  endX: number
}

export function overlapIdentityKey(identity: OverlapIdentity): string {
  return `${identity.source.length}:${identity.source}${identity.uid}`
}

function compareOrdinal(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function compareIntervals(left: Interval, right: Interval): number {
  const byStart = left.startsAt.getTime() - right.startsAt.getTime()
  if (byStart !== 0) return byStart
  const byEnd = left.endsAt.getTime() - right.endsAt.getTime()
  if (byEnd !== 0) return byEnd
  const bySource = compareOrdinal(left.identity.source, right.identity.source)
  return bySource !== 0
    ? bySource
    : compareOrdinal(left.identity.uid, right.identity.uid)
}

function validate<T extends Interval>(items: readonly T[]): void {
  const identities = new Set<string>()
  for (const item of items) {
    const start = item.startsAt.getTime()
    const end = item.endsAt.getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new RangeError("Overlap layout requires finite positive intervals")
    }
    const key = overlapIdentityKey(item.identity)
    if (identities.has(key)) {
      throw new RangeError("Overlap layout identities must be unique")
    }
    identities.add(key)
  }
}

// Positive intervals overlap only with positive area. An end instant therefore
// frees its column for another interval beginning at that same instant.
export function layoutOverlaps<T extends Interval>(
  items: readonly T[],
): ReadonlyMap<string, Placed<T>> {
  validate(items)
  const sorted = [...items].sort(compareIntervals)
  const result = new Map<string, Placed<T>>()
  let cluster: { item: T; column: number }[] = []
  let columnEnds: number[] = []
  let clusterMaxEnd = Number.NEGATIVE_INFINITY

  const finishCluster = () => {
    const columns = columnEnds.length
    for (const entry of cluster) {
      result.set(overlapIdentityKey(entry.item.identity), {
        item: entry.item,
        column: entry.column,
        columns,
        startX: entry.column / columns,
        endX: (entry.column + 1) / columns,
      })
    }
    cluster = []
    columnEnds = []
    clusterMaxEnd = Number.NEGATIVE_INFINITY
  }

  for (const item of sorted) {
    const start = item.startsAt.getTime()
    const end = item.endsAt.getTime()
    if (cluster.length > 0 && start >= clusterMaxEnd) finishCluster()

    let column = columnEnds.findIndex((columnEnd) => columnEnd <= start)
    if (column === -1) {
      column = columnEnds.length
      columnEnds.push(end)
    } else {
      columnEnds[column] = end
    }
    cluster.push({ item, column })
    clusterMaxEnd = Math.max(clusterMaxEnd, end)
  }
  if (cluster.length > 0) finishCluster()
  return result
}
