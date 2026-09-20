import { useCallback, useEffect, useRef, useState } from "react"

import {
  type CalendarSyncOutcome,
  useSyncCalendars,
} from "@/features/calendar/data"

export type CalendarImportResultPhase = "loading" | "failed" | "success"

export interface CalendarImportResultController {
  phase: CalendarImportResultPhase
  retry: () => void
}

function phaseForOutcome(
  outcome: CalendarSyncOutcome,
): CalendarImportResultPhase {
  return outcome.status === "events-ready" ? "success" : "failed"
}

export function useCalendarImportResult(): CalendarImportResultController {
  const { sync } = useSyncCalendars()
  const syncRef = useRef(sync)
  const [phase, setPhase] = useState<CalendarImportResultPhase>("loading")
  const activeRef = useRef(true)
  const inFlightRef = useRef(false)

  const run = useCallback(() => {
    if (!activeRef.current || inFlightRef.current) return
    inFlightRef.current = true
    setPhase("loading")
    void syncRef
      .current({ freshAfterCurrent: true })
      .then((outcome) => {
        if (activeRef.current) setPhase(phaseForOutcome(outcome))
      })
      .finally(() => {
        inFlightRef.current = false
      })
  }, [])

  useEffect(() => {
    activeRef.current = true
    run()
    return () => {
      activeRef.current = false
    }
  }, [run])

  return { phase, retry: run }
}
