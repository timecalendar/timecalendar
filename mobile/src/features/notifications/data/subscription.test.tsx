import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react-native"
import * as Localization from "expo-localization"
import type { ReactNode } from "react"

import { customFetch } from "@/api/mutator"
import { useUserCalendars } from "@/features/calendar-sources/data"
import { setLanguagePreference, SETTINGS_KEYS } from "@/features/settings/prefs"
import { getFcmToken, recordUnknownError } from "@/firebase"

import { setFrequency, setIsActive, setNbDaysAhead } from "./prefs"
import { useSubscriptionRegistration } from "./subscription"
import { NOTIFICATION_KEYS } from "./types"

// The write-wiring proof (mock-at-mutator, testing.md): the register() PUT
// assembles the DTO from local prefs + the user_calendars server ids + the
// Ship-A token + the effective locale/timezone and PUTs it through the REAL
// generated mutation, mocked at the customFetch mutator seam (never the
// network). Asserts PUT-on-change (the new value), re-PUT-on-token-refresh (the
// new token), null token → no PUT, zero calendars → calendarIds: [], and the
// failure path (PUT rejects → recordUnknownError + the isError flag). Mocks
// @/firebase + useUserCalendars per case; the device zone is pinned via a
// getCalendars spy (the machine's real zone would make the body assertion
// host-dependent).
jest.mock("@/api/mutator")
jest.mock("@/firebase")
jest.mock("@/features/calendar-sources/data")

const calendarsSpy = jest.spyOn(Localization, "getCalendars")

const mockFetch = customFetch as jest.Mock
const mockGetFcmToken = getFcmToken as jest.Mock
const mockRecordUnknownError = recordUnknownError as jest.Mock
const mockUseUserCalendars = useUserCalendars as jest.Mock

const { remove } = jest.requireActual<typeof import("@/storage")>("@/storage")

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function lastBody(): Record<string, unknown> {
  const call = mockFetch.mock.calls.at(-1)
  return JSON.parse(call?.[1].body as string) as Record<string, unknown>
}

beforeEach(() => {
  jest.clearAllMocks()
  remove(NOTIFICATION_KEYS.frequency)
  remove(NOTIFICATION_KEYS.nbDaysAhead)
  remove(NOTIFICATION_KEYS.isActive)
  remove(SETTINGS_KEYS.language)
  mockGetFcmToken.mockResolvedValue("fcm-token")
  mockUseUserCalendars.mockReturnValue([
    { id: "srv-cal-1" },
    { id: "srv-cal-2" },
  ])
  mockFetch.mockResolvedValue(undefined)
  calendarsSpy.mockReturnValue([
    { timeZone: "America/New_York" },
  ] as unknown as ReturnType<typeof Localization.getCalendars>)
})

describe("useSubscriptionRegistration", () => {
  it("PUTs the assembled DTO with defaults + the user_calendars server ids", async () => {
    const { result } = await renderHook(() => useSubscriptionRegistration(), {
      wrapper,
    })

    await act(async () => {
      await result.current.register()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0] ?? []
    expect(url).toBe("/notification-subscription")
    expect(init.method).toBe("PUT")
    expect(lastBody()).toEqual({
      frequency: "immediately",
      nbDaysAhead: 7,
      isActive: true,
      calendarIds: ["srv-cal-1", "srv-cal-2"],
      fcmToken: "fcm-token",
      // The jest-expo device locale resolves to en; the zone is the pinned spy
      // value (pass-through, not the server default).
      locale: "en",
      timezone: "America/New_York",
    })
  })

  it("the PUT carries the settings-override language as locale", async () => {
    setLanguagePreference("fr")

    const { result } = await renderHook(() => useSubscriptionRegistration(), {
      wrapper,
    })
    await act(async () => {
      await result.current.register()
    })

    expect(lastBody()).toMatchObject({ locale: "fr" })
  })

  it("a PUT-on-change carries the new local value", async () => {
    setFrequency("daily")
    setNbDaysAhead(14)
    setIsActive(false)

    const { result } = await renderHook(() => useSubscriptionRegistration(), {
      wrapper,
    })
    await act(async () => {
      await result.current.register()
    })

    expect(lastBody()).toMatchObject({
      frequency: "daily",
      nbDaysAhead: 14,
      isActive: false,
    })
  })

  it("re-PUTs with an explicit token (token-refresh) without reading getFcmToken", async () => {
    const { result } = await renderHook(() => useSubscriptionRegistration(), {
      wrapper,
    })
    await act(async () => {
      await result.current.register("refreshed-token")
    })

    expect(mockGetFcmToken).not.toHaveBeenCalled()
    expect(lastBody()).toMatchObject({ fcmToken: "refreshed-token" })
  })

  it("does NOT PUT on a null token (iOS APNS not ready)", async () => {
    mockGetFcmToken.mockResolvedValue(null)

    const { result } = await renderHook(() => useSubscriptionRegistration(), {
      wrapper,
    })
    await act(async () => {
      await result.current.register()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("PUTs calendarIds: [] when zero calendars are held (so the server can prune)", async () => {
    mockUseUserCalendars.mockReturnValue([])

    const { result } = await renderHook(() => useSubscriptionRegistration(), {
      wrapper,
    })
    await act(async () => {
      await result.current.register()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(lastBody()).toMatchObject({ calendarIds: [] })
  })

  it("records the error and flips isError when the PUT rejects", async () => {
    mockGetFcmToken.mockResolvedValue("fcm-token")
    mockFetch.mockRejectedValue(new Error("put boom"))

    const { result } = await renderHook(() => useSubscriptionRegistration(), {
      wrapper,
    })

    await act(async () => {
      await result.current.register().catch(() => {})
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockRecordUnknownError).toHaveBeenCalledWith(
      expect.any(Error),
      "notifications/subscription",
    )
  })

  it("forwards a non-Error rejection to the seam under its tag", async () => {
    mockGetFcmToken.mockResolvedValue("fcm-token")
    mockFetch.mockRejectedValue("plain string boom")

    const { result } = await renderHook(() => useSubscriptionRegistration(), {
      wrapper,
    })

    await act(async () => {
      await result.current.register().catch(() => {})
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    // The seam (recordUnknownError) owns the non-Error normalization; the hook
    // just forwards the raw rejection value under the right tag.
    expect(mockRecordUnknownError).toHaveBeenCalledWith(
      "plain string boom",
      "notifications/subscription",
    )
  })

  it("reset clears the error state", async () => {
    mockGetFcmToken.mockResolvedValue("fcm-token")
    mockFetch.mockRejectedValue(new Error("boom"))

    const { result } = await renderHook(() => useSubscriptionRegistration(), {
      wrapper,
    })
    await expect(
      act(async () => {
        await result.current.register()
      }),
    ).rejects.toThrow("boom")
    await waitFor(() => expect(result.current.isError).toBe(true))

    act(() => {
      result.current.reset()
    })
    await waitFor(() => expect(result.current.isError).toBe(false))
  })
})
