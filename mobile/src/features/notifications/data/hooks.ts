import { useSyncExternalStore } from "react"

import type { NotificationSyncStatus } from "./notification-sync-runtime"
import {
  setFrequency,
  setIsActive,
  setNbDaysAhead,
  useFrequency,
  useIsActive,
  useNbDaysAhead,
} from "./prefs"
import { notificationSyncRuntime } from "./runtime-instance"
import type { NotificationFrequency } from "./types"

export interface UseNotificationPreferences {
  frequency: NotificationFrequency
  nbDaysAhead: number
  isActive: boolean
  setFrequency: (frequency: NotificationFrequency) => void
  setNbDaysAhead: (nbDaysAhead: number) => void
  setIsActive: (isActive: boolean) => void
  status: NotificationSyncStatus
  retry: () => void
}

export function useNotificationPreferences(): UseNotificationPreferences {
  return {
    frequency: useFrequency(),
    nbDaysAhead: useNbDaysAhead(),
    isActive: useIsActive(),
    setFrequency,
    setNbDaysAhead,
    setIsActive,
    status: useSyncExternalStore(
      notificationSyncRuntime.subscribe,
      notificationSyncRuntime.getSnapshot,
      notificationSyncRuntime.getSnapshot,
    ),
    retry: notificationSyncRuntime.retry,
  }
}
