import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { AccessibilityInfo, Alert, StyleSheet } from "react-native"

import {
  useRenameCalendar,
  useUserCalendarActions,
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"
import { usePlatform } from "@/test-support/platform"

import { UserCalendarsScreen } from "./user-calendars-screen"

// Presentational management screen (70% floor): renders through the real theme +
// i18n trees. The reactive read, its loaded flag, and the actions hook are mocked
// so the list, visibility switch, confirm-gated delete, platform-specific add
// affordance, load-gated empty state, and failure surface are provable without a
// SQLite dependency. Native header items are asserted through Stack.Screen
// options because the navigator chrome is outside the test tree.

// `effectiveCalendarName` is spread back in from the real module: it is the pure
// display rule under test here, and stubbing it would destroy the fallback oracle.
jest.mock("@/features/calendar-sources/data", () => ({
  ...jest.requireActual<object>(
    "@/features/calendar-sources/data/effective-name",
  ),
  useUserCalendars: jest.fn(),
  useUserCalendarsLoaded: jest.fn(),
  useUserCalendarActions: jest.fn(),
  useRenameCalendar: jest.fn(),
}))

// The MenuView stub records the ref it is given and exposes `show()` on it, so
// the Android trigger's imperative open (press and the `activate` accessibility
// action) is assertable without a native menu.
const mockShow = jest.fn()
jest.mock("@/components/chrome", () => {
  const { View } = jest.requireActual("react-native")
  return {
    MenuView: ({
      children,
      ref,
      ...props
    }: React.ComponentProps<typeof View> & {
      ref?: { current: { show: () => void } | null }
    }) => {
      if (ref) ref.current = { show: mockShow }
      return <View {...props}>{children}</View>
    },
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
const mockUseRenameCalendar = useRenameCalendar as jest.Mock

const actions = {
  setVisible: jest.fn(),
  remove: jest.fn(),
  failed: false,
}

const renameActions = { rename: jest.fn(), isPending: false, isError: false }

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
  renameActions.rename.mockResolvedValue(undefined)
  mockUseRenameCalendar.mockReturnValue(renameActions)
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
      { id: "rename", title: "Rename" },
      {
        id: "delete",
        title: "Delete",
        image: "trash",
        attributes: { destructive: true },
      },
    ])
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
    expect(screen.getByText("My timetable")).toBeTruthy()
    expect(screen.getByText("Personal calendar")).toBeTruthy()
  })

  // The measured production case (TIM-274): the previous `name || placeholder`
  // passed whitespace straight through and rendered a blank label.
  it("falls back for a whitespace-only name and trims a padded one", async () => {
    mockUseUserCalendars.mockReturnValue([
      calendar({ id: "cal-3", name: "   " }),
      calendar({ id: "cal-4", name: "  L3 Informatique  " }),
    ])
    await render(<UserCalendarsScreen />)
    expect(screen.getByText("My timetable")).toBeTruthy()
    expect(screen.getByText("L3 Informatique")).toBeTruthy()
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

  it("opens the rename dialog from the menu, seeded with the current name", async () => {
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)
    expect(screen.queryByTestId("user-calendar-rename-dialog")).toBeNull()

    await act(async () => {
      fireEvent(
        screen.getByTestId("user-calendar-actions-cal-1"),
        "pressAction",
        {
          nativeEvent: { event: "rename" },
        },
      )
    })

    expect(screen.getByTestId("user-calendar-rename-dialog")).toBeTruthy()
    expect(screen.getByTestId("user-calendar-rename-input").props.value).toBe(
      "ENSEEIHT",
    )
    // Rename opens a dialog, never the delete confirm.
    expect(actions.remove).not.toHaveBeenCalled()
  })

  it("closes the rename dialog on cancel without writing", async () => {
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)
    await act(async () => {
      fireEvent(
        screen.getByTestId("user-calendar-actions-cal-1"),
        "pressAction",
        {
          nativeEvent: { event: "rename" },
        },
      )
    })

    await act(async () => {
      fireEvent.press(screen.getByTestId("user-calendar-rename-cancel"))
    })

    expect(screen.queryByTestId("user-calendar-rename-dialog")).toBeNull()
    expect(renameActions.rename).not.toHaveBeenCalled()
  })

  describe("on Android", () => {
    usePlatform("android")

    it("renders the same overflow menu — no standalone trash affordance", async () => {
      mockUseUserCalendars.mockReturnValue([calendar()])
      await render(<UserCalendarsScreen />)

      expect(screen.getByLabelText("Show ENSEEIHT in the app")).toBeTruthy()
      expect(
        screen.getByRole("button", { name: "Actions for ENSEEIHT" }),
      ).toBeTruthy()
      // The standalone trash affordance is gone: the row header carries exactly
      // one control, the overflow trigger, and Delete lives inside its menu.
      expect(screen.getAllByRole("button", { name: /ENSEEIHT/ })).toHaveLength(
        1,
      )
      expect(
        screen.getByTestId("user-calendar-actions-cal-1").props.actions,
      ).toEqual([
        { id: "rename", title: "Rename" },
        {
          id: "delete",
          title: "Delete",
          image: "trash",
          attributes: { destructive: true },
        },
      ])
      expect(
        screen.getByRole("button", { name: "Add a calendar" }),
      ).toBeTruthy()
    })

    // MenuView does not self-open on Android: both the press and TalkBack's
    // `activate` action must reach the same imperative show().
    it("opens the menu imperatively on press and on the activate action", async () => {
      mockUseUserCalendars.mockReturnValue([calendar()])
      await render(<UserCalendarsScreen />)
      const trigger = screen.getByRole("button", {
        name: "Actions for ENSEEIHT",
      })

      expect(trigger.props.accessibilityActions).toEqual([{ name: "activate" }])

      await act(async () => {
        fireEvent.press(trigger)
      })
      expect(mockShow).toHaveBeenCalledTimes(1)

      await act(async () => {
        fireEvent(trigger, "accessibilityAction", {
          nativeEvent: { actionName: "activate" },
        })
      })
      expect(mockShow).toHaveBeenCalledTimes(2)

      // An unrelated action must not open it.
      await act(async () => {
        fireEvent(trigger, "accessibilityAction", {
          nativeEvent: { actionName: "increment" },
        })
      })
      expect(mockShow).toHaveBeenCalledTimes(2)
    })
  })

  it("does not wire the imperative open on iOS, where the menu opens natively", async () => {
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)
    const trigger = screen.getByRole("button", { name: "Actions for ENSEEIHT" })

    expect(trigger.props.accessibilityActions).toBeUndefined()
    await act(async () => {
      fireEvent.press(trigger)
    })
    expect(mockShow).not.toHaveBeenCalled()
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
