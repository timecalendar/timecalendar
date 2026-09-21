import { getFcmToken, recordUnknownError } from "@/firebase"

import {
  acknowledgeNotificationIntent,
  getNotificationIntentGeneration,
  isNotificationIntentDirty,
  markNotificationIntentDirty,
  resetNotificationIntent,
  subscribeNotificationIntent,
} from "./intent"
import { createNotificationSyncRuntime } from "./notification-sync-runtime"
import { getFrequency, getIsActive, getNbDaysAhead } from "./prefs"
import {
  notificationSyncRuntime,
  resetNotificationRuntimeState,
} from "./runtime-instance"
import { putNotificationSubscription } from "./transport"

let mockDependencies: Record<string, unknown>

jest.mock("@/firebase", () => ({
  getFcmToken: jest.fn(),
  recordUnknownError: jest.fn(),
}))
jest.mock("./intent", () => ({
  acknowledgeNotificationIntent: jest.fn(),
  getNotificationIntentGeneration: jest.fn(),
  isNotificationIntentDirty: jest.fn(),
  markNotificationIntentDirty: jest.fn(),
  resetNotificationIntent: jest.fn(),
  subscribeNotificationIntent: jest.fn(),
}))
jest.mock("./prefs", () => ({
  getFrequency: jest.fn(() => "daily"),
  getIsActive: jest.fn(() => false),
  getNbDaysAhead: jest.fn(() => 11),
}))
jest.mock("./transport", () => ({ putNotificationSubscription: jest.fn() }))
jest.mock("./notification-sync-runtime", () => ({
  createNotificationSyncRuntime: jest.fn((dependencies) => {
    mockDependencies = dependencies
    return { resetForEnvironment: jest.fn() }
  }),
}))

it("builds the production runtime from the owned feature seams", () => {
  expect(notificationSyncRuntime).toBeDefined()
  expect(createNotificationSyncRuntime).toHaveBeenCalledTimes(1)
  const dependencies = mockDependencies as {
    getPreferences: () => unknown
    getToken: unknown
    transport: unknown
    recordError: unknown
    isDirty: unknown
    getGeneration: unknown
    markDirty: unknown
    acknowledge: unknown
    resetIntent: unknown
    subscribeIntent: unknown
  }
  expect(dependencies.getPreferences()).toEqual({
    frequency: "daily",
    nbDaysAhead: 11,
    isActive: false,
  })
  expect(getFrequency).toHaveBeenCalled()
  expect(getNbDaysAhead).toHaveBeenCalled()
  expect(getIsActive).toHaveBeenCalled()
  expect(dependencies).toMatchObject({
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

  resetNotificationRuntimeState()
  expect(notificationSyncRuntime.resetForEnvironment).toHaveBeenCalledTimes(1)
})
