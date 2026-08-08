import { act, renderHook, waitFor } from "@testing-library/react-native"
import * as Localization from "expo-localization"

import { setTimezonePreference, SETTINGS_KEYS } from "@/features/settings/prefs"
import { onFcmTokenRefresh, requestNotificationPermission } from "@/firebase"
import i18n from "@/i18n"
import { remove } from "@/storage"

import { useNotificationRegistration } from "./registration"
import { useSubscriptionRegistration } from "./subscription"

// The registration triggers (Decision 3 + design D3): a once-effect that
// requests permission and PUTs, plus the re-PUT listeners (token-refresh,
// i18next languageChanged, device-timezone change). The subscription seam +
// firebase are mocked, so these cases prove each trigger FIRES register(); the
// re-PUT body carrying the new locale/timezone is subscription.test's proof
// (register reads the effective accessors at DTO-assembly time). The language
// trigger is driven through the REAL i18n instance (setup-i18n); useCalendars
// is spied so the zone is deterministic and drivable.
jest.mock("@/firebase")
jest.mock("./subscription")

const mockRegister = jest.fn().mockResolvedValue(undefined)
const mockUseSubscriptionRegistration = useSubscriptionRegistration as jest.Mock
const mockRequestPermission = requestNotificationPermission as jest.Mock
const mockOnFcmTokenRefresh = onFcmTokenRefresh as jest.Mock

const useCalendarsSpy = jest.spyOn(Localization, "useCalendars")

const deviceCalendars = (...timeZones: (string | null)[]) =>
  timeZones.map((timeZone) => ({ timeZone })) as ReturnType<
    typeof Localization.useCalendars
  >

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
  useCalendarsSpy.mockReturnValue(deviceCalendars("Europe/Paris"))
})

afterEach(async () => {
  // The language test switches the shared per-file i18n instance; restore the
  // jest-expo default so later cases assert against EN. The timezone cases
  // write the real preference store; reset to the "system" default.
  await i18n.changeLanguage("en")
  remove(SETTINGS_KEYS.timezone)
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

  it("re-PUTs on a language change", async () => {
    await renderHook(() => useNotificationRegistration())
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))

    await act(async () => {
      await i18n.changeLanguage("fr")
    })

    expect(mockRegister).toHaveBeenCalledTimes(2)
  })

  it("re-PUTs when the device timezone changes, skipping the initial value", async () => {
    const { rerender } = await renderHook(() => useNotificationRegistration())
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))

    useCalendarsSpy.mockReturnValue(deviceCalendars("America/New_York"))
    await act(async () => {
      rerender(undefined)
    })

    expect(mockRegister).toHaveBeenCalledTimes(2)
  })

  it("re-PUTs when a zone appears after mounting with none", async () => {
    useCalendarsSpy.mockReturnValue(
      [] as unknown as ReturnType<typeof Localization.useCalendars>,
    )
    const { rerender } = await renderHook(() => useNotificationRegistration())
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))

    // No device zone resolves to the "Europe/Paris" fallback, so a fallback-
    // equal zone appearing is inert (the resolved zone did not change); a
    // DIFFERENT zone appearing re-PUTs.
    useCalendarsSpy.mockReturnValue(deviceCalendars("America/New_York"))
    await act(async () => {
      rerender(undefined)
    })

    expect(mockRegister).toHaveBeenCalledTimes(2)
  })

  it("re-PUTs when the display-timezone preference changes", async () => {
    const { rerender } = await renderHook(() => useNotificationRegistration())
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))

    await act(async () => {
      setTimezonePreference("Indian/Reunion")
      rerender(undefined)
    })

    expect(mockRegister).toHaveBeenCalledTimes(2)
  })

  it("keeps a device timezone change inert under an explicit preference", async () => {
    setTimezonePreference("Indian/Reunion")
    const { rerender } = await renderHook(() => useNotificationRegistration())
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))

    // The device zone changes but the resolved effective zone is still the
    // explicit preference — no timezone-triggered PUT.
    useCalendarsSpy.mockReturnValue(deviceCalendars("America/New_York"))
    await act(async () => {
      rerender(undefined)
    })

    expect(mockRegister).toHaveBeenCalledTimes(1)
  })

  it("swallows a rejected startup PUT (no on-screen surface)", async () => {
    mockRegister.mockRejectedValueOnce(new Error("boom"))
    await renderHook(() => useNotificationRegistration())
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1))
  })
})
