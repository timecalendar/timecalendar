import { router } from "expo-router"
import { useEffect } from "react"

import { useImportDraft } from "./context"
import {
  canEnterProtectedRoute,
  type ImportJourneyRoute,
  recoveryRoute,
} from "./routes"

export function useProtectedImportRoute(
  kind: "manual" | "qr" | "ical",
  currentRoute: ImportJourneyRoute,
): boolean {
  const { state } = useImportDraft()
  const legal = canEnterProtectedRoute(state, kind)
  useEffect(() => {
    if (legal) return
    const target = recoveryRoute(state, currentRoute)
    if (target !== null) router.replace(target)
  }, [currentRoute, legal, state])
  return legal
}
