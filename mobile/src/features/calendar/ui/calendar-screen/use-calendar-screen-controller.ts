import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useMemo, useRef, useState } from "react"

import {
  addDaysInZone,
  type DateRange,
  dayKey,
  dayKeyToDate,
  startOfDayInZone,
} from "@/features/calendar/data"
import {
  calendarTimelineEventWindow,
  calendarTimelineEventWindowKey,
  type CalendarTimelineHandle,
} from "@/features/calendar/renderer"
import { useDisplayZone } from "@/features/settings/prefs"

export type CalendarView = "day" | "week" | "agenda"

const AGENDA_DAYS = 7

// A `focusDate` param is a zone calendar day (`YYYY-MM-DD`); resolve it to the
// display zone's midnight instant, rejecting malformed or non-existent dates
// (2026-02-31 yields an Invalid Date from the day-key seam).
function parseFocusDate(value: string, zone: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const target = dayKeyToDate(value, zone)
  return Number.isNaN(target.getTime()) ? undefined : target
}

export function useCalendarScreenController() {
  const { focusDate } = useLocalSearchParams<{ focusDate?: string }>()
  const displayZone = useDisplayZone()
  const [view, setView] = useState<CalendarView>("week")
  const [anchorDate, setAnchorDate] = useState(() =>
    startOfDayInZone(new Date(), displayZone),
  )
  const [visibleDate, setVisibleDate] = useState(() =>
    startOfDayInZone(new Date(), displayZone),
  )
  const timelineRef = useRef<CalendarTimelineHandle>(null)

  const timelineRange = useMemo(
    () => calendarTimelineEventWindow(anchorDate, displayZone),
    [anchorDate, displayZone],
  )
  const agendaRange = useMemo<DateRange>(() => {
    const from = startOfDayInZone(anchorDate, displayZone)
    return { from, to: addDaysInZone(from, AGENDA_DAYS, displayZone) }
  }, [anchorDate, displayZone])

  const goToToday = () => {
    const today = startOfDayInZone(new Date(), displayZone)
    timelineRef.current?.goToDate(today, {
      animated: true,
      scrollToCurrentTime: true,
    })
    setAnchorDate(today)
    setVisibleDate(today)
  }

  const onVisibleDateChange = (date: Date) => {
    const next = startOfDayInZone(date, displayZone)
    setVisibleDate((previous) =>
      dayKey(previous, displayZone).slice(0, 7) ===
      dayKey(next, displayZone).slice(0, 7)
        ? previous
        : next,
    )
    setAnchorDate((previous) =>
      calendarTimelineEventWindowKey(previous, displayZone) ===
      calendarTimelineEventWindowKey(next, displayZone)
        ? previous
        : next,
    )
  }

  const onSettledDateChange = (date: Date) => {
    setAnchorDate(startOfDayInZone(date, displayZone))
  }

  useEffect(() => {
    if (focusDate === undefined) return
    const target = parseFocusDate(focusDate, displayZone)
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
  }, [focusDate, displayZone])

  return {
    view,
    setView,
    anchorDate,
    visibleDate,
    displayZone,
    range: view === "agenda" ? agendaRange : timelineRange,
    timelineRef,
    goToToday,
    onVisibleDateChange,
    onSettledDateChange,
  }
}
