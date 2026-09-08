import { router } from "expo-router"
import { useEffect } from "react"

import { type JourneyGate, journeyGateDecision } from "./routes"
import type { ImportJourneyState } from "./types"

export function useJourneyGateRoute(
  state: ImportJourneyState,
  gate: JourneyGate,
): boolean {
  const decision = journeyGateDecision(state, gate)
  useEffect(() => {
    if (!decision.legal) router.replace(decision.recovery)
  }, [decision])
  return decision.legal
}
