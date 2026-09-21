import { fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"

import { useNotificationPreferences } from "@/features/notifications/data"
import { usePlatform } from "@/test-support/platform"

import { NotificationDaysAheadScreen } from "./notification-days-ahead-screen"
import { NotificationDaysCustomScreen } from "./notification-days-custom-screen"
import { NotificationFrequencyScreen } from "./notification-frequency-screen"

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn() },
  Stack: { Screen: () => null },
}))
jest.mock("@/features/notifications/data")

const mockUseNotificationPreferences = useNotificationPreferences as jest.Mock
const mockBack = router.back as jest.Mock
const mockPush = router.push as jest.Mock
const setFrequency = jest.fn()
const setNbDaysAhead = jest.fn()

function mockPrefs(overrides: Record<string, unknown> = {}) {
  mockUseNotificationPreferences.mockReturnValue({
    frequency: "immediately",
    nbDaysAhead: 7,
    isActive: true,
    setFrequency,
    setNbDaysAhead,
    setIsActive: jest.fn(),
    status: { state: "acknowledged" },
    retry: jest.fn(),
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPrefs()
})

describe("iOS notification choice screens", () => {
  usePlatform("ios")

  it.each(["immediately", "hourly", "daily"] as const)(
    "selects and commits %s once",
    async (frequency) => {
      mockPrefs({ frequency })
      const view = await render(<NotificationFrequencyScreen />)
      expect(
        view.getByTestId(`notifications-frequency-choice-${frequency}`).props
          .accessibilityState.selected,
      ).toBe(true)
      await fireEvent.press(
        view.getByTestId(`notifications-frequency-choice-${frequency}`),
      )
      expect(setFrequency).toHaveBeenCalledTimes(1)
      expect(setFrequency).toHaveBeenCalledWith(frequency)
      expect(mockBack).toHaveBeenCalledTimes(1)
    },
  )

  it.each([1, 3, 7, 14, 30])(
    "selects preset %i instead of Custom",
    async (days) => {
      mockPrefs({ nbDaysAhead: days })
      const view = await render(<NotificationDaysAheadScreen />)
      expect(
        view.getByTestId(`notifications-days-choice-${days}`).props
          .accessibilityState.selected,
      ).toBe(true)
      expect(
        view.getByTestId("notifications-days-choice-custom").props
          .accessibilityState.selected,
      ).toBe(false)
    },
  )

  it.each([2, 12, 29])(
    "shows saved Custom value %i without writing",
    async (days) => {
      mockPrefs({ nbDaysAhead: days })
      const view = await render(<NotificationDaysAheadScreen />)
      expect(
        view.getByTestId("notifications-days-choice-custom").props
          .accessibilityState.selected,
      ).toBe(true)
      expect(view.getByText(`Custom (${days} days)`)).toBeTruthy()
      expect(setNbDaysAhead).not.toHaveBeenCalled()
    },
  )

  it("opens Custom without writing and commits presets immediately", async () => {
    const view = await render(<NotificationDaysAheadScreen />)
    await fireEvent.press(view.getByTestId("notifications-days-choice-custom"))
    expect(mockPush).toHaveBeenCalledWith("/notification-days-custom")
    expect(setNbDaysAhead).not.toHaveBeenCalled()

    await fireEvent.press(view.getByTestId("notifications-days-choice-14"))
    expect(setNbDaysAhead).toHaveBeenCalledWith(14)
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it("keeps an invalid custom sheet open and commits one valid Done", async () => {
    mockPrefs({ nbDaysAhead: 12 })
    const view = await render(<NotificationDaysCustomScreen />)
    await fireEvent.changeText(
      view.getByTestId("notifications-custom-field"),
      "31",
    )
    await fireEvent.press(view.getByTestId("notifications-custom-done"))
    expect(setNbDaysAhead).not.toHaveBeenCalled()
    expect(view.getByText("Enter a number from 1 to 30.")).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()

    await fireEvent.changeText(
      view.getByTestId("notifications-custom-field"),
      "1",
    )
    await fireEvent.press(view.getByTestId("notifications-custom-done"))
    expect(setNbDaysAhead).toHaveBeenCalledTimes(1)
    expect(setNbDaysAhead).toHaveBeenCalledWith(1)
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it("cancels the custom sheet without a write", async () => {
    const view = await render(<NotificationDaysCustomScreen />)
    await fireEvent.changeText(
      view.getByTestId("notifications-custom-field"),
      "22",
    )
    await fireEvent.press(view.getByTestId("notifications-custom-cancel"))
    expect(setNbDaysAhead).not.toHaveBeenCalled()
    expect(mockBack).toHaveBeenCalledTimes(1)
  })
})
