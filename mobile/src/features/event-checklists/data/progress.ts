import { useMemo } from "react"

import { checklistItems, db, inArray, sql, useLiveQuery } from "@/db"

export interface ChecklistProgress {
  completed: number
  total: number
  isComplete: boolean
}

export type ChecklistProgressMap = ReadonlyMap<string, ChecklistProgress>

interface ChecklistProgressRow {
  eventUid: string
  isChecked: boolean
}

export function aggregateChecklistProgress(
  rows: readonly ChecklistProgressRow[],
): ChecklistProgressMap {
  const counts = new Map<string, { completed: number; total: number }>()

  for (const row of rows) {
    const current = counts.get(row.eventUid) ?? { completed: 0, total: 0 }
    current.total += 1
    if (row.isChecked) current.completed += 1
    counts.set(row.eventUid, current)
  }

  return new Map(
    [...counts].map(([eventUid, progress]) => [
      eventUid,
      {
        ...progress,
        isComplete: progress.total > 0 && progress.completed === progress.total,
      },
    ]),
  )
}

function normalizeEventUids(eventUids: readonly string[]): string[] {
  return [...new Set(eventUids.filter((uid) => uid.length > 0))].sort()
}

/** One reactive, set-oriented checklist read for a whole summary screen. */
export function useChecklistProgress(
  eventUids: readonly string[],
): ChecklistProgressMap {
  const normalizedUids = useMemo(
    () => normalizeEventUids(eventUids),
    [eventUids],
  )
  const dependencyKey = normalizedUids.join("\u0000")
  const predicate =
    normalizedUids.length === 0
      ? sql`0`
      : inArray(checklistItems.eventUid, normalizedUids)
  const { data } = useLiveQuery(
    db
      .select({
        eventUid: checklistItems.eventUid,
        isChecked: checklistItems.isChecked,
      })
      .from(checklistItems)
      .where(predicate),
    [dependencyKey],
  )

  return useMemo(() => aggregateChecklistProgress(data), [data])
}
