import { useReducer, useRef, useState } from "react"

import type { UserCalendar } from "@/features/calendar-sources/data"

export type VisibilityOperation = {
  id: number
  target: boolean
  status: "pending" | "awaitingCanonical"
  startedAtCanonicalVersion: number
}

export type VisibilityOperations = Readonly<Record<string, VisibilityOperation>>

export type VisibilityAction =
  | { type: "start"; calendarId: string; operation: VisibilityOperation }
  | { type: "succeed"; calendarId: string; operationId: number }
  | { type: "fail"; calendarId: string; operationId: number }
  | {
      type: "reconcile"
      calendars: readonly Pick<UserCalendar, "id" | "visible">[]
      canonicalVersion: number
    }

function withoutOperation(state: VisibilityOperations, calendarId: string) {
  return Object.fromEntries(
    Object.entries(state).filter(([id]) => id !== calendarId),
  )
}

export function visibilityReducer(
  state: VisibilityOperations,
  action: VisibilityAction,
): VisibilityOperations {
  if (action.type === "start") {
    return { ...state, [action.calendarId]: action.operation }
  }

  if (action.type === "reconcile") {
    let next = state
    for (const calendar of action.calendars) {
      const operation = next[calendar.id]
      if (!operation) continue

      if (operation.target === calendar.visible) {
        if (action.canonicalVersion > operation.startedAtCanonicalVersion) {
          next = withoutOperation(next, calendar.id)
        }
      }
    }
    return next
  }

  const operation = state[action.calendarId]
  if (!operation || operation.id !== action.operationId) return state

  if (action.type === "succeed") {
    if (operation.status === "awaitingCanonical") return state
    return {
      ...state,
      [action.calendarId]: { ...operation, status: "awaitingCanonical" },
    }
  }

  return withoutOperation(state, action.calendarId)
}

export function reconcileVisibilityOperations(
  state: VisibilityOperations,
  calendars: readonly Pick<UserCalendar, "id" | "visible">[],
  canonicalVersion: number,
) {
  return visibilityReducer(state, {
    type: "reconcile",
    calendars,
    canonicalVersion,
  })
}

export function visibleFromOperation(
  canonicalVisible: boolean,
  operation: VisibilityOperation | undefined,
) {
  return operation?.target ?? canonicalVisible
}

export function useVisibilityController(
  calendars: readonly UserCalendar[],
  setVisible: (calendarId: string, visible: boolean) => Promise<boolean>,
) {
  const [operations, dispatch] = useReducer(visibilityReducer, {})
  const nextOperationId = useRef(0)
  const inFlight = useRef(new Set<string>())
  const [canonicalSnapshot, setCanonicalSnapshot] = useState({
    calendars,
    version: 0,
  })
  const canonicalVersion =
    canonicalSnapshot.calendars === calendars
      ? canonicalSnapshot.version
      : canonicalSnapshot.version + 1

  if (canonicalSnapshot.calendars !== calendars) {
    setCanonicalSnapshot({ calendars, version: canonicalVersion })
  }

  const reconciledOperations = reconcileVisibilityOperations(
    operations,
    calendars,
    canonicalVersion,
  )

  if (reconciledOperations !== operations) {
    dispatch({ type: "reconcile", calendars, canonicalVersion })
  }

  const toggle = (calendarId: string, target: boolean) => {
    if (inFlight.current.has(calendarId)) return

    inFlight.current.add(calendarId)
    const operationId = ++nextOperationId.current
    dispatch({
      type: "start",
      calendarId,
      operation: {
        id: operationId,
        target,
        status: "pending",
        startedAtCanonicalVersion: canonicalVersion,
      },
    })

    void setVisible(calendarId, target).then(
      (succeeded) => {
        dispatch({
          type: succeeded ? "succeed" : "fail",
          calendarId,
          operationId,
        })
        inFlight.current.delete(calendarId)
      },
      () => {
        dispatch({ type: "fail", calendarId, operationId })
        inFlight.current.delete(calendarId)
      },
    )
  }

  return {
    operationFor: (calendarId: string) => reconciledOperations[calendarId],
    toggle,
  }
}
