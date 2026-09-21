import { fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"

import { useNotificationPreferences } from "@/features/notifications/data"
import { usePlatform } from "@/test-support/platform"

import NotificationSettingsScreen from "./notification-settings-screen"

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn() },
  Stack: { Screen: () => null },
}))
jest.mock("@/features/notifications/data")

const mockPush = router.push as jest.Mock

const mockUseNotificationPreferences = useNotificationPreferences as jest.Mock
const setFrequency = jest.fn()
const setNbDaysAhead = jest.fn()
const setIsActive = jest.fn()
const retry = jest.fn()

function mockPrefs(overrides: Record<string, unknown> = {}) {
  mockUseNotificationPreferences.mockReturnValue({
    frequency: "immediately",
    nbDaysAhead: 7,
    isActive: true,
    setFrequency,
    setNbDaysAhead,
    setIsActive,
    status: { state: "acknowledged" },
    retry,
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPrefs()
})

describe("NotificationSettingsScreen on iOS", () => {
  usePlatform("ios")

  it("uses one native form and pushes choice routes without writing", async () => {
    const view = await render(<NotificationSettingsScreen />)
    expect(view.getAllByTestId("swiftui-form-scroll-owner")).toHaveLength(1)

    await fireEvent.press(view.getByTestId("notifications-frequency-row"))
    expect(mockPush).toHaveBeenCalledWith("/notification-frequency")
    await fireEvent.press(view.getByTestId("notifications-days-row"))
    expect(mockPush).toHaveBeenCalledWith("/notification-days-ahead")
    expect(setFrequency).not.toHaveBeenCalled()
    expect(setNbDaysAhead).not.toHaveBeenCalled()
  })

  it.each([
    [1, "1 day"],
    [2, "2 days"],
    [12, "12 days"],
    [30, "30 days"],
  ])("shows the effective %i-day summary", async (days, label) => {
    mockPrefs({ nbDaysAhead: days })
    const view = await render(<NotificationSettingsScreen />)
    expect(view.getByText(label)).toBeTruthy()
  })

  it("retains rows and their values while subscription intent is off", async () => {
    mockPrefs({ isActive: false, frequency: "daily", nbDaysAhead: 29 })
    const view = await render(<NotificationSettingsScreen />)
    expect(view.getByText("Daily")).toBeTruthy()
    expect(view.getByText("29 days")).toBeTruthy()
    expect(
      view.getByTestId("notifications-is-active-switch").props
        .accessibilityState.checked,
    ).toBe(false)
  })
})

describe("NotificationSettingsScreen on Android", () => {
  usePlatform("android")

  it("commits one frequency choice and dismisses the dialog", async () => {
    const view = await render(<NotificationSettingsScreen />)
    await fireEvent.press(view.getByTestId("notifications-frequency-row"))
    await fireEvent.press(
      view.getByTestId("notifications-frequency-dialog-daily"),
    )
    expect(setFrequency).toHaveBeenCalledTimes(1)
    expect(setFrequency).toHaveBeenCalledWith("daily")
    expect(view.queryByTestId("notifications-frequency-dialog")).toBeNull()
  })

  it("cancels a frequency choice without a write", async () => {
    const view = await render(<NotificationSettingsScreen />)
    await fireEvent.press(view.getByTestId("notifications-frequency-row"))
    await fireEvent.press(
      view.getByTestId("notifications-frequency-dialog-cancel"),
    )
    expect(setFrequency).not.toHaveBeenCalled()
  })

  it("commits one preset immediately", async () => {
    const view = await render(<NotificationSettingsScreen />)
    await fireEvent.press(view.getByTestId("notifications-days-row"))
    await fireEvent.press(view.getByTestId("notifications-days-dialog-14"))
    expect(setNbDaysAhead).toHaveBeenCalledTimes(1)
    expect(setNbDaysAhead).toHaveBeenCalledWith(14)
  })

  it("opens Custom write-free and validates before one save", async () => {
    mockPrefs({ nbDaysAhead: 12 })
    const view = await render(<NotificationSettingsScreen />)
    await fireEvent.press(view.getByTestId("notifications-days-row"))
    await fireEvent.press(view.getByTestId("notifications-days-dialog-custom"))
    expect(setNbDaysAhead).not.toHaveBeenCalled()

    await fireEvent.changeText(
      view.getByTestId("notifications-custom-field"),
      "1.5",
    )
    await fireEvent.press(view.getByTestId("notifications-custom-save"))
    expect(setNbDaysAhead).not.toHaveBeenCalled()
    expect(
      view.getByText("Enter a whole number using digits only."),
    ).toBeTruthy()

    await fireEvent.changeText(
      view.getByTestId("notifications-custom-field"),
      " 30 ",
    )
    await fireEvent.press(view.getByTestId("notifications-custom-save"))
    expect(setNbDaysAhead).toHaveBeenCalledTimes(1)
    expect(setNbDaysAhead).toHaveBeenCalledWith(30)
  })

  it("discards a Custom draft on Cancel", async () => {
    const view = await render(<NotificationSettingsScreen />)
    await fireEvent.press(view.getByTestId("notifications-days-row"))
    await fireEvent.press(view.getByTestId("notifications-days-dialog-custom"))
    await fireEvent.changeText(
      view.getByTestId("notifications-custom-field"),
      "22",
    )
    await fireEvent.press(view.getByTestId("notifications-custom-cancel"))
    expect(setNbDaysAhead).not.toHaveBeenCalled()
  })

  it("keeps shared error and Retry on the parent", async () => {
    mockPrefs({ status: { state: "error" } })
    const view = await render(<NotificationSettingsScreen />)
    await fireEvent.press(view.getByTestId("notifications-retry"))
    expect(retry).toHaveBeenCalledTimes(1)
  })
})
