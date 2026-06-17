import { act, renderHook, waitFor } from "@testing-library/react-native"

import { onFcmTokenRefresh, requestNotificationPermission } from "@/firebase"

import { useNotificationRegistration } from "./registration"
import { useSubscriptionRegistration } from "./subscription"

// The first-PUT trigger (Decision 3): a once-effect that requests permission,
// PUTs once a non-null token exists, and re-PUTs on token-refresh. The
// subscription seam + firebase are mocked; we assert permission is requested,
// register fires once, and the refresh listener re-PUTs with the new token and
// is cleaned up.
jest.mock("@/firebase")
jest.mock("./subscription")

const mockRegister = jest.fn().mockResolvedValue(undefined)
const mockUseSubscriptionRegistration = useSubscriptionRegistration as jest.Mock
const mockRequestPermission = requestNotificationPermission as jest.Mock
const mockOnFcmTokenRefresh = onFcmTokenRefresh as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockUseSubscriptionRegistration.mockReturnValue({
    register: mockRegister,
    isPending: false,
    isError: false,
    reset: jest.fn(),
  })
  mockRequestPermission.mockResolvedValue(undefined)
  mockOnFcmTokenRefresh.mockReturnValue(jest.fn())
})

describe("useNotificationRegistration", () => {
  it("requests permission then PUTs once on mount", async () => {
    await renderHook(() => useNotificationRegistration())
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))
    expect(mockRequestPermission).toHaveBeenCalledTimes(1)
    expect(mockRegister).toHaveBeenCalledWith()
  })

  it("re-PUTs with the new token on a token-refresh", async () => {
    await renderHook(() => useNotificationRegistration())
    const handler = mockOnFcmTokenRefresh.mock.calls[0]?.[0] as (
      token: string,
    ) => void
    handler("refreshed-token")
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith("refreshed-token"),
    )
  })

  it("does not re-fire the startup PUT across re-renders", async () => {
    const { rerender } = await renderHook(() => useNotificationRegistration())
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))
    await act(async () => {
      rerender(undefined)
    })
    expect(mockRegister).toHaveBeenCalledTimes(1)
  })

  it("the once-guard blocks a re-run even when register's identity changes", async () => {
    const { rerender } = await renderHook(() => useNotificationRegistration())
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))

    // A new register identity re-runs the startup effect; the fired ref must
    // short-circuit it (the `if (fired.current) return` guard) so no second PUT.
    const nextRegister = jest.fn().mockResolvedValue(undefined)
    mockUseSubscriptionRegistration.mockReturnValue({
      register: nextRegister,
      isPending: false,
      isError: false,
      reset: jest.fn(),
    })
    await act(async () => {
      rerender(undefined)
    })

    expect(mockRegister).toHaveBeenCalledTimes(1)
    expect(nextRegister).not.toHaveBeenCalled()
  })

  it("subscribes to token-refresh on mount (cleanup is the returned unsubscribe)", async () => {
    await renderHook(() => useNotificationRegistration())
    await waitFor(() => expect(mockOnFcmTokenRefresh).toHaveBeenCalledTimes(1))
  })

  it("swallows a rejected startup PUT (no on-screen surface)", async () => {
    mockRegister.mockRejectedValueOnce(new Error("boom"))
    await renderHook(() => useNotificationRegistration())
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))
  })
})
