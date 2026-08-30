import type { ActivityLog } from "@/features/activity/data"

type CalendarLogEvent = ActivityLog["change"]["newItems"][number]
type CalendarChangedItem = ActivityLog["change"]["changedItems"][number]

interface ActivityItemBase {
  key: string
}

interface NewActivityItem extends ActivityItemBase {
  kind: "new"
  event: CalendarLogEvent
}

interface ChangedActivityItem extends ActivityItemBase {
  kind: "changed"
  change: CalendarChangedItem
}

interface CancelledActivityItem extends ActivityItemBase {
  kind: "cancelled"
  event: CalendarLogEvent
}

export type ActivityItem =
  | NewActivityItem
  | ChangedActivityItem
  | CancelledActivityItem

export interface ActivitySection {
  log: ActivityLog
  data: ActivityItem[]
}

export function buildActivitySections(logs: ActivityLog[]): ActivitySection[] {
  return [...logs]
    .sort(
      (a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime() ||
        b.id.localeCompare(a.id),
    )
    .flatMap((log) => {
      const data: ActivityItem[] = [
        ...log.change.newItems.map(
          (event): NewActivityItem => ({
            key: `${log.id}:new:${event.uid}`,
            kind: "new",
            event,
          }),
        ),
        ...log.change.changedItems.map(
          (change): ChangedActivityItem => ({
            key: `${log.id}:changed:${change.newItem.uid}`,
            kind: "changed",
            change,
          }),
        ),
        ...log.change.oldItems.map(
          (event): CancelledActivityItem => ({
            key: `${log.id}:cancelled:${event.uid}`,
            kind: "cancelled",
            event,
          }),
        ),
      ]
      return data.length === 0 ? [] : [{ log, data }]
    })
}
