import {
  getBoolean,
  getNumber,
  remove,
  setBoolean,
  setNumber,
  STORAGE_KEYS,
} from "@/storage"

import {
  acknowledgeNotificationIntent,
  getNotificationIntentGeneration,
  isNotificationIntentDirty,
  markNotificationIntentDirty,
  resetNotificationIntent,
  subscribeNotificationIntent,
} from "./intent"

beforeEach(resetNotificationIntent)

describe("notification synchronization intent", () => {
  it("total-decodes missing and malformed metadata", () => {
    expect(isNotificationIntentDirty()).toBe(false)
    expect(getNotificationIntentGeneration()).toBe(0)

    setNumber(STORAGE_KEYS.notificationSyncDirty, 1)
    setBoolean(STORAGE_KEYS.notificationSyncGeneration, true)
    expect(isNotificationIntentDirty()).toBe(false)
    expect(getNotificationIntentGeneration()).toBe(0)

    for (const invalid of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      setNumber(STORAGE_KEYS.notificationSyncGeneration, invalid)
      expect(getNotificationIntentGeneration()).toBe(0)
    }
  })

  it("advances generation, marks dirty, and only acknowledges the current generation", () => {
    const first = markNotificationIntentDirty()
    expect(first).toEqual({ generation: 1, rolledOver: false })
    expect(isNotificationIntentDirty()).toBe(true)
    expect(acknowledgeNotificationIntent(0)).toBe(false)
    expect(isNotificationIntentDirty()).toBe(true)
    expect(acknowledgeNotificationIntent(1)).toBe(true)
    expect(isNotificationIntentDirty()).toBe(false)
  })

  it("rolls over safely at the safe-integer ceiling", () => {
    setNumber(STORAGE_KEYS.notificationSyncGeneration, Number.MAX_SAFE_INTEGER)
    expect(markNotificationIntentDirty()).toEqual({
      generation: 0,
      rolledOver: true,
    })
    expect(getNumber(STORAGE_KEYS.notificationSyncGeneration)).toBe(0)
    expect(getBoolean(STORAGE_KEYS.notificationSyncDirty)).toBe(true)
  })

  it("publishes only when requested and reset removes both values", () => {
    const listener = jest.fn()
    const unsubscribe = subscribeNotificationIntent(listener)
    const version = markNotificationIntentDirty()
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
    resetNotificationIntent()
    expect(getBoolean(STORAGE_KEYS.notificationSyncDirty)).toBeUndefined()
    expect(getNumber(STORAGE_KEYS.notificationSyncGeneration)).toBeUndefined()
    remove(STORAGE_KEYS.notificationSyncDirty)
    expect(version.generation).toBe(1)
  })
})
