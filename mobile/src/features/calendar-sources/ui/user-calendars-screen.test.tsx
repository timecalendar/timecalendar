import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { AccessibilityInfo, Alert, FlatList, StyleSheet } from "react-native"

import {
  useRenameCalendar,
  useUserCalendarActions,
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"
import { usePlatform } from "@/test-support/platform"
import { Spacing } from "@/theme"

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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
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

  it("renders calendars through an id-keyed virtualized list", async () => {
    const calendars = [calendar(), calendar({ id: "cal-2", name: "L3" })]
    const renderList = jest.spyOn(FlatList.prototype, "render")
    mockUseUserCalendars.mockReturnValue(calendars)
    await render(<UserCalendarsScreen />)

    const list = (
      renderList.mock.contexts as FlatList<ReturnType<typeof calendar>>[]
    ).find((instance) => instance.props.testID === "user-calendars-list")
    if (!list)
      throw new Error("Expected UserCalendarsScreen to render FlatList")
    expect(list.props.data).toBe(calendars)
    expect(list.props.keyExtractor?.(calendars[0]!, 0)).toBe("cal-1")
    expect(list.props.keyExtractor?.(calendars[1]!, 1)).toBe("cal-2")
    renderList.mockRestore()
    expect(
      StyleSheet.flatten(list.props.contentContainerStyle).paddingBottom,
    ).toBe(Spacing.four)
    expect(screen.getByTestId("user-calendar-row-cal-1")).toBeTruthy()
    expect(screen.getByTestId("user-calendar-row-cal-2")).toBeTruthy()
    expect(
      screen.getByText("Choose which calendars appear in Home and Calendar."),
    ).toBeTruthy()
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
    await fireEvent(visibilitySwitch, "valueChange", true)
    expect(actions.setVisible).toHaveBeenCalledWith("cal-1", true)
    expect(visibilitySwitch.props.accessibilityHint).toBe(
      "Controls whether events from this calendar appear in Home and Calendar",
    )
  })

  it("updates visibility immediately and keeps it optimistic until the live query catches up", async () => {
    const write = deferred<boolean>()
    actions.setVisible.mockReturnValueOnce(write.promise)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await render(<UserCalendarsScreen />)

    const switchName = "Show ENSEEIHT in the app"
    const originalSwitch = screen.getByRole("switch", { name: switchName })
    await fireEvent(originalSwitch, "valueChange", false)
    expect(actions.setVisible).toHaveBeenCalledTimes(1)
    await screen.findByRole("switch", {
      name: switchName,
      checked: false,
    })
    await act(async () => {
      write.resolve(true)
      await write.promise
    })
    expect(
      screen.getByRole("switch", { name: switchName, checked: false }),
    ).toBeTruthy()
  })

  it("ignores rapid repeated and opposing input until the write settles", async () => {
    const firstWrite = deferred<boolean>()
    const secondWrite = deferred<boolean>()
    actions.setVisible
      .mockReturnValueOnce(firstWrite.promise)
      .mockReturnValueOnce(secondWrite.promise)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await render(<UserCalendarsScreen />)

    const visibilitySwitch = screen.getByRole("switch", {
      name: "Show ENSEEIHT in the app",
    })
    await fireEvent(visibilitySwitch, "valueChange", false)
    await fireEvent(visibilitySwitch, "valueChange", true)
    await fireEvent(visibilitySwitch, "valueChange", false)

    expect(actions.setVisible).toHaveBeenCalledTimes(1)
    expect(actions.setVisible).toHaveBeenCalledWith("cal-1", false)
    expect(
      await screen.findByRole("switch", {
        name: "Show ENSEEIHT in the app",
        checked: false,
      }),
    ).toBeTruthy()

    await act(async () => {
      firstWrite.resolve(true)
      await firstWrite.promise
    })
    await fireEvent(
      screen.getByRole("switch", {
        name: "Show ENSEEIHT in the app",
      }),
      "valueChange",
      true,
    )
    expect(actions.setVisible).toHaveBeenCalledTimes(2)
    expect(actions.setVisible).toHaveBeenLastCalledWith("cal-1", true)
  })

  it("does not let a delayed prior echo acknowledge a newer operation", async () => {
    const hideWrite = deferred<boolean>()
    const showWrite = deferred<boolean>()
    actions.setVisible
      .mockReturnValueOnce(hideWrite.promise)
      .mockReturnValueOnce(showWrite.promise)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    const view = await render(<UserCalendarsScreen />)
    const switchName = "Show ENSEEIHT in the app"

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    await act(async () => {
      hideWrite.resolve(true)
      await hideWrite.promise
    })

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      true,
    )
    expect(actions.setVisible).toHaveBeenLastCalledWith("cal-1", true)

    mockUseUserCalendars.mockReturnValue([calendar({ visible: false })])
    await view.rerender(<UserCalendarsScreen />)
    expect(
      screen.getByRole("switch", { name: switchName, checked: true }),
    ).toBeTruthy()

    await act(async () => {
      showWrite.resolve(true)
      await showWrite.promise
    })
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await view.rerender(<UserCalendarsScreen />)
    expect(
      screen.getByRole("switch", { name: switchName, checked: true }),
    ).toBeTruthy()
  })

  it("retires a newer operation after a coalesced final echo", async () => {
    const hideWrite = deferred<boolean>()
    const showWrite = deferred<boolean>()
    actions.setVisible
      .mockReturnValueOnce(hideWrite.promise)
      .mockReturnValueOnce(showWrite.promise)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    const view = await render(<UserCalendarsScreen />)
    const switchName = "Show ENSEEIHT in the app"

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    await act(async () => {
      hideWrite.resolve(true)
      await hideWrite.promise
    })

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      true,
    )
    await act(async () => {
      showWrite.resolve(true)
      await showWrite.promise
    })

    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await view.rerender(<UserCalendarsScreen />)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: false })])
    await view.rerender(<UserCalendarsScreen />)

    expect(
      screen.getByRole("switch", { name: switchName, checked: false }),
    ).toBeTruthy()
    expect(actions.setVisible).toHaveBeenCalledTimes(2)
  })

  it("discards an old optimistic value after canonical visibility changes", async () => {
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    const view = await render(<UserCalendarsScreen />)
    const switchName = "Show ENSEEIHT in the app"
    const originalDeleteAction = screen.getByTestId(
      "user-calendar-actions-cal-1",
    )

    await fireEvent(
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
    await fireEvent(
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

  it("releases the visibility guard when persistence rejects", async () => {
    actions.setVisible.mockRejectedValueOnce(new Error("write failed"))
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await render(<UserCalendarsScreen />)
    const switchName = "Show ENSEEIHT in the app"

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )

    expect(
      screen.getByRole("switch", { name: switchName, checked: true }),
    ).toBeTruthy()
    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    expect(actions.setVisible).toHaveBeenCalledTimes(2)
  })

  it("rolls a failed write back to the latest canonical value", async () => {
    const write = deferred<boolean>()
    actions.setVisible.mockReturnValueOnce(write.promise)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    const view = await render(<UserCalendarsScreen />)
    const switchName = "Show ENSEEIHT in the app"

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await view.rerender(<UserCalendarsScreen />)
    await act(async () => {
      write.resolve(false)
      await write.promise
    })

    expect(
      screen.getByRole("switch", { name: switchName, checked: true }),
    ).toBeTruthy()
  })

  it("keeps an operation across row unmount and remount", async () => {
    const write = deferred<boolean>()
    actions.setVisible.mockReturnValueOnce(write.promise)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    const view = await render(<UserCalendarsScreen />)
    const switchName = "Show ENSEEIHT in the app"

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    mockUseUserCalendars.mockReturnValue([])
    await view.rerender(<UserCalendarsScreen />)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await view.rerender(<UserCalendarsScreen />)

    expect(
      screen.getByRole("switch", { name: switchName, checked: false }),
    ).toBeTruthy()
    expect(actions.setVisible).toHaveBeenCalledTimes(1)
    await act(async () => {
      write.resolve(true)
      await write.promise
    })
  })

  it("ignores a completion after acknowledgement and an external reversal", async () => {
    const write = deferred<boolean>()
    actions.setVisible.mockReturnValueOnce(write.promise)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    const view = await render(<UserCalendarsScreen />)
    const switchName = "Show ENSEEIHT in the app"

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    mockUseUserCalendars.mockReturnValue([calendar({ visible: false })])
    await view.rerender(<UserCalendarsScreen />)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await view.rerender(<UserCalendarsScreen />)
    await act(async () => {
      write.resolve(true)
      await write.promise
    })

    expect(
      screen.getByRole("switch", { name: switchName, checked: true }),
    ).toBeTruthy()
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
    await fireEvent(
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
    await fireEvent(
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
    await fireEvent(
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

    await fireEvent(
      screen.getByTestId("user-calendar-actions-cal-1"),
      "pressAction",
      {
        nativeEvent: { event: "rename" },
      },
    )

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
    await fireEvent(
      screen.getByTestId("user-calendar-actions-cal-1"),
      "pressAction",
      {
        nativeEvent: { event: "rename" },
      },
    )

    await fireEvent.press(screen.getByTestId("user-calendar-rename-cancel"))

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
      expect(
        StyleSheet.flatten(
          screen.getByTestId("user-calendars-list").props.contentContainerStyle,
        ).paddingBottom,
      ).toBe(Spacing.six + Spacing.five)
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

      await fireEvent.press(trigger)
      expect(mockShow).toHaveBeenCalledTimes(1)

      await fireEvent(trigger, "accessibilityAction", {
        nativeEvent: { actionName: "activate" },
      })
      expect(mockShow).toHaveBeenCalledTimes(2)

      // An unrelated action must not open it.
      await fireEvent(trigger, "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      })
      expect(mockShow).toHaveBeenCalledTimes(2)
    })
  })

  it("does not wire the imperative open on iOS, where the menu opens natively", async () => {
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)
    const trigger = screen.getByRole("button", { name: "Actions for ENSEEIHT" })

    expect(trigger.props.accessibilityActions).toBeUndefined()
    await fireEvent.press(trigger)
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
