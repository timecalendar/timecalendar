import { fireEvent, render } from "@testing-library/react-native"

import { useNotificationPreferences } from "@/features/notifications/data"

import NotificationSettingsScreen from "./notification-settings-screen"

// Proof the screen resolves through the real theme + i18n trees and is wired to
// the feature data hook (mocked here): a control change drives the matching
// mutator (which the data layer's own tests prove persists + re-PUTs), and the
// failure surface + Retry render and re-fire register(). @expo/ui's native
// picker is mocked suite-wide (jest/setup-expo-ui.ts). The native feel /
// VoiceOver / contrast are the on-device half (inbox, task 8.1).
jest.mock("@/features/notifications/data")

const mockUseNotificationPreferences = useNotificationPreferences as jest.Mock

const setFrequency = jest.fn()
const setNbDaysAhead = jest.fn()
const setIsActive = jest.fn()
const register = jest.fn().mockResolvedValue(undefined)

function mockPrefs(overrides: Record<string, unknown> = {}) {
  mockUseNotificationPreferences.mockReturnValue({
    frequency: "immediately",
    nbDaysAhead: 7,
    isActive: true,
    setFrequency,
    setNbDaysAhead,
    setIsActive,
    register,
    isPending: false,
    isError: false,
    reset: jest.fn(),
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPrefs()
})

describe("NotificationSettingsScreen", () => {
  it("renders the localized title + control labels (not raw keys)", async () => {
    const { getByText } = await render(<NotificationSettingsScreen />)
    expect(getByText("Notifications")).toBeTruthy()
    expect(getByText("Notification frequency")).toBeTruthy()
    expect(getByText("Enable notifications")).toBeTruthy()
  })

  it("reflects the store: the current nbDaysAhead value", async () => {
    mockPrefs({ nbDaysAhead: 7 })
    const { getByText } = await render(<NotificationSettingsScreen />)
    expect(getByText("7 days")).toBeTruthy()
  })

  it("drives setFrequency when a frequency option is selected", async () => {
    const { getByTestId } = await render(<NotificationSettingsScreen />)
    fireEvent.press(getByTestId("notifications-frequency-picker-item-daily"))
    expect(setFrequency).toHaveBeenCalledWith("daily")
  })

  it("increments nbDaysAhead by one", async () => {
    mockPrefs({ nbDaysAhead: 10 })
    const { getByTestId } = await render(<NotificationSettingsScreen />)
    fireEvent.press(getByTestId("notifications-nb-days-increment"))
    expect(setNbDaysAhead).toHaveBeenCalledWith(11)
  })

  it("decrements nbDaysAhead by one", async () => {
    mockPrefs({ nbDaysAhead: 10 })
    const { getByTestId } = await render(<NotificationSettingsScreen />)
    fireEvent.press(getByTestId("notifications-nb-days-decrement"))
    expect(setNbDaysAhead).toHaveBeenCalledWith(9)
  })

  it("disables the decrement at the floor (1)", async () => {
    mockPrefs({ nbDaysAhead: 1 })
    const { getByTestId } = await render(<NotificationSettingsScreen />)
    expect(
      getByTestId("notifications-nb-days-decrement").props.accessibilityState
        .disabled,
    ).toBe(true)
  })

  it("disables the increment at the ceiling (30)", async () => {
    mockPrefs({ nbDaysAhead: 30 })
    const { getByTestId } = await render(<NotificationSettingsScreen />)
    expect(
      getByTestId("notifications-nb-days-increment").props.accessibilityState
        .disabled,
    ).toBe(true)
  })

  it("drives setIsActive when the toggle changes", async () => {
    const { getByTestId } = await render(<NotificationSettingsScreen />)
    fireEvent(
      getByTestId("notifications-is-active-switch"),
      "valueChange",
      false,
    )
    expect(setIsActive).toHaveBeenCalledWith(false)
  })

  it("does not render the failure surface when there is no error", async () => {
    const { queryByTestId } = await render(<NotificationSettingsScreen />)
    expect(queryByTestId("notifications-retry")).toBeNull()
  })

  it("renders the accessible failure surface + Retry and re-fires register", async () => {
    mockPrefs({ isError: true })
    const { getByText, getByTestId } = await render(
      <NotificationSettingsScreen />,
    )
    expect(
      getByText("Could not save your notification preferences."),
    ).toBeTruthy()
    fireEvent.press(getByTestId("notifications-retry"))
    expect(register).toHaveBeenCalledTimes(1)
  })
})
