import { addDaysInZone, dayKey } from "./day-key"
import type { FirstWeekday, WeekColumn } from "./week"
import {
  type CalendarTimelineMode,
  normalizeTimelineAnchor,
  shiftTimelineAnchor,
  timelineColumns,
} from "./week-transition"

export type CalendarPageDirection = -1 | 0 | 1

export interface CalendarRangePageV1 {
  version: 1
  direction: CalendarPageDirection
  key: string
  anchor: Date
  columns: readonly WeekColumn[]
}

export interface CalendarThreePageRangeV1 {
  version: 1
  key: string
  mode: CalendarTimelineMode
  displayZone: string
  pages: readonly [
    CalendarRangePageV1,
    CalendarRangePageV1,
    CalendarRangePageV1,
  ]
  instant: { from: Date; to: Date }
  civil: { fromDay: string; toDay: string }
}

const DIRECTIONS = [-1, 0, 1] as const

export function planCalendarThreePageRange(input: {
  anchor: Date
  mode: CalendarTimelineMode
  displayZone: string
  firstWeekday: FirstWeekday
  showWeekends: boolean
}): CalendarThreePageRangeV1 {
  const anchor = normalizeTimelineAnchor(
    input.anchor,
    input.mode,
    input.displayZone,
    input.firstWeekday,
  )
  const pages = DIRECTIONS.map((direction): CalendarRangePageV1 => {
    const pageAnchor =
      direction === 0
        ? anchor
        : shiftTimelineAnchor(
            anchor,
            input.mode,
            direction,
            input.displayZone,
            input.firstWeekday,
          )
    return {
      version: 1,
      direction,
      key: dayKey(pageAnchor, input.displayZone),
      anchor: pageAnchor,
      columns: timelineColumns(
        pageAnchor,
        input.mode,
        input.displayZone,
        input.firstWeekday,
        input.showWeekends,
      ),
    }
  }) as unknown as CalendarThreePageRangeV1["pages"]
  const from = pages[0].anchor
  const to = addDaysInZone(
    pages[2].anchor,
    input.mode === "day" ? 1 : 7,
    input.displayZone,
  )
  const fromDay = dayKey(from, input.displayZone)
  const toDay = dayKey(to, input.displayZone)

  return {
    version: 1,
    key: [
      input.mode,
      input.displayZone,
      input.firstWeekday,
      input.showWeekends ? "7" : "5",
      dayKey(anchor, input.displayZone),
    ].join(":"),
    mode: input.mode,
    displayZone: input.displayZone,
    pages,
    instant: { from, to },
    civil: { fromDay, toDay },
  }
}
