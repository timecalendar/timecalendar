import { fromZonedTime, toZonedTime } from "date-fns-tz"

import { type DateRange } from "@/features/calendar/data"

const BUFFER_MONTHS = 2
const QUARTER_MONTHS = 3

// Quarter boundaries are computed on the DISPLAY zone's calendar (timezone
// design D5): the wall-clock proxy from `toZonedTime` carries the zone's
// year/month fields, the quarter arithmetic runs on those fields, and
// `fromZonedTime` re-anchors the result as an instant.
export function calendarTimelineEventWindowKey(
  date: Date,
  zone: string,
): number {
  const start = toZonedTime(date, zone)
  start.setMonth(
    Math.floor(start.getMonth() / QUARTER_MONTHS) * QUARTER_MONTHS,
    1,
  )
  start.setHours(0, 0, 0, 0)
  return fromZonedTime(start, zone).getTime()
}

export const quarterStartMs = calendarTimelineEventWindowKey

export function quarterWindow(bucketStartMs: number, zone: string): DateRange {
  const from = toZonedTime(new Date(bucketStartMs), zone)
  from.setMonth(from.getMonth() - BUFFER_MONTHS)
  const to = toZonedTime(new Date(bucketStartMs), zone)
  to.setMonth(to.getMonth() + QUARTER_MONTHS + BUFFER_MONTHS)
  return { from: fromZonedTime(from, zone), to: fromZonedTime(to, zone) }
}

export function calendarTimelineEventWindow(
  date: Date,
  zone: string,
): DateRange {
  return quarterWindow(calendarTimelineEventWindowKey(date, zone), zone)
}
