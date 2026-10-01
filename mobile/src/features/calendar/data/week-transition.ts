import { startOfDayInZone } from "./day-key"
import type { FirstWeekday } from "./week"
import { startOfWeekInZone } from "./week"

export type CalendarTimelineMode = "day" | "week"

export function normalizeTimelineAnchor(
  date: Date,
  mode: CalendarTimelineMode,
  zone: string,
  firstWeekday: FirstWeekday,
): Date {
  return mode === "day"
    ? startOfDayInZone(date, zone)
    : startOfWeekInZone(date, zone, firstWeekday)
}
