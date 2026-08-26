import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { AccessibilityInfo, Alert, Platform, StyleSheet } from "react-native"

import {
  useUserCalendarActions,
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"
import { useSourceHealthSnapshot } from "@/features/calendar-sources/store"

import { UserCalendarsScreen } from "./user-calendars-screen"

// Presentational management screen (70% floor): renders through the real theme +
// i18n trees. The reactive read, its loaded flag, and the actions hook are mocked
// so the list, visibility switch, confirm-gated delete, platform-specific add
// affordance, load-gated empty state, and failure surface are provable without a
// SQLite dependency. Native header items are asserted through Stack.Screen
// options because the navigator chrome is outside the test tree.

jest.mock("@/features/calendar-sources/data", () => ({
  useUserCalendars: jest.fn(),
  useUserCalendarsLoaded: jest.fn(),
  useUserCalendarActions: jest.fn(),
}))
jest.mock("@/features/calendar-sources/store", () => ({
  useSourceHealthSnapshot: jest.fn(),
}))

jest.mock("@/components/chrome", () => {
  const { View } = jest.requireActual("react-native")
  return {
    MenuView: ({ children, ...props }: React.ComponentProps<typeof View>) => (
      <View {...props}>{children}</View>
    ),
  }
})

let mockInsets = { top: 0, right: 0, bottom: 0, left: 0 }
jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native")
  return {
    SafeAreaView: ({
      children,
      ...props
    }: React.ComponentProps<typeof View>) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => mockInsets,
  }
})

const mockPush = jest.fn()
const mockScreenOptions = jest.fn()
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({
      options,
    }: {
      options?: {
        unstable_headerRightItems?: () => { onPress: () => void }[]
      }
    }) => {
      mockScreenOptions(options)
      return null
    },
  },
  useRouter: () => ({ push: mockPush }),
}))

const mockUseUserCalendars = useUserCalendars as jest.Mock
const mockUseUserCalendarsLoaded = useUserCalendarsLoaded as jest.Mock
const mockUseUserCalendarActions = useUserCalendarActions as jest.Mock
const mockUseSourceHealthSnapshot = useSourceHealthSnapshot as jest.Mock

const actions = {
  setVisible: jest.fn(),
  remove: jest.fn(),
  failed: false,
}

function calendar(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "cal-1",
    token: "tok-1",
    name: "ENSEEIHT",
    schoolName: "Toulouse INP",
    schoolId: "sch-1",
    lastUpdatedAt: new Date(),
    createdAt: new Date(),
    visible: true,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseUserCalendars.mockReturnValue([])
  mockUseUserCalendarsLoaded.mockReturnValue(true)
  actions.setVisible.mockResolvedValue(true)
  actions.remove.mockResolvedValue(true)
  mockUseUserCalendarActions.mockReturnValue({ ...actions, failed: false })
  mockUseSourceHealthSnapshot.mockReturnValue({})
  mockInsets = { top: 0, right: 0, bottom: 0, left: 0 }
})

