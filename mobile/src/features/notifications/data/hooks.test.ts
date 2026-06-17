import { act, renderHook } from "@testing-library/react-native"

import { onFcmTokenRefresh } from "@/firebase"
import { remove } from "@/storage"

import { useNotificationPreferences } from "./hooks"
import { getFrequency, getIsActive, getNbDaysAhead } from "./prefs"
import { useSubscriptionRegistration } from "./subscription"
import { NOTIFICATION_KEYS } from "./types"

// The screen-facing preferences hook: a mutator writes the local store FIRST
// then triggers the idempotent re-PUT (Decision 5), and a token-refresh re-PUTs
// with the new token. The subscription seam + the firebase token-refresh
// subscription are mocked; the real prefs store (MMKV in-memory mock) proves the
// write lands before the re-PUT fires.
jest.mock("@/firebase")
jest.mock("./subscription")

const mockRegister = jest.fn().mockResolvedValue(undefined)
const mockReset = jest.fn()
const mockUseSubscriptionRegistration = useSubscriptionRegistration as jest.Mock
const mockOnFcmTokenRefresh = onFcmTokenRefresh as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  remove(NOTIFICATION_KEYS.frequency)
  remove(NOTIFICATION_KEYS.nbDaysAhead)
  remove(NOTIFICATION_KEYS.isActive)
  mockUseSubscriptionRegistration.mockReturnValue({
    register: mockRegister,
    isPending: false,
    isError: false,
    reset: mockReset,
  })
  mockOnFcmTokenRefresh.mockReturnValue(jest.fn())
})

describe("useNotificationPreferences", () => {
  it("exposes the reactive default values", async () => {
    const { result } = await renderHook(() => useNotificationPreferences())
    expect(result.current.frequency).toBe("immediately")
    expect(result.current.nbDaysAhead).toBe(7)
    expect(result.current.isActive).toBe(true)
  })

  it("setFrequency persists locally then re-PUTs", async () => {
    const { result } = await renderHook(() => useNotificationPreferences())
    await act(async () => {
      result.current.setFrequency("daily")
    })
    expect(getFrequency()).toBe("daily")
    expect(mockRegister).toHaveBeenCalledTimes(1)
  })

  it("setNbDaysAhead persists locally then re-PUTs", async () => {
    const { result } = await renderHook(() => useNotificationPreferences())
    await act(async () => {
      result.current.setNbDaysAhead(20)
    })
    expect(getNbDaysAhead()).toBe(20)
    expect(mockRegister).toHaveBeenCalledTimes(1)
  })

  it("setIsActive persists locally then re-PUTs", async () => {
    const { result } = await renderHook(() => useNotificationPreferences())
    await act(async () => {
      result.current.setIsActive(false)
    })
    expect(getIsActive()).toBe(false)
    expect(mockRegister).toHaveBeenCalledTimes(1)
  })

  it("re-PUTs with the new token on a token-refresh", async () => {
    await renderHook(() => useNotificationPreferences())
    const handler = mockOnFcmTokenRefresh.mock.calls[0]?.[0] as (
      token: string,
    ) => void
    await act(async () => {
      handler("refreshed-token")
    })
    expect(mockRegister).toHaveBeenCalledWith("refreshed-token")
  })

  it("subscribes to token-refresh on mount (cleanup is the returned unsubscribe)", async () => {
    await renderHook(() => useNotificationPreferences())
    expect(mockOnFcmTokenRefresh).toHaveBeenCalledTimes(1)
  })

  it("swallows a rejected re-PUT (no on-screen surface for the mutator path)", async () => {
    mockRegister.mockRejectedValueOnce(new Error("boom"))
    const { result } = await renderHook(() => useNotificationPreferences())
    await act(async () => {
      result.current.setFrequency("hourly")
    })
    expect(getFrequency()).toBe("hourly")
  })
})
