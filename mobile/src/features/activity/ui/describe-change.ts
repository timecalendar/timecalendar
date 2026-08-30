import type { ActivityLog } from "@/features/activity/data"

type CalendarLogEvent = ActivityLog["change"]["newItems"][number]

export type ChangedField = "time" | "location" | "title"

export interface ChangedDifference {
  field: ChangedField
  from: string
  to: string
}

type TimeFormatter = (start: Date, end: Date) => string

function parseRange(event: CalendarLogEvent): [Date, Date] | null {
  const start = new Date(event.startsAt)
  const end = new Date(event.endsAt)
  return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
    ? null
    : [start, end]
}

function defaultTimeFormatter(start: Date, end: Date): string {
  return `${start.toISOString()} – ${end.toISOString()}`
}

export function describeChangedItem(
  previous: CalendarLogEvent,
  next: CalendarLogEvent,
  formatTime: TimeFormatter = defaultTimeFormatter,
): ChangedDifference[] {
  const differences: ChangedDifference[] = []
  if (previous.startsAt !== next.startsAt || previous.endsAt !== next.endsAt) {
    const previousRange = parseRange(previous)
    const nextRange = parseRange(next)
    if (previousRange !== null && nextRange !== null) {
      differences.push({
        field: "time",
        from: formatTime(...previousRange),
        to: formatTime(...nextRange),
      })
    }
  }
  if (previous.location !== next.location) {
    differences.push({
      field: "location",
      from: previous.location ?? "",
      to: next.location ?? "",
    })
  }
  if (previous.title !== next.title) {
    differences.push({
      field: "title",
      from: previous.title,
      to: next.title,
    })
  }
  return differences
}
