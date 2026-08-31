import { useCallback, useEffect, useState } from "react"

import { runMigrations } from "@/db/migrate"
import {
  type LegacyImportPrerequisite,
  runLegacyImport,
} from "@/startup/legacy-import"

export const READY_WATCHDOG_MS = 5000

export interface AppReadyDependencies {
  runMigrations: () => Promise<void>
  runLegacyImport: LegacyImportPrerequisite
}

const DEFAULT_DEPENDENCIES: AppReadyDependencies = {
  runMigrations,
  runLegacyImport,
}

export type AppReadyState =
  | { status: "pending"; recoveryVisible: boolean; retry: () => void }
  | { status: "ready"; recoveryVisible: false; retry: () => void }
  | { status: "failed"; recoveryVisible: true; retry: () => void }

/**
 * Ordered startup coordinator. A timeout changes presentation only: it exposes
 * recovery and Retry while keeping every database reader and route unavailable.
 */
export function useAppReady(
  dependencies: AppReadyDependencies = DEFAULT_DEPENDENCIES,
): AppReadyState {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<AppReadyState["status"]>("pending")
  const [recoveryVisible, setRecoveryVisible] = useState(false)

  const retry = useCallback(() => {
    setStatus("pending")
    setRecoveryVisible(false)
    setAttempt((current) => current + 1)
  }, [])

  useEffect(() => {
    let active = true
    const watchdog = setTimeout(() => {
      if (active) setRecoveryVisible(true)
    }, READY_WATCHDOG_MS)

    void (async () => {
      try {
        await dependencies.runMigrations()
        await dependencies.runLegacyImport()
        if (active) {
          clearTimeout(watchdog)
          setStatus("ready")
          setRecoveryVisible(false)
        }
      } catch {
        if (active) {
          clearTimeout(watchdog)
          setStatus("failed")
          setRecoveryVisible(true)
        }
      }
    })()

    return () => {
      active = false
      clearTimeout(watchdog)
    }
  }, [attempt, dependencies])

  if (status === "ready") return { status, recoveryVisible: false, retry }
  if (status === "failed") return { status, recoveryVisible: true, retry }
  return { status, recoveryVisible, retry }
}
