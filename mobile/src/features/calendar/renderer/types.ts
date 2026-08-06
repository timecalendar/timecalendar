import { type CalendarEvent } from "@/features/calendar/data"

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
  events: CalendarEvent[]
  startMinute: number
  endMinute: number
  showWeekends: boolean
  bottomInset: number
  onVisibleDateChange: (date: Date) => void
  onSettledDateChange: (date: Date) => void
  onPressEvent: (event: CalendarEvent) => void
}
