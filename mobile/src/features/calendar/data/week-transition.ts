import { addDaysInZone, dayKey, startOfDayInZone } from "./day-key"
import type { FirstWeekday, WeekColumn, WeekDirection } from "./week"
import { shiftWeekInZone, startOfWeekInZone, weekColumns } from "./week"

export type CalendarTimelineMode = "day" | "week"
export type CalendarTransitionSource = "gesture" | "previous" | "next"

export type CalendarTransitionRequest = {
  revision: number
  direction: WeekDirection
  source: CalendarTransitionSource
}

type PendingCalendarTransition = CalendarTransitionRequest & {
  destination: Date
}

export type CalendarTransitionState = {
  mode: CalendarTimelineMode
  anchor: Date
  pagePosition: number
  lastRequestRevision: number
  generation: number
  acceptedRevision: number | null
  pending: PendingCalendarTransition | null
}

export function normalizeTimelineAnchor(
  date: Date,
  mode: CalendarTimelineMode,
  zone: string,
  firstWeekday: FirstWeekday,
): Date {
  return mode === "day"
    ? startOfDayInZone(date, zone)
    : startOfWeekInZone(date, zone, firstWeekday)
}

export function shiftTimelineAnchor(
  date: Date,
  mode: CalendarTimelineMode,
  direction: WeekDirection,
  zone: string,
  firstWeekday: FirstWeekday,
): Date {
  return mode === "day"
    ? addDaysInZone(startOfDayInZone(date, zone), direction, zone)
    : shiftWeekInZone(date, direction, zone, firstWeekday)
}

export function timelineColumns(
  anchor: Date,
  mode: CalendarTimelineMode,
  zone: string,
  firstWeekday: FirstWeekday,
  showWeekends: boolean,
): WeekColumn[] {
  if (mode === "week") {
    return weekColumns(anchor, zone, firstWeekday, showWeekends)
  }
  const normalized = startOfDayInZone(anchor, zone)
  const key = dayKey(normalized, zone)
  return weekColumns(normalized, zone, firstWeekday, true).filter(
    (column) => column.key === key,
  )
}

export function createCalendarTransitionState(
  date: Date,
  mode: CalendarTimelineMode,
  zone: string,
  firstWeekday: FirstWeekday,
): CalendarTransitionState {
  return {
    mode,
    anchor: normalizeTimelineAnchor(date, mode, zone, firstWeekday),
    pagePosition: 0,
    lastRequestRevision: 0,
    generation: 0,
    acceptedRevision: null,
    pending: null,
  }
}

export function requestCalendarTransition(
  state: CalendarTransitionState,
  request: CalendarTransitionRequest,
  zone: string,
  firstWeekday: FirstWeekday,
): CalendarTransitionState {
  if (request.revision <= state.lastRequestRevision) return state
  return {
    ...state,
    lastRequestRevision: request.revision,
    pending: {
      ...request,
      destination: shiftTimelineAnchor(
        state.anchor,
        state.mode,
        request.direction,
        zone,
        firstWeekday,
      ),
    },
  }
}

export function cancelCalendarTransition(
  state: CalendarTransitionState,
  revision: number,
): CalendarTransitionState {
  if (state.pending?.revision !== revision) return state
  return { ...state, pending: null }
}

export function settleCalendarTransition(
  state: CalendarTransitionState,
  revision: number,
): { state: CalendarTransitionState; accepted: boolean } {
  if (state.pending?.revision !== revision) {
    return { state, accepted: false }
  }
  return {
    accepted: true,
    state: {
      ...state,
      anchor: state.pending.destination,
      pagePosition: state.pagePosition + state.pending.direction,
      generation: state.generation + 1,
      acceptedRevision: revision,
      pending: null,
    },
  }
}

export function replaceCalendarTransition(
  state: CalendarTransitionState,
  replacement: {
    mode?: CalendarTimelineMode | undefined
    date?: Date | undefined
  },
  zone: string,
  firstWeekday: FirstWeekday,
): CalendarTransitionState {
  const mode = replacement.mode ?? state.mode
  const anchor = normalizeTimelineAnchor(
    replacement.date ?? state.anchor,
    mode,
    zone,
    firstWeekday,
  )
  if (
    mode === state.mode &&
    anchor.getTime() === state.anchor.getTime() &&
    state.pending === null
  ) {
    return state
  }
  return {
    ...state,
    mode,
    anchor,
    lastRequestRevision: state.lastRequestRevision + 1,
    generation: state.generation + 1,
    pending: null,
  }
}
