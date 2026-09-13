import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useReducer, useState } from "react"

import {
  addDaysInZone,
  cancelWeekTransition,
  createWeekTransitionState,
  type DateRange,
  dayKey,
  dayKeyToDate,
  replaceWeekTransitionAnchor,
  requestWeekTransition,
  settleWeekTransition,
  startOfWeekInZone,
  type WeekTransitionRequest,
} from "@/features/calendar/data"
import { useDisplayZone } from "@/features/settings/prefs"

export type CalendarView = "week" | "agenda"

const AGENDA_DAYS = 7
const LAUNCH_FIRST_WEEKDAY = 1 as const

type TransitionAction =
  | { type: "request"; request: WeekTransitionRequest }
  | { type: "settle"; revision: number }
  | { type: "cancel"; revision: number }
  | { type: "replace"; date: Date }

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
  const [transition, dispatchTransition] = useReducer(
    (
      state: ReturnType<typeof createWeekTransitionState>,
      action: TransitionAction,
    ) => {
      switch (action.type) {
        case "request":
          return requestWeekTransition(
            state,
            action.request,
            displayZone,
            LAUNCH_FIRST_WEEKDAY,
          )
        case "settle":
          return settleWeekTransition(state, action.revision).state
        case "cancel":
          return cancelWeekTransition(state, action.revision)
        case "replace":
          return replaceWeekTransitionAnchor(
            state,
            action.date,
            displayZone,
            LAUNCH_FIRST_WEEKDAY,
          )
      }
    },
    undefined,
    () =>
      createWeekTransitionState(new Date(), displayZone, LAUNCH_FIRST_WEEKDAY),
  )
  const selectedDate = transition.anchor

  const agendaRange: DateRange = {
    from: selectedDate,
    to: addDaysInZone(selectedDate, AGENDA_DAYS, displayZone),
  }

  const goToToday = () => {
    dispatchTransition({ type: "replace", date: new Date() })
  }
  const canGoToToday =
    dayKey(selectedDate, displayZone) !==
    dayKey(
      startOfWeekInZone(new Date(), displayZone, LAUNCH_FIRST_WEEKDAY),
      displayZone,
    )

  useEffect(() => {
    if (focusDate === undefined) return
    const target = parseFocusDate(focusDate, displayZone)
    if (target !== undefined) {
      dispatchTransition({ type: "replace", date: target })
    }
    router.setParams({ focusDate: undefined })
  }, [focusDate, displayZone])

  const requestTransition = (request: WeekTransitionRequest) => {
    dispatchTransition({ type: "request", request })
  }
  const settleTransition = (revision: number) => {
    dispatchTransition({ type: "settle", revision })
  }
  const cancelTransition = (revision: number) => {
    dispatchTransition({ type: "cancel", revision })
  }

  return {
    view,
    setView,
    selectedDate,
    displayZone,
    range: agendaRange,
    canGoToToday,
    goToToday,
    rendererGeneration: transition.generation,
    rendererPagePosition: transition.pagePosition,
    transitionRevision: transition.lastRequestRevision,
    acceptedTransitionRevision: transition.acceptedRevision,
    requestTransition,
    settleTransition,
    cancelTransition,
  }
}
