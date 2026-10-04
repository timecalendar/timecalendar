import { useEffect } from "react"
import { AppState } from "react-native"

import { deliverMigrationReports } from "@/features/legacy-migration/data/runtime"

export function MigrationReportRuntime() {
  useEffect(() => {
    const deliver = () => {
      void deliverMigrationReports().catch(() => undefined)
    }
    deliver()
    const interval = setInterval(deliver, 60_000)
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") deliver()
    })
    return () => {
      clearInterval(interval)
      subscription.remove()
    }
  }, [])
  return null
}
