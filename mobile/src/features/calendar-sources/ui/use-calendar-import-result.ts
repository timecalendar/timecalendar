import { useEffect, useRef, useState } from "react"

import {
  type CalendarSyncOutcome,
  useSyncCalendars,
} from "@/features/calendar/data"

export type CalendarImportResultPhase = "loading" | "failed" | "success"

export interface CalendarImportResultController {
  phase: CalendarImportResultPhase
  retry: () => void
}

interface ExecutionState {
  active: { current: boolean }
  inFlight: { current: boolean }
}

function executeSync(
  sync: ReturnType<typeof useSyncCalendars>["sync"],
  execution: ExecutionState,
  setPhase: (phase: CalendarImportResultPhase) => void,
) {
  if (!execution.active.current || execution.inFlight.current) return
  execution.inFlight.current = true
  setPhase("loading")
  void sync({ freshAfterCurrent: true })
    .then((outcome) => {
      if (execution.active.current) setPhase(phaseForOutcome(outcome))
    })
    .finally(() => {
      execution.inFlight.current = false
    })
}

function phaseForOutcome(
  outcome: CalendarSyncOutcome,
): CalendarImportResultPhase {
  return outcome.status === "events-ready" ? "success" : "failed"
}

export function useCalendarImportResult(): CalendarImportResultController {
  const { sync } = useSyncCalendars()
  const [phase, setPhase] = useState<CalendarImportResultPhase>("loading")
  const activeRef = useRef(true)
  const inFlightRef = useRef(false)
  const startedRef = useRef(false)

  useEffect(() => {
    activeRef.current = true
    return () => {
      activeRef.current = false
    }
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    executeSync(sync, { active: activeRef, inFlight: inFlightRef }, setPhase)
  }, [sync])

  return {
    phase,
    retry: () =>
      executeSync(sync, { active: activeRef, inFlight: inFlightRef }, setPhase),
  }
}