describe("UserCalendarsScreen", () => {
  it("renders the empty state once the read has resolved with no calendars", async () => {
    await render(<UserCalendarsScreen />)
    expect(screen.getByText("No calendars yet")).toBeTruthy()
    expect(screen.getByText("No calendars imported.")).toBeTruthy()
  })

  it("does not render the empty state (or its live region) before the read resolves", async () => {
    mockUseUserCalendarsLoaded.mockReturnValue(false)
    await render(<UserCalendarsScreen />)
    expect(screen.queryByText("No calendars yet")).toBeNull()
    expect(screen.queryByText("No calendars imported.")).toBeNull()
  })

  it("lists a calendar with its name + school", async () => {
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)
    expect(screen.getByText("ENSEEIHT")).toBeTruthy()
    expect(screen.getByText("Toulouse INP")).toBeTruthy()
    expect(
      screen.getByText("Choose which calendars appear in Home and Calendar."),
    ).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "Actions for ENSEEIHT" }),
    ).toBeTruthy()
    expect(
      screen.getByTestId("user-calendar-actions-cal-1").props.actions,
    ).toEqual([
      {
        id: "delete",
        title: "Delete",
        image: "trash",
        attributes: { destructive: true },
      },
    ])
  })

  it("renders generic stale guidance and routes with safe recovery codes", async () => {
    mockUseUserCalendars.mockReturnValue([calendar()])
    mockUseSourceHealthSnapshot.mockReturnValue({
      "cal-1": {
        status: "stale",
        reason: "expired_export_window",
        recoveryAction: "re_add",
        guide: null,
      },
    })
    await render(<UserCalendarsScreen />)

    expect(screen.getByText("Source needs attention")).toBeTruthy()
    expect(
      screen.getByText(
        "This saved export period has ended. Add an updated calendar to recover future events.",
      ),
    ).toBeTruthy()
    fireEvent.press(
      screen.getByRole("button", {
        name: "Add an updated calendar for ENSEEIHT",
      }),
    )
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/onboarding/school",
      params: {
        source: "stale-recovery",
        calendarId: "cal-1",
        schoolId: "sch-1",
        reason: "expired_export_window",
        guide: "generic",
      },
    })
    expect(JSON.stringify(mockPush.mock.calls)).not.toMatch(/https|token/)
  })

  it("renders AMU transition guidance and hides recovery for unknown", async () => {
    mockUseUserCalendars.mockReturnValue([
      calendar({ id: "amu", name: "AMU", schoolId: "amu-school" }),
      calendar({ id: "unknown", name: "Other" }),
    ])
    mockUseSourceHealthSnapshot.mockReturnValue({
      amu: {
        status: "stale",
        reason: "known_source_transition",
        recoveryAction: "re_add",
        guide: "amu_2026_2027",
      },
      unknown: {
        status: "unknown",
        reason: null,
        recoveryAction: null,
        guide: null,
      },
    })
    await render(<UserCalendarsScreen />)

    expect(
      screen.getByText(
        "AMU changed its schedule service for 2026–27. Add the current calendar from the new service.",
      ),
    ).toBeTruthy()
    expect(screen.queryByTestId("user-calendar-stale-unknown")).toBeNull()
  })

  it("applies safe-area or design insets once, whichever is larger", async () => {
    mockInsets = { top: 0, right: 20, bottom: 0, left: 44 }
    await render(<UserCalendarsScreen />)
    const style = StyleSheet.flatten(
      screen.getByTestId("user-calendars-safe-area").props.style,
    )
    expect(style.paddingLeft).toBe(44)
    expect(style.paddingRight).toBe(20)
  })

  it("falls back to placeholders for an empty name and a personal (no-school) calendar", async () => {
    mockUseUserCalendars.mockReturnValue([
      calendar({ id: "cal-2", name: "", schoolName: undefined }),
    ])
    await render(<UserCalendarsScreen />)
    expect(screen.getByText("Calendar")).toBeTruthy()
    expect(screen.getByText("Personal calendar")).toBeTruthy()
  })

  it("forwards the native switch value to setVisible", async () => {
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await render(<UserCalendarsScreen />)
    const visibilitySwitch = screen.getByRole("switch", {
      name: "Show ENSEEIHT in the app",
      checked: true,
    })
    fireEvent(visibilitySwitch, "valueChange", true)
    expect(actions.setVisible).toHaveBeenCalledWith("cal-1", true)
    expect(visibilitySwitch.props.accessibilityHint).toBe(
      "Controls whether events from this calendar appear in Home and Calendar",
    )
  })

  it("updates visibility immediately and keeps it optimistic until the live query catches up", async () => {
    let resolveWrite: ((value: boolean) => void) | undefined
    actions.setVisible.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        resolveWrite = resolve
      }),
    )
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await render(<UserCalendarsScreen />)

    const switchName = "Show ENSEEIHT in the app"
    const originalSwitch = screen.getByRole("switch", { name: switchName })
    fireEvent(originalSwitch, "valueChange", false)
    expect(actions.setVisible).toHaveBeenCalledTimes(1)
    await screen.findByRole("switch", {
      name: switchName,
      checked: false,
    })
    resolveWrite?.(true)
    expect(
      screen.getByRole("switch", { name: switchName, checked: false }),
    ).toBeTruthy()
  })

  it("discards an old optimistic value after canonical visibility changes", async () => {
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    const view = await render(<UserCalendarsScreen />)
    const switchName = "Show ENSEEIHT in the app"
    const originalDeleteAction = screen.getByTestId(
      "user-calendar-actions-cal-1",
    )

    fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    await screen.findByRole("switch", { name: switchName, checked: false })

    mockUseUserCalendars.mockReturnValue([calendar({ visible: false })])
    await view.rerender(<UserCalendarsScreen />)
    await screen.findByRole("switch", { name: switchName, checked: false })

    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await view.rerender(<UserCalendarsScreen />)
    await screen.findByRole("switch", { name: switchName, checked: true })
    expect(screen.getByTestId("user-calendar-actions-cal-1")).toBe(
      originalDeleteAction,
    )
  })

  it("rolls optimistic visibility back when persistence fails", async () => {
    actions.setVisible.mockResolvedValueOnce(false)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await render(<UserCalendarsScreen />)

    const switchName = "Show ENSEEIHT in the app"
    fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    await waitFor(() =>
      expect(
        screen.getByRole("switch", {
          name: switchName,
          checked: true,
        }),
      ).toBeTruthy(),
    )
  })

  it("routes the header add action to school selection", async () => {
    await render(<UserCalendarsScreen />)
    const options = mockScreenOptions.mock.lastCall?.[0] as {
      unstable_headerRightItems: () => { onPress: () => void }[]
    }
    options.unstable_headerRightItems()[0]!.onPress()
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/onboarding/school",
      params: { source: "calendar-management" },
    })
    expect(mockScreenOptions).toHaveBeenCalledWith(
      expect.objectContaining({ headerBackButtonDisplayMode: "generic" }),
    )
  })

  it("opens the delete confirm and removes + announces on confirm", async () => {
    const alertSpy = jest.spyOn(Alert, "alert")
    const announceSpy = jest.spyOn(
      AccessibilityInfo,
      "announceForAccessibility",
    )
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)
    fireEvent(
      screen.getByTestId("user-calendar-actions-cal-1"),
      "pressAction",
      {
        nativeEvent: { event: "delete" },
      },
    )

    expect(alertSpy).toHaveBeenCalled()
    const buttons = alertSpy.mock.calls[0]?.[2]
    const confirm = buttons?.[1]
    await confirm?.onPress?.()

    expect(actions.remove).toHaveBeenCalledWith("cal-1")
    expect(announceSpy).toHaveBeenCalledWith("ENSEEIHT deleted")
  })

  it("does not remove when the confirm is cancelled (cancel button is inert)", async () => {
    const alertSpy = jest.spyOn(Alert, "alert")
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)
    fireEvent(
      screen.getByTestId("user-calendar-actions-cal-1"),
      "pressAction",
      {
        nativeEvent: { event: "delete" },
      },
    )

    expect(alertSpy).toHaveBeenCalled()
    const buttons = alertSpy.mock.calls[0]?.[2]
    const cancel = buttons?.[0]
    expect(cancel?.style).toBe("cancel")
    expect(cancel?.onPress).toBeUndefined()
    expect(actions.remove).not.toHaveBeenCalled()
  })

  it("does not announce when the delete write fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert")
    const announceSpy = jest.spyOn(
      AccessibilityInfo,
      "announceForAccessibility",
    )
    actions.remove.mockResolvedValue(false)
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)
    fireEvent(
      screen.getByTestId("user-calendar-actions-cal-1"),
      "pressAction",
      {
        nativeEvent: { event: "delete" },
      },
    )

    const buttons = alertSpy.mock.calls[0]?.[2]
    await buttons?.[1]?.onPress?.()

    expect(actions.remove).toHaveBeenCalledWith("cal-1")
    expect(announceSpy).not.toHaveBeenCalled()
  })

  it("renders Android visibility, delete, and FAB controls", async () => {
    jest.replaceProperty(Platform, "OS", "android")
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)

    expect(screen.getByLabelText("Show ENSEEIHT in the app")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "Delete calendar ENSEEIHT" }),
    ).toBeTruthy()
    expect(screen.getByRole("button", { name: "Add a calendar" })).toBeTruthy()
  })

  it("surfaces an accessible failure state when a write failed", async () => {
    mockUseUserCalendars.mockReturnValue([calendar()])
    mockUseUserCalendarActions.mockReturnValue({ ...actions, failed: true })
    await render(<UserCalendarsScreen />)
    expect(
      screen.getByText("We couldn't update your calendars. Please try again."),
    ).toBeTruthy()
  })
})
