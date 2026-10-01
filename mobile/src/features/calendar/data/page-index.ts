import {
  type EpochDay,
  epochDayKey,
  epochDayOfInstant,
  epochDayStart,
  weekdayOfEpochDay,
} from "./epoch-day"
import type { FirstWeekday, WeekColumn } from "./week"
import type { CalendarTimelineMode } from "./week-transition"

/**
 * A page's ordinal position: the EpochDay itself in day mode, the week ordinal
 * in week mode. Consecutive pages differ by exactly one.
 */
export type PageIndex = number

/** Content address of a page: its mode and first civil day. */
export type PageKey = `${CalendarTimelineMode}:${EpochDay}`

export interface PageSpace {
  mode: CalendarTimelineMode
  firstWeekday: FirstWeekday
}

const DAYS_PER_PAGE: Record<CalendarTimelineMode, number> = { day: 1, week: 7 }

// EpochDay 0 is a Thursday, so week starts are the days congruent to
// `firstWeekday - 4` (mod 7).
function weekOrigin(firstWeekday: FirstWeekday): EpochDay {
  return (firstWeekday + 3) % 7
}

export function pageIndexOfDay(space: PageSpace, day: EpochDay): PageIndex {
  return space.mode === "day"
    ? day
    : Math.floor((day - weekOrigin(space.firstWeekday)) / 7)
}

export function pageStartDay(space: PageSpace, index: PageIndex): EpochDay {
  return space.mode === "day"
    ? index
    : index * 7 + weekOrigin(space.firstWeekday)
}

export function pageIndexOfInstant(
  space: PageSpace,
  instant: Date,
  zone: string,
): PageIndex {
  return pageIndexOfDay(space, epochDayOfInstant(instant, zone))
}

/** The display-zone midnight that starts the page. */
export function pageAnchor(
  space: PageSpace,
  index: PageIndex,
  zone: string,
): Date {
  return epochDayStart(pageStartDay(space, index), zone)
}

export function pageKey(space: PageSpace, index: PageIndex): PageKey {
  return `${space.mode}:${pageStartDay(space, index)}`
}

export function pageDays(
  space: PageSpace,
  index: PageIndex,
): readonly EpochDay[] {
  const start = pageStartDay(space, index)
  return Array.from({ length: DAYS_PER_PAGE[space.mode] }, (_, i) => start + i)
}

export function pageColumns(
  space: PageSpace,
  index: PageIndex,
  zone: string,
  showWeekends: boolean,
): WeekColumn[] {
  return pageDays(space, index).flatMap((day): WeekColumn[] => {
    const weekday = weekdayOfEpochDay(day)
    const isWeekend = weekday === 0 || weekday === 6
    if (space.mode === "week" && !showWeekends && isWeekend) return []
    return [
      {
        date: epochDayStart(day, zone),
        key: epochDayKey(day),
        weekday,
        isWeekend,
      },
    ]
  })
}

/** Maps a page to the page of another mode that contains its first day. */
export function convertPageIndex(
  from: PageSpace,
  index: PageIndex,
  to: PageSpace,
): PageIndex {
  return pageIndexOfDay(to, pageStartDay(from, index))
}
