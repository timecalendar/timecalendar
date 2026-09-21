import {
  getBoolean,
  getNumber,
  remove,
  setBoolean,
  setNumber,
  STORAGE_KEYS,
} from "@/storage"

export interface NotificationIntentVersion {
  generation: number
  rolledOver: boolean
}

type IntentListener = (version: NotificationIntentVersion) => void

const listeners = new Set<IntentListener>()

export function isNotificationIntentDirty(): boolean {
  return getBoolean(STORAGE_KEYS.notificationSyncDirty) === true
}

export function getNotificationIntentGeneration(): number {
  const value = getNumber(STORAGE_KEYS.notificationSyncGeneration)
  return Number.isSafeInteger(value) && (value ?? -1) >= 0 ? value! : 0
}

export function markNotificationIntentDirty(): NotificationIntentVersion {
  const current = getNotificationIntentGeneration()
  const rolledOver = current === Number.MAX_SAFE_INTEGER
  const generation = rolledOver ? 0 : current + 1
  setNumber(STORAGE_KEYS.notificationSyncGeneration, generation)
  setBoolean(STORAGE_KEYS.notificationSyncDirty, true)
  return { generation, rolledOver }
}

export function publishNotificationIntent(
  version: NotificationIntentVersion,
): void {
  for (const listener of listeners) listener(version)
}

export function subscribeNotificationIntent(
  listener: IntentListener,
): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function acknowledgeNotificationIntent(generation: number): boolean {
  if (
    !isNotificationIntentDirty() ||
    getNotificationIntentGeneration() !== generation
  ) {
    return false
  }
  setBoolean(STORAGE_KEYS.notificationSyncDirty, false)
  return true
}

export function resetNotificationIntent(): void {
  remove(STORAGE_KEYS.notificationSyncDirty)
  remove(STORAGE_KEYS.notificationSyncGeneration)
}
