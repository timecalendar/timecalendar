// Pure overlap-layout engine — salvaged and OWNED regardless of the renderer
// (ADR 019's salvage mandate; D4). Ported + validated in the Phase-04 spike from
// the Flutter `EventForUI.listFromEvents` unbounded-column packing. It packs a
// set of time intervals into the minimum number of columns such that no two
// overlapping intervals share a column, then assigns each a fractional
// horizontal span [startX, endX] over the cluster width.
//
// Pure: no React, no calendar-kit, no @/db, no t(). The day/week screen renders
// through calendar-kit (which has its own internal layout), so this engine's
// first RENDERING consumer is the agenda follow-up + the home today-grid; its
// first TESTED consumer is this ship's suite. It is the de-risking insurance
// behind the seam — if calendar-kit is ever dropped (ADR 019 revisit), this +
// a Reanimated grid become the renderer behind the unchanged wrapper.

export interface Interval {
  startsAt: Date
  endsAt: Date
}

export interface Placed<T extends Interval> {
  item: T
  /** 0-based column index assigned to the item. */
  column: number
  /** Total columns in the item's overlap cluster. */
  columns: number
  /** Fractional left edge over the cluster width, in [0, 1]. */
  startX: number
  /** Fractional right edge over the cluster width, in [0, 1]. */
  endX: number
}

// Two intervals overlap when each starts strictly before the other ends; this
// engine encodes that directly via the per-column end times below. Back-to-back
// intervals (a.endsAt === b.startsAt) do NOT overlap — they may share a column.
export function layoutOverlaps<T extends Interval>(items: T[]): Placed<T>[] {
  // Stable chronological sort (earlier start first; longer first on a tie) so
  // column assignment is deterministic.
  const sorted = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const byStart = a.item.startsAt.getTime() - b.item.startsAt.getTime()
      if (byStart !== 0) return byStart
      const byEnd = a.item.endsAt.getTime() - b.item.endsAt.getTime()
      if (byEnd !== 0) return byEnd
      return a.index - b.index
    })
    .map((entry) => entry.item)

  // Greedily place each item in the first column whose last occupant has ended
  // (a freed column is reused); otherwise open a new column. `columnEnds[c]` is
  // the end time of the latest item placed in column c.
  const columnEnds: Date[] = []
  const assigned: { item: T; column: number }[] = []
  // Track the running cluster: a maximal run of items connected by overlap. A
  // cluster ends when an item starts at or after every active column's end.
  let clusterStart = 0
  const clusters: { start: number; end: number; columns: number }[] = []
  let clusterMaxEnd: Date | null = null

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]!

    // A new cluster begins when this item doesn't overlap the running cluster's
    // maximal extent — flush the previous cluster's column count.
    if (clusterMaxEnd !== null && item.startsAt >= clusterMaxEnd) {
      clusters.push({
        start: clusterStart,
        end: i,
        columns: columnEnds.length,
      })
      columnEnds.length = 0
      clusterStart = i
      clusterMaxEnd = null
    }

    let column = columnEnds.findIndex((end) => end <= item.startsAt)
    if (column === -1) {
      column = columnEnds.length
      columnEnds.push(item.endsAt)
    } else {
      columnEnds[column] = item.endsAt
    }

    assigned.push({ item, column })
    if (clusterMaxEnd === null || item.endsAt > clusterMaxEnd) {
      clusterMaxEnd = item.endsAt
    }
  }

  if (sorted.length > 0) {
    clusters.push({
      start: clusterStart,
      end: sorted.length,
      columns: columnEnds.length,
    })
  }

  // Map each assigned item to its cluster's column count for its fractional span.
  return assigned.map((entry, i) => {
    const cluster = clusters.find((c) => i >= c.start && i < c.end)!
    const columns = cluster.columns
    const width = 1 / columns
    return {
      item: entry.item,
      column: entry.column,
      columns,
      startX: entry.column * width,
      endX: (entry.column + 1) * width,
    }
  })
}
