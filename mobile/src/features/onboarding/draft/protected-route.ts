import { router, useFocusEffect } from "expo-router"

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
  useFocusEffect(() => {
    if (legal) return
    const target = recoveryRoute(state, currentRoute)
    if (target !== null) router.replace(target)
  })
  return legal
}
