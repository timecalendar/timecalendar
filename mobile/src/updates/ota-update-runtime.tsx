import { reloadAsync, useUpdates } from "expo-updates"
import { useEffect, useRef } from "react"
import { AppState, type AppStateStatus } from "react-native"

import { recordUnknownError, setCrashlyticsAttributes } from "@/firebase"

let attributesInstalled = false
let reloadAttempted = false

/** Owns OTA observability and silent foreground-boundary application. */
export function OtaUpdateRuntime() {
  const { currentlyRunning, isUpdatePending } = useUpdates()
  const pendingRef = useRef(isUpdatePending)
  const backgroundedRef = useRef(false)

  useEffect(() => {
    pendingRef.current = isUpdatePending
  }, [isUpdatePending])

  useEffect(() => {
    if (attributesInstalled) {
      return
    }
    attributesInstalled = true

    void setCrashlyticsAttributes({
      otaUpdateId: currentlyRunning.updateId ?? "embedded",
      otaChannel: currentlyRunning.channel ?? "",
      otaRuntimeVersion: currentlyRunning.runtimeVersion ?? "",
      otaCreatedAt: currentlyRunning.createdAt?.toISOString() ?? "",
      otaIsEmbedded: String(currentlyRunning.isEmbeddedLaunch),
    }).catch((error: unknown) => {
      recordUnknownError(error, "ota/attributes")
    })
  }, [currentlyRunning])

  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === "background") {
        backgroundedRef.current = true
        return
      }
      if (nextState !== "active") {
        return
      }

      const crossedForegroundBoundary = backgroundedRef.current
      backgroundedRef.current = false
      if (
        !crossedForegroundBoundary ||
        !pendingRef.current ||
        reloadAttempted
      ) {
        return
      }

      reloadAttempted = true
      void reloadAsync().catch((error: unknown) => {
        recordUnknownError(error, "ota/reload")
      })
    }

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    )
    return () => subscription.remove()
  }, [])

  return null
}
