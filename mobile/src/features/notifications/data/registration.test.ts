import { act, renderHook } from "@testing-library/react-native"
import { AppState, type AppStateStatus } from "react-native"

import { useUserCalendarsSnapshot } from "@/features/calendar-sources/data"
import { useDisplayZone } from "@/features/settings/prefs"
import { onFcmTokenRefresh, requestNotificationPermission } from "@/firebase"
import i18n from "@/i18n"

import { getEffectiveLocale } from "./localization"
import { useNotificationSyncRuntime } from "./registration"
import { notificationSyncRuntime } from "./runtime-instance"

jest.mock("@/features/calendar-sources/data", () => ({
  useUserCalendarsSnapshot: jest.fn(),
}))
jest.mock("@/features/settings/prefs", () => ({ useDisplayZone: jest.fn() }))
jest.mock("@/firebase", () => ({
  onFcmTokenRefresh: jest.fn(),
  requestNotificationPermission: jest.fn(),
}))
jest.mock("@/i18n", () => ({
  __esModule: true,
  default: { language: "fr", on: jest.fn(), off: jest.fn() },
}))
jest.mock("./localization", () => ({ getEffectiveLocale: jest.fn() }))
jest.mock("./runtime-instance", () => ({
  notificationSyncRuntime: {
    updateCalendars: jest.fn(),
    updateTimezone: jest.fn(),
    updateLocale: jest.fn(),
    updateToken: jest.fn(),
    setActive: jest.fn(),
    foreground: jest.fn(),
    start: jest.fn(),
    dispose: jest.fn(),
  },
}))

const mockCalendars = jest.mocked(useUserCalendarsSnapshot)
const mockZone = jest.mocked(useDisplayZone)
const mockOnTokenRefresh = jest.mocked(onFcmTokenRefresh)
const mockPermission = jest.mocked(requestNotificationPermission)
const mockLocale = jest.mocked(getEffectiveLocale)
const runtime = jest.mocked(notificationSyncRuntime)
let tokenListener: ((token: string) => void) | undefined
let appStateListener: ((state: AppStateStatus) => void) | undefined
let languageListener: (() => void) | undefined
const unsubscribeToken = jest.fn()
const removeAppState = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  mockCalendars.mockReturnValue({ calendars: [], ready: false, revision: "p" })
  mockZone.mockReturnValue("Europe/Paris")
  mockLocale.mockReturnValue("fr")
  mockPermission.mockResolvedValue(undefined)
  mockOnTokenRefresh.mockImplementation((listener) => {
    tokenListener = listener
    return unsubscribeToken
  })
  jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
    appStateListener = listener
    return { remove: removeAppState }
  })
  jest.mocked(i18n.on).mockImplementation((_, listener) => {
    languageListener = listener as () => void
    return i18n
  })
})

afterEach(() => {
  jest.mocked(AppState.addEventListener).mockRestore()
})

it("owns one lifecycle runtime and feeds every current-input trigger", async () => {
  const view = await renderHook(() => useNotificationSyncRuntime())
  await act(async () => {})

  expect(mockPermission).toHaveBeenCalledTimes(1)
  expect(mockOnTokenRefresh).toHaveBeenCalledTimes(1)
  expect(runtime.start).toHaveBeenCalledTimes(1)
  expect(runtime.updateCalendars).toHaveBeenCalledWith({
    calendars: [],
    ready: false,
    revision: "p",
  })
  expect(runtime.updateTimezone).toHaveBeenCalledWith("Europe/Paris")
  expect(runtime.updateLocale).toHaveBeenCalledWith("fr")

  tokenListener?.("rotated-token")
  expect(runtime.updateToken).toHaveBeenCalledWith("rotated-token")
  mockLocale.mockReturnValue("en")
  languageListener?.()
  expect(runtime.updateLocale).toHaveBeenLastCalledWith("en")
  appStateListener?.("background")
  expect(runtime.setActive).toHaveBeenLastCalledWith(false)
  appStateListener?.("active")
  expect(runtime.foreground).toHaveBeenCalledTimes(1)

  mockCalendars.mockReturnValue({
    calendars: [{ id: "calendar-b" }] as never,
    ready: true,
    revision: "2",
  })
  mockZone.mockReturnValue("America/Montreal")
  await view.rerender(undefined)
  expect(runtime.updateCalendars).toHaveBeenLastCalledWith(
    expect.objectContaining({ ready: true, revision: "2" }),
  )
  expect(runtime.updateTimezone).toHaveBeenLastCalledWith("America/Montreal")

  await view.unmount()
  expect(unsubscribeToken).toHaveBeenCalledTimes(1)
  expect(removeAppState).toHaveBeenCalledTimes(1)
  expect(runtime.dispose).toHaveBeenCalledTimes(1)
})
