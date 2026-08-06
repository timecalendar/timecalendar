import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useMemo, useRef, useState } from "react"

import { type DateRange } from "@/features/calendar/data"
import {
  calendarTimelineEventWindow,
  calendarTimelineEventWindowKey,
  type CalendarTimelineHandle,
} from "@/features/calendar/renderer"

export type CalendarView = "day" | "week" | "agenda"

const AGENDA_DAYS = 7

function startOfLocalDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

function parseFocusDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (match === null) return undefined
  const target = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
  if (
    target.getFullYear() !== Number(match[1]) ||
    target.getMonth() !== Number(match[2]) - 1 ||
    target.getDate() !== Number(match[3])
  ) {
    return undefined
  }
  return target
}

export function useCalendarScreenController() {
  const { focusDate } = useLocalSearchParams<{ focusDate?: string }>()
  const [view, setView] = useState<CalendarView>("week")
  const [anchorDate, setAnchorDate] = useState(() =>
    startOfLocalDay(new Date()),
  )
  const [visibleDate, setVisibleDate] = useState(() =>
    startOfLocalDay(new Date()),
  )
  const timelineRef = useRef<CalendarTimelineHandle>(null)

  const timelineRange = useMemo(
    () => calendarTimelineEventWindow(anchorDate),
    [anchorDate],
  )
  const agendaRange = useMemo<DateRange>(() => {
    const from = startOfLocalDay(anchorDate)
    const to = startOfLocalDay(anchorDate)
    to.setDate(to.getDate() + AGENDA_DAYS)
    return { from, to }
  }, [anchorDate])

  const goToToday = () => {
    const today = startOfLocalDay(new Date())
    timelineRef.current?.goToDate(today, {
      animated: true,
      scrollToCurrentTime: true,
    })
    setAnchorDate(today)
    setVisibleDate(today)
  }

  const onVisibleDateChange = (date: Date) => {
    const next = startOfLocalDay(date)
    setVisibleDate((previous) =>
      previous.getFullYear() === next.getFullYear() &&
      previous.getMonth() === next.getMonth()
        ? previous
        : next,
    )
    setAnchorDate((previous) =>
      calendarTimelineEventWindowKey(previous) ===
      calendarTimelineEventWindowKey(next)
        ? previous
        : next,
    )
  }

  const onSettledDateChange = (date: Date) => {
    setAnchorDate(startOfLocalDay(date))
  }

  useEffect(() => {
    if (focusDate === undefined) return
    const target = parseFocusDate(focusDate)
    if (target !== undefined) {
      timelineRef.current?.goToDate(target, {
        animated: true,
        scrollToCurrentTime: true,
      })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnchorDate(target)
      setVisibleDate(target)
    }
    router.setParams({ focusDate: undefined })
  }, [focusDate])

  return {
    view,
    setView,
    anchorDate,
    visibleDate,
    range: view === "agenda" ? agendaRange : timelineRange,
    timelineRef,
    goToToday,
    onVisibleDateChange,
    onSettledDateChange,
  }
}
