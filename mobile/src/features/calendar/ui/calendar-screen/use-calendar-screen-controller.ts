import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useReducer, useState } from "react"

import {
  type CalendarTimelineMode,
  dayKey,
  dayKeyToDate,
  normalizeTimelineAnchor,
  useCalendarClock,
} from "@/features/calendar/data"
import { applyPagerExperiment } from "@/features/calendar/renderer/pager-experiment"
import {
  type CalendarView,
  useCalendarViewPreference,
  useCalendarZoomPreference,
  useDisplayZone,
} from "@/features/settings/prefs"

export type { CalendarView } from "@/features/settings/prefs"

const LAUNCH_FIRST_WEEKDAY = 1 as const

type CalendarControllerState = {
  view: CalendarView
  mode: CalendarTimelineMode
  anchor: Date
}

type CalendarControllerAction =
  /** A date the timeline settled on, or a date to show (Today, a deep link). */
  { type: "show"; date: Date } | { type: "view"; view: CalendarView }

// A `focusDate` param is a zone calendar day (`YYYY-MM-DD`); resolve it to the
// display zone's midnight instant, rejecting malformed or non-existent dates
// (2026-02-31 yields an Invalid Date from the day-key seam).
function parseFocusDate(value: string, zone: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const target = dayKeyToDate(value, zone)
  return Number.isNaN(target.getTime()) ? undefined : target
}

export function useCalendarScreenController() {
  const { focusDate, px } = useLocalSearchParams<{
    focusDate?: string
    px?: string
  }>()
  if (px !== undefined) applyPagerExperiment(px)
  const displayZone = useDisplayZone()
  const { view: persistedView, setView: persistView } =
    useCalendarViewPreference()
  const { pixelsPerHour, setPixelsPerHour } = useCalendarZoomPreference()
  // The one clock on this route: the Today cue, the Today action, and the
  // timeline's current-time indicator all read it, so they agree instant by
  // instant and roll over midnight together.
  const now = useCalendarClock()
  const [verticalOffset, setVerticalOffset] = useState(0)
  const [state, dispatch] = useReducer(
    (
      state: CalendarControllerState,
      action: CalendarControllerAction,
    ): CalendarControllerState => {
      const mode =
        action.type === "view" && action.view !== "agenda"
          ? action.view
          : state.mode
      const anchor = normalizeTimelineAnchor(
        action.type === "show" ? action.date : state.anchor,
        mode,
        displayZone,
        LAUNCH_FIRST_WEEKDAY,
      )
      const view = action.type === "view" ? action.view : state.view
      return view === state.view &&
        mode === state.mode &&
        anchor.getTime() === state.anchor.getTime()
        ? state
        : { view, mode, anchor }
    },
    undefined,
    (): CalendarControllerState => {
      const mode = persistedView === "day" ? "day" : "week"
      return {
        view: persistedView,
        mode,
        anchor: normalizeTimelineAnchor(
          now,
          mode,
          displayZone,
          LAUNCH_FIRST_WEEKDAY,
        ),
      }
    },
  )
  const { view, mode, anchor: selectedDate } = state

  const showDate = (date: Date) => {
    dispatch({ type: "show", date })
  }
  const goToToday = () => showDate(now)
  const canGoToToday =
    dayKey(selectedDate, displayZone) !==
    dayKey(
      normalizeTimelineAnchor(now, mode, displayZone, LAUNCH_FIRST_WEEKDAY),
      displayZone,
    )

  useEffect(() => {
    if (focusDate === undefined) return
    const target = parseFocusDate(focusDate, displayZone)
    if (target !== undefined) dispatch({ type: "show", date: target })
    router.setParams({ focusDate: undefined })
  }, [focusDate, displayZone])

  const setView = (nextView: CalendarView) => {
    persistView(nextView)
    dispatch({ type: "view", view: nextView })
  }
  const settleVerticalOffset = (offset: number) => {
    setVerticalOffset(Number.isFinite(offset) ? offset : 0)
  }
  const settleZoom = (settlement: {
    pixelsPerHour: number
    rawOffset: number
  }) => {
    setPixelsPerHour(settlement.pixelsPerHour)
    settleVerticalOffset(settlement.rawOffset)
  }

  return {
    view,
    setView,
    now,
    timelineMode: mode,
    selectedDate,
    firstWeekday: LAUNCH_FIRST_WEEKDAY,
    displayZone,
    canGoToToday,
    goToToday,
    commitDate: showDate,
    verticalOffset,
    pixelsPerHour,
    settleVerticalOffset,
    settleZoom,
  }
}
