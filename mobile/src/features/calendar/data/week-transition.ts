import type { FirstWeekday, WeekDirection } from "./week"
import { shiftWeekInZone, startOfWeekInZone } from "./week"

export type WeekTransitionSource = "gesture" | "previous" | "next"

export type WeekTransitionRequest = {
  revision: number
  direction: WeekDirection
  source: WeekTransitionSource
}

type PendingWeekTransition = WeekTransitionRequest & {
  destination: Date
}

export type WeekTransitionState = {
  anchor: Date
  lastRequestRevision: number
  generation: number
  acceptedRevision: number | null
  pending: PendingWeekTransition | null
}

export function createWeekTransitionState(
  date: Date,
  zone: string,
  firstWeekday: FirstWeekday,
): WeekTransitionState {
  return {
    anchor: startOfWeekInZone(date, zone, firstWeekday),
    lastRequestRevision: 0,
    generation: 0,
    acceptedRevision: null,
    pending: null,
  }
}

export function requestWeekTransition(
  state: WeekTransitionState,
  request: WeekTransitionRequest,
  zone: string,
  firstWeekday: FirstWeekday,
): WeekTransitionState {
  if (request.revision <= state.lastRequestRevision) return state

  return {
    ...state,
    lastRequestRevision: request.revision,
    pending: {
      ...request,
      destination: shiftWeekInZone(
        state.anchor,
        request.direction,
        zone,
        firstWeekday,
      ),
    },
  }
}

export function cancelWeekTransition(
  state: WeekTransitionState,
  revision: number,
): WeekTransitionState {
  if (state.pending?.revision !== revision) return state
  return { ...state, pending: null }
}

export function settleWeekTransition(
  state: WeekTransitionState,
  revision: number,
): { state: WeekTransitionState; accepted: boolean } {
  if (state.pending?.revision !== revision) {
    return { state, accepted: false }
  }

  return {
    accepted: true,
    state: {
      ...state,
      anchor: state.pending.destination,
      generation: state.generation + 1,
      acceptedRevision: revision,
      pending: null,
    },
  }
}

export function replaceWeekTransitionAnchor(
  state: WeekTransitionState,
  date: Date,
  zone: string,
  firstWeekday: FirstWeekday,
): WeekTransitionState {
  const anchor = startOfWeekInZone(date, zone, firstWeekday)
  if (anchor.getTime() === state.anchor.getTime() && state.pending === null) {
    return state
  }

  return {
    anchor,
    lastRequestRevision: state.lastRequestRevision + 1,
    generation: state.generation + 1,
    acceptedRevision: state.acceptedRevision,
    pending: null,
  }
}
