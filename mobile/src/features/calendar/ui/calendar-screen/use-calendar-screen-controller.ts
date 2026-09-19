import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useReducer, useState } from "react"

import {
  addDaysInZone,
  type CalendarTransitionRequest,
  type CalendarTransitionState,
  cancelCalendarTransition,
  createCalendarTransitionState,
  type DateRange,
  dayKey,
  dayKeyToDate,
  normalizeTimelineAnchor,
  replaceCalendarTransition,
  requestCalendarTransition,
  settleCalendarTransition,
  useCalendarClock,
} from "@/features/calendar/data"
import {
  type CalendarView,
  useCalendarViewPreference,
  useCalendarZoomPreference,
  useDisplayZone,
} from "@/features/settings/prefs"

export type { CalendarView } from "@/features/settings/prefs"

const AGENDA_DAYS = 7
const LAUNCH_FIRST_WEEKDAY = 1 as const

type TransitionAction =
  | { type: "request"; request: CalendarTransitionRequest }
  | { type: "settle"; revision: number }
  | { type: "cancel"; revision: number }
  | { type: "replace"; date: Date }
  | { type: "view"; view: CalendarView }

type CalendarControllerState = {
  view: CalendarView
  transition: CalendarTransitionState
}

function withTransition(
  state: CalendarControllerState,
  transition: CalendarTransitionState,
): CalendarControllerState {
  return transition === state.transition ? state : { ...state, transition }
}

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
  const { view: persistedView, setView: persistView } =
    useCalendarViewPreference()
  const { pixelsPerHour, setPixelsPerHour } = useCalendarZoomPreference()
  // The one clock on this route: the Today cue, the Today action, and the
  // timeline's current-time indicator all read it, so they agree instant by
  // instant and roll over midnight together.
  const now = useCalendarClock()
  const [verticalOffset, setVerticalOffset] = useState(0)
  const [state, dispatchTransition] = useReducer(
    (state: CalendarControllerState, action: TransitionAction) => {
      switch (action.type) {
        case "request":
          return withTransition(
            state,
            requestCalendarTransition(
              state.transition,
              action.request,
              displayZone,
              LAUNCH_FIRST_WEEKDAY,
            ),
          )
        case "settle":
          return withTransition(
            state,
            settleCalendarTransition(state.transition, action.revision).state,
          )
        case "cancel":
          return withTransition(
            state,
            cancelCalendarTransition(state.transition, action.revision),
          )
        case "replace":
          return withTransition(
            state,
            replaceCalendarTransition(
              state.transition,
              { date: action.date },
              displayZone,
              LAUNCH_FIRST_WEEKDAY,
            ),
          )
        case "view":
          return {
            view: action.view,
            transition:
              action.view === "agenda"
                ? state.transition
                : replaceCalendarTransition(
                    state.transition,
                    { mode: action.view },
                    displayZone,
                    LAUNCH_FIRST_WEEKDAY,
                  ),
          }
      }
    },
    undefined,
    () =>
      ({
        view: persistedView,
        transition: createCalendarTransitionState(
          now,
          persistedView === "day" ? "day" : "week",
          displayZone,
          LAUNCH_FIRST_WEEKDAY,
        ),
      }) satisfies CalendarControllerState,
  )
  const { transition, view } = state
  const selectedDate = transition.anchor

  const agendaRange: DateRange = {
    from: selectedDate,
    to: addDaysInZone(selectedDate, AGENDA_DAYS, displayZone),
    civilFromDay: dayKey(selectedDate, displayZone),
    civilToDay: dayKey(
      addDaysInZone(selectedDate, AGENDA_DAYS, displayZone),
      displayZone,
    ),
  }

  const goToToday = () => {
    dispatchTransition({ type: "replace", date: now })
  }
  const canGoToToday =
    dayKey(selectedDate, displayZone) !==
    dayKey(
      normalizeTimelineAnchor(
        now,
        transition.mode,
        displayZone,
        LAUNCH_FIRST_WEEKDAY,
      ),
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

  const setView = (nextView: CalendarView) => {
    persistView(nextView)
    dispatchTransition({ type: "view", view: nextView })
  }
  const requestTransition = (request: CalendarTransitionRequest) => {
    dispatchTransition({ type: "request", request })
  }
  const settleTransition = (revision: number) => {
    dispatchTransition({ type: "settle", revision })
  }
  const cancelTransition = (revision: number) => {
    dispatchTransition({ type: "cancel", revision })
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
    timelineMode: transition.mode,
    selectedDate,
    firstWeekday: LAUNCH_FIRST_WEEKDAY,
    displayZone,
    range: agendaRange,
    canGoToToday,
    goToToday,
    rendererGeneration: transition.generation,
    transitionRevision: transition.lastRequestRevision,
    acceptedTransitionRevision: transition.acceptedRevision,
    verticalOffset,
    pixelsPerHour,
    settleVerticalOffset,
    settleZoom,
    requestTransition,
    settleTransition,
    cancelTransition,
  }
}
