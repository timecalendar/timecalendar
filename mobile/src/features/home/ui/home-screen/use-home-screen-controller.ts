import { router, useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  addDaysInZone,
  type CalendarEvent,
  dayKey,
  eventRoute,
  resolveLocale,
  startOfDayInZone,
  useCalendarEvents,
  useSyncCalendars,
} from "@/features/calendar/data"
import {
  dayCaption,
  dynamicHourRange,
  eventsForDay,
  greetingSelection,
  nextActiveDay,
  remainingEvents,
  splitDayEvents,
} from "@/features/home/data"
import { useDisplayZone } from "@/features/settings/prefs"

const FUTURE_WINDOW_DAYS = 14

export function useHomeScreenController() {
  const { i18n } = useTranslation()
  const locale = resolveLocale(i18n.language)
  const displayZone = useDisplayZone()
  const [now, setNow] = useState(() => new Date())

  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setTimeout>
      const refreshClock = () => {
        setNow(new Date())
        timer = setTimeout(refreshClock, 60_050 - (Date.now() % 60_000))
      }
      refreshClock()
      return () => clearTimeout(timer)
    }, []),
  )

  const range = useMemo(() => {
    const from = startOfDayInZone(now, displayZone)
    return { from, to: addDaysInZone(from, FUTURE_WINDOW_DAYS, displayZone) }
  }, [now, displayZone])
  const events = useCalendarEvents(range)
  const todayEvents = useMemo(
    () => eventsForDay(events, now, displayZone),
    [events, now, displayZone],
  )
  const { allDay, timed } = useMemo(
    () => splitDayEvents(todayEvents),
    [todayEvents],
  )
  const upcoming = useMemo(() => remainingEvents(timed, now), [timed, now])
  const nextDay = useMemo(
    () => nextActiveDay(events, now, displayZone),
    [events, now, displayZone],
  )
  const hourRange = useMemo(
    () => dynamicHourRange(timed, now, displayZone),
    [timed, now, displayZone],
  )
  const caption = useMemo(
    () => dayCaption(todayEvents, now),
    [todayEvents, now],
  )
  const greeting = useMemo(() => greetingSelection(now), [now])
  const { sync: syncCalendars, isSyncing, isError } = useSyncCalendars()

  const sync = () => void syncCalendars()
  const openEvent = (event: CalendarEvent) => router.push(eventRoute(event.id))
  const addEvent = () => router.push("/personal-event-form")
  const openCalendar = (day: Date) =>
    router.push({
      pathname: "/calendar",
      params: { focusDate: dayKey(day, displayZone) },
    })

  return {
    now,
    locale,
    displayZone,
    todayEvents,
    allDay,
    timed,
    upcoming,
    nextDay,
    hourRange,
    caption,
    greeting,
    sync,
    isSyncing,
    isError,
    openEvent,
    addEvent,
    openCalendar,
  }
}
