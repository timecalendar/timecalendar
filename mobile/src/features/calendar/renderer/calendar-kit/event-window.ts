import { type DateRange } from "@/features/calendar/data"

const BUFFER_MONTHS = 2
const QUARTER_MONTHS = 3

export function calendarTimelineEventWindowKey(date: Date): number {
  const start = new Date(date)
  start.setMonth(
    Math.floor(start.getMonth() / QUARTER_MONTHS) * QUARTER_MONTHS,
    1,
  )
  start.setHours(0, 0, 0, 0)
  return start.getTime()
}

export const quarterStartMs = calendarTimelineEventWindowKey

export function quarterWindow(bucketStartMs: number): DateRange {
  const from = new Date(bucketStartMs)
  from.setMonth(from.getMonth() - BUFFER_MONTHS)
  const to = new Date(bucketStartMs)
  to.setMonth(to.getMonth() + QUARTER_MONTHS + BUFFER_MONTHS)
  return { from, to }
}

export function calendarTimelineEventWindow(date: Date): DateRange {
  return quarterWindow(calendarTimelineEventWindowKey(date))
}
