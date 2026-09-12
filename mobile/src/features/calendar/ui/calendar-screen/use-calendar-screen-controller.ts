import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useMemo, useState } from "react"

import {
  addDaysInZone,
  type DateRange,
  dayKey,
  dayKeyToDate,
  startOfDayInZone,
} from "@/features/calendar/data"
import { useDisplayZone } from "@/features/settings/prefs"

export type CalendarView = "week" | "agenda"

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
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfDayInZone(new Date(), displayZone),
  )

  const agendaRange = useMemo<DateRange>(() => {
    const from = startOfDayInZone(selectedDate, displayZone)
    return { from, to: addDaysInZone(from, AGENDA_DAYS, displayZone) }
  }, [selectedDate, displayZone])

  const goToToday = () => {
    const today = startOfDayInZone(new Date(), displayZone)
    setSelectedDate(today)
  }
  const canGoToToday =
    dayKey(selectedDate, displayZone) !== dayKey(new Date(), displayZone)

  useEffect(() => {
    if (focusDate === undefined) return
    const target = parseFocusDate(focusDate, displayZone)
    if (target !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate(target)
    }
    router.setParams({ focusDate: undefined })
  }, [focusDate, displayZone])

  return {
    view,
    setView,
    selectedDate,
    displayZone,
    range: agendaRange,
    canGoToToday,
    goToToday,
  }
}
