import { act, renderHook } from "@testing-library/react-native"

import { useNotificationPreferences } from "./hooks"
import type { NotificationSyncStatus } from "./notification-sync-runtime"
import { notificationSyncRuntime } from "./runtime-instance"

jest.mock("./prefs", () => ({
  useFrequency: () => "daily",
  useNbDaysAhead: () => 12,
  useIsActive: () => false,
  setFrequency: jest.fn(),
  setNbDaysAhead: jest.fn(),
  setIsActive: jest.fn(),
}))

const mockListeners = new Set<() => void>()
let mockSnapshot: NotificationSyncStatus = { state: "error" }

jest.mock("./runtime-instance", () => ({
  notificationSyncRuntime: {
    subscribe: (listener: () => void) => {
      mockListeners.add(listener)
      return () => mockListeners.delete(listener)
    },
    getSnapshot: () => mockSnapshot,
    retry: jest.fn(),
  },
}))

it("retains shared status and Retry across consumer unmount and remount", async () => {
  const first = await renderHook(() => useNotificationPreferences())
  expect(first.result.current.status).toEqual({ state: "error" })
  await first.unmount()

  const second = await renderHook(() => useNotificationPreferences())
  expect(second.result.current.status).toEqual({ state: "error" })
  second.result.current.retry()
  expect(notificationSyncRuntime.retry).toHaveBeenCalledTimes(1)

  await act(() => {
    mockSnapshot = { state: "acknowledged" }
    for (const listener of mockListeners) listener()
  })
  expect(second.result.current.status).toEqual({ state: "acknowledged" })
})
