import { useMemo } from "react"

import {
  activityLogs,
  activityState,
  db,
  desc,
  isoToDate,
  useLiveQuery,
} from "@/db"

import { rowToActivityLog } from "./mappers"
import {
  type ActivityLog,
  type ActivityState,
  type ActivityStateRow,
  DEFAULT_ACTIVITY_STATE,
} from "./types"

function activityStateFromRow(
  row: ActivityStateRow | undefined,
): ActivityState {
  if (row === undefined) return DEFAULT_ACTIVITY_STATE
  return {
    lastReadAt: row.lastReadAt === null ? null : isoToDate(row.lastReadAt),
    unreadCount: row.unreadCount,
    lastSuccessfulRefreshAt:
      row.lastSuccessfulRefreshAt === null
        ? null
        : isoToDate(row.lastSuccessfulRefreshAt),
    olderPageCursor: row.olderPageCursor,
    olderPageComplete: row.olderPageComplete,
  }
}

// History and loaded state deliberately share one hook: separate hooks would
// create two live subscriptions over the same Activity table.
export function useActivityLogs(): {
  logs: ActivityLog[]
  loaded: boolean
} {
  const { data, updatedAt } = useLiveQuery(
    db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt), desc(activityLogs.id)),
  )
  const logs = useMemo(
    () =>
      data
        .map(rowToActivityLog)
        .filter((log): log is ActivityLog => log !== null),
    [data],
  )
  return { logs, loaded: updatedAt !== undefined }
}

export function useActivityState(): ActivityState {
  const { data } = useLiveQuery(db.select().from(activityState))
  return useMemo(() => activityStateFromRow(data[0]), [data])
}
