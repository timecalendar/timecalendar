import type { BarcodeScanningResult } from "expo-camera"
import { useEffect, useRef, useState } from "react"

import {
  type CalendarImportFields,
  parseScannedSource,
} from "@/features/calendar-sources/data"

export interface QrImportAttempt {
  url: string
  fields: CalendarImportFields
}

type HandleBarcode = (result: BarcodeScanningResult) => void

export type QrImportController =
  | {
      phase: "scanning"
      invalidPayload: boolean
      handleBarcode: HandleBarcode
    }
  | {
      phase: "importing"
      attempt: QrImportAttempt
      handleBarcode: HandleBarcode
    }
  | {
      phase: "failed"
      attempt: QrImportAttempt
      handleBarcode: HandleBarcode
      retry: () => void
      scanAnother: () => void
      enterManualUrl: () => void
    }
  | {
      phase: "completed"
      handleBarcode: HandleBarcode
    }

type QrImportState =
  | { phase: "scanning"; invalidPayload: boolean }
  | { phase: "importing"; attempt: QrImportAttempt }
  | { phase: "failed"; attempt: QrImportAttempt }
  | { phase: "completed" }

interface UseQrImportControllerOptions {
  fields: CalendarImportFields
  addCalendarFromUrl: (
    url: string,
    fields: CalendarImportFields,
  ) => Promise<void>
  clearDraft: () => void
  leaveJourney: () => void
  openManualUrl: () => void
  recordError: (error: unknown, context: string) => void
}

const initialState: QrImportState = {
  phase: "scanning",
  invalidPayload: false,
}

export function useQrImportController({
  fields,
  addCalendarFromUrl,
  clearDraft,
  leaveJourney,
  openManualUrl,
  recordError,
}: UseQrImportControllerOptions): QrImportController {
  const [state, setReactState] = useState<QrImportState>(initialState)
  const stateRef = useRef<QrImportState>(initialState)
  const scanClaimedRef = useRef(false)
  const inFlightRef = useRef(false)
  const activeRef = useRef(true)
  const completedRef = useRef(false)

  const setState = (nextState: QrImportState) => {
    stateRef.current = nextState
    setReactState(nextState)
  }

  useEffect(() => {
    activeRef.current = true
    return () => {
      activeRef.current = false
    }
  }, [])

  const runAttempt = (attempt: QrImportAttempt) => {
    if (!activeRef.current || completedRef.current || inFlightRef.current) {
      return
    }

    inFlightRef.current = true
    setState({ phase: "importing", attempt })

    void addCalendarFromUrl(attempt.url, attempt.fields)
      .then(() => {
        if (!activeRef.current || completedRef.current) return

        completedRef.current = true
        setState({ phase: "completed" })
        clearDraft()
        leaveJourney()
      })
      .catch((error: unknown) => {
        if (!activeRef.current || completedRef.current) return

        recordError(error, "calendar-sources/qr-scan")
        setState({ phase: "failed", attempt })
      })
      .finally(() => {
        inFlightRef.current = false
      })
  }

  const handleBarcode = (result: BarcodeScanningResult) => {
    if (
      stateRef.current.phase !== "scanning" ||
      scanClaimedRef.current ||
      inFlightRef.current ||
      completedRef.current ||
      !activeRef.current
    ) {
      return
    }

    scanClaimedRef.current = true
    const source = parseScannedSource(result.data)
    if (source === null) {
      setState({ phase: "scanning", invalidPayload: true })
      scanClaimedRef.current = false
      return
    }

    const attempt: QrImportAttempt = {
      url: source.url,
      fields: { ...fields },
    }
    runAttempt(attempt)
  }

  const retry = () => {
    const currentState = stateRef.current
    if (currentState.phase !== "failed" || inFlightRef.current) return
    runAttempt(currentState.attempt)
  }

  const scanAnother = () => {
    if (stateRef.current.phase !== "failed" || inFlightRef.current) return
    scanClaimedRef.current = false
    setState(initialState)
  }

  const enterManualUrl = () => {
    if (stateRef.current.phase !== "failed" || inFlightRef.current) return
    openManualUrl()
  }

  if (state.phase === "failed") {
    return {
      ...state,
      handleBarcode,
      retry,
      scanAnother,
      enterManualUrl,
    }
  }

  return { ...state, handleBarcode }
}
