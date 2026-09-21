import { getFcmToken, recordUnknownError } from "@/firebase"

import {
  acknowledgeNotificationIntent,
  getNotificationIntentGeneration,
  isNotificationIntentDirty,
  markNotificationIntentDirty,
  resetNotificationIntent,
  subscribeNotificationIntent,
} from "./intent"
import {
  createNotificationSyncRuntime,
  type NotificationSyncRuntime,
} from "./notification-sync-runtime"
import { getFrequency, getIsActive, getNbDaysAhead } from "./prefs"
import { putNotificationSubscription } from "./transport"

export const notificationSyncRuntime: NotificationSyncRuntime =
  createNotificationSyncRuntime({
    getPreferences: () => ({
      frequency: getFrequency(),
      nbDaysAhead: getNbDaysAhead(),
      isActive: getIsActive(),
    }),
    getToken: getFcmToken,
    transport: putNotificationSubscription,
    recordError: recordUnknownError,
    isDirty: isNotificationIntentDirty,
    getGeneration: getNotificationIntentGeneration,
    markDirty: markNotificationIntentDirty,
    acknowledge: acknowledgeNotificationIntent,
    resetIntent: resetNotificationIntent,
    subscribeIntent: subscribeNotificationIntent,
  })

export function resetNotificationRuntimeState(): void {
  notificationSyncRuntime.resetForEnvironment()
}
