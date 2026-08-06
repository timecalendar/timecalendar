import { router, useFocusEffect } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  type CalendarEvent,
  eventRoute,
  resolveLocale,
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

const FUTURE_WINDOW_DAYS = 14

function startOfLocalDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

function localDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function useHomeScreenController() {
  const { i18n } = useTranslation()
  const locale = resolveLocale(i18n.language)
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
    const from = startOfLocalDay(now)
    const to = new Date(from)
    to.setDate(to.getDate() + FUTURE_WINDOW_DAYS)
    return { from, to }
  }, [now])
  const events = useCalendarEvents(range)
  const todayEvents = useMemo(() => eventsForDay(events, now), [events, now])
  const { allDay, timed } = useMemo(
    () => splitDayEvents(todayEvents),
    [todayEvents],
  )
  const upcoming = useMemo(() => remainingEvents(timed, now), [timed, now])
  const nextDay = useMemo(() => nextActiveDay(events, now), [events, now])
  const hourRange = useMemo(() => dynamicHourRange(timed, now), [timed, now])
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
      params: { focusDate: localDayKey(day) },
    })

  return {
    now,
    locale,
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
