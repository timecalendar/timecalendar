import { type CalendarEvent } from "@/features/calendar/data"
import { type ChecklistProgressMap } from "@/features/event-checklists"

export type CalendarTimelineMode = "day" | "week"

export type CalendarTimelineNavigationOptions = {
  animated?: boolean
  scrollToCurrentTime?: boolean
}

export type CalendarTimelineHandle = {
  goToDate(date: Date, options?: CalendarTimelineNavigationOptions): void
}

export type CalendarTimelineProps = {
  mode: CalendarTimelineMode
  anchorDate: Date
  /** The effective display zone (IANA) every rendered time projects into. */
  displayZone: string
  events: CalendarEvent[]
  checklistProgress: ChecklistProgressMap
  startMinute: number
  endMinute: number
  showWeekends: boolean
  bottomInset: number
  onVisibleDateChange: (date: Date) => void
  onSettledDateChange: (date: Date) => void
  onPressEvent: (event: CalendarEvent) => void
}
