import { useReducer, useRef } from "react"

import type { UserCalendar } from "@/features/calendar-sources/data"

export type VisibilityOperation = {
  id: number
  target: boolean
  status: "pending" | "awaitingCanonical"
  canAcknowledge: boolean
}

export type VisibilityOperations = Readonly<Record<string, VisibilityOperation>>

export type VisibilityAction =
  | { type: "start"; calendarId: string; operation: VisibilityOperation }
  | { type: "succeed"; calendarId: string; operationId: number }
  | { type: "fail"; calendarId: string; operationId: number }
  | {
      type: "reconcile"
      calendars: readonly Pick<UserCalendar, "id" | "visible">[]
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
        if (operation.canAcknowledge) {
          next = withoutOperation(next, calendar.id)
        }
        continue
      }

      if (!operation.canAcknowledge) {
        next = {
          ...next,
          [calendar.id]: { ...operation, canAcknowledge: true },
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
) {
  return visibilityReducer(state, { type: "reconcile", calendars })
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
  const reconciledOperations = reconcileVisibilityOperations(
    operations,
    calendars,
  )

  if (reconciledOperations !== operations) {
    dispatch({ type: "reconcile", calendars })
  }

  const toggle = (
    calendarId: string,
    target: boolean,
    canonicalVisible: boolean,
  ) => {
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
        canAcknowledge: canonicalVisible !== target,
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
