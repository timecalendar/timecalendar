import { fireEvent, render, screen } from "@testing-library/react-native"
import { router } from "expo-router"

import {
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources"

import { SettingsScreen } from "./settings-screen"

jest.mock("@/features/calendar-sources", () => ({
  useUserCalendars: jest.fn(),
  useUserCalendarsLoaded: jest.fn(),
}))

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  const router = { push: jest.fn() }
  return {
    router,
    Link: ({
      href,
      children,
    }: {
      href: string
      children: React.ReactElement
    }) => React.cloneElement(children, { onPress: () => router.push(href) }),
  }
})

jest.mock("expo-symbols", () => ({
  SymbolView: () => null,
}))

const mockCalendars = useUserCalendars as jest.Mock
const mockLoaded = useUserCalendarsLoaded as jest.Mock
const mockPush = router.push as jest.Mock

beforeEach(() => {
  mockCalendars.mockReturnValue([])
  mockLoaded.mockReturnValue(true)
  mockPush.mockReset()
})

describe("SettingsScreen", () => {
  it("renders localized groups in order with only live destinations", async () => {
    await render(<SettingsScreen />)
    const events = screen.getByTestId("settings-section-events")
    const preferences = screen.getByTestId("settings-section-preferences")
    const app = screen.getByTestId("settings-section-app")
    expect(events).toBeOnTheScreen()
    expect(preferences).toBeOnTheScreen()
    expect(app).toBeOnTheScreen()
    expect(
      screen
        .getAllByTestId(/^settings-section-/)
        .map((section) => section.props.testID),
    ).toEqual([
      "settings-section-events",
      "settings-section-preferences",
      "settings-section-app",
    ])
    expect(screen.getByText("Personal events")).toBeTruthy()
    expect(screen.getByText("Hidden events")).toBeTruthy()
    expect(screen.getByText("Appearance & language")).toBeTruthy()
    expect(screen.getByText("Time zone")).toBeTruthy()
    expect(screen.getByText("Notifications")).toBeTruthy()
    expect(screen.getByText("About")).toBeTruthy()
    expect(screen.queryByText("Activity")).toBeNull()
    expect(screen.queryByText("Feedback")).toBeNull()
    expect(screen.queryByText("Add calendar")).toBeNull()
    expect(screen.queryByText("TIMECALENDAR")).toBeNull()
    expect(screen.queryByText("More")).toBeNull()
    expect(
      screen.queryByText("Calendars, events, and preferences in one place."),
    ).toBeNull()
  })

  it("does not announce an empty summary while loading", async () => {
    mockLoaded.mockReturnValue(false)
    await render(<SettingsScreen />)
    expect(
      screen.getByTestId("settings-calendar-summary-loading", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy()
    expect(screen.queryByText("Add your first calendar")).toBeNull()
  })

  it("presents calendar counts without exposing source names as headings", async () => {
    const { rerender } = await render(<SettingsScreen />)
    expect(screen.getByText("Your calendars")).toBeTruthy()
    expect(screen.getByText("Manage calendars")).toBeTruthy()
    expect(screen.getByText("Add your first calendar")).toBeTruthy()

    mockCalendars.mockReturnValue([
      {
        schoolId: "one",
        schoolName: "A very long university name",
        visible: true,
      },
    ])
    await rerender(<SettingsScreen />)
    expect(screen.queryByText("A very long university name")).toBeNull()
    expect(screen.getByText("1 calendar")).toBeTruthy()

    mockCalendars.mockReturnValue([
      { schoolId: "one", schoolName: "One", visible: true },
      { schoolId: "two", schoolName: "Two", visible: false },
    ])
    await rerender(<SettingsScreen />)
    expect(screen.getByText("2 calendars")).toBeTruthy()

    mockCalendars.mockReturnValue([{ visible: true }])
    await rerender(<SettingsScreen />)
    expect(screen.getByText("Your calendars")).toBeTruthy()
    expect(screen.getByText("1 calendar")).toBeTruthy()
  })

  it("wires every full-width accessible link to its route", async () => {
    await render(<SettingsScreen />)
    const routes = [
      ["settings-calendar-summary", "/user-calendars"],
      ["settings-personal-events", "/personal-events"],
      ["settings-hidden-events", "/hidden-events"],
      ["settings-appearance", "/appearance-settings"],
      ["settings-timezone", "/timezone-settings"],
      ["settings-notifications", "/notification-settings"],
      ["settings-about", "/about"],
    ] as const
    for (const [testID, route] of routes) {
      const row = screen.getByTestId(testID)
      expect(row.props.accessibilityRole).toBe("link")
      expect(row.props.accessibilityHint).toBeTruthy()
      expect(row).toHaveStyle({
        flexDirection: "row",
        alignItems: "center",
      })
      await fireEvent.press(row)
      expect(mockPush).toHaveBeenLastCalledWith(route)
    }
  })
})
