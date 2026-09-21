import { fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"

import { useActivityState } from "@/features/activity"
import {
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources"
import { getShowWeekends, SETTINGS_KEYS } from "@/features/settings/prefs"
import { remove } from "@/storage"
import { usePlatform } from "@/test-support/platform"

import { SettingsScreen } from "./settings-screen"

jest.mock("@/features/calendar-sources", () => ({
  useUserCalendars: jest.fn(),
  useUserCalendarsLoaded: jest.fn(),
}))
jest.mock("@/features/activity", () => ({
  formatUnreadBadge: jest.requireActual("@/features/activity/data/unread-badge")
    .formatUnreadBadge,
  useActivityState: jest.fn(),
}))
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

let mockCapability: "development" | "production" = "production"
jest.mock("@/features/environment", () => ({
  getBackendEnvironmentCapability: () => mockCapability,
  EnvironmentSettingsControl: () => null,
}))

const mockCalendars = useUserCalendars as jest.Mock
const mockLoaded = useUserCalendarsLoaded as jest.Mock
const mockActivityState = useActivityState as jest.Mock
const mockPush = router.push as jest.Mock

beforeEach(() => {
  mockCalendars.mockReturnValue([])
  mockLoaded.mockReturnValue(true)
  mockActivityState.mockReturnValue({ unreadCount: 0 })
  mockCapability = "production"
  mockPush.mockReset()
  remove(SETTINGS_KEYS.showWeekends)
})

describe.each(["ios", "android"] as const)(
  "SettingsScreen on %s",
  (platform) => {
    usePlatform(platform)

    it("uses one native scroll owner and preserves the grouped destinations", async () => {
      const view = await render(<SettingsScreen />)
      const owner =
        platform === "ios"
          ? "swiftui-form-scroll-owner"
          : "compose-lazy-column-scroll-owner"
      expect(view.getAllByTestId(owner)).toHaveLength(1)
      expect(
        view
          .getAllByTestId(/^settings-section-/)
          .map((node) => node.props.testID),
      ).toEqual([
        "settings-section-events",
        "settings-section-preferences",
        "settings-section-app",
        "settings-section-support",
      ])
      for (const id of [
        "settings-activity",
        "settings-personal-events",
        "settings-hidden-events",
        "settings-appearance",
        "settings-timezone",
        "settings-notifications",
        "settings-about",
        "settings-feedback",
      ]) {
        expect(view.getByTestId(id)).toBeOnTheScreen()
      }
    })

    it("routes whole rows and toggles weekends once", async () => {
      const view = await render(<SettingsScreen />)
      await fireEvent.press(view.getByTestId("settings-appearance"))
      expect(mockPush).toHaveBeenCalledWith("/appearance-settings")
      await fireEvent.press(
        view.getByTestId(
          platform === "ios"
            ? "settings-show-weekends-switch"
            : "settings-show-weekends-row",
        ),
      )
      expect(getShowWeekends()).toBe(false)
    })
  },
)

it("preserves loading, empty, populated, badge, and environment states", async () => {
  mockLoaded.mockReturnValue(false)
  const view = await render(<SettingsScreen />)
  expect(
    view.getByTestId("settings-calendar-summary-loading"),
  ).toBeOnTheScreen()

  mockLoaded.mockReturnValue(true)
  await view.rerender(<SettingsScreen />)
  expect(view.getByText("Add your first calendar")).toBeOnTheScreen()

  mockCalendars.mockReturnValue([{ visible: true }, { visible: false }])
  mockActivityState.mockReturnValue({ unreadCount: 100 })
  mockCapability = "development"
  await view.rerender(<SettingsScreen />)
  expect(view.getByText("2 calendars")).toBeOnTheScreen()
  expect(view.getByText("99+")).toBeOnTheScreen()
  expect(view.getByTestId("settings-section-environment")).toBeOnTheScreen()
})
