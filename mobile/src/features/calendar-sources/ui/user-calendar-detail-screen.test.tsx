import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { AccessibilityInfo, Alert } from "react-native"

import {
  useRenameCalendar,
  useUserCalendarActions,
  useUserCalendars,
} from "@/features/calendar-sources/data"
import { usePlatform } from "@/test-support/platform"

import { UserCalendarDetailScreen } from "./user-calendar-detail-screen"

// Per-calendar settings page rendered through the real native-settings seam
// (Jest stubs for SwiftUI/Compose), theme, and i18n. The reactive read and the
// action hooks are mocked so rename, optimistic visibility, confirm-gated
// delete, and the write-failure alert are provable without SQLite.

jest.mock("@/features/calendar-sources/data", () => ({
  ...jest.requireActual<object>(
    "@/features/calendar-sources/data/effective-name",
  ),
  useUserCalendars: jest.fn(),
  useUserCalendarActions: jest.fn(),
  useRenameCalendar: jest.fn(),
}))

const mockBack = jest.fn()
const mockScreenOptions = jest.fn()
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ options }: { options?: unknown }) => {
      mockScreenOptions(options)
      return null
    },
  },
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({ id: "cal-1" }),
  useRouter: () => ({ back: mockBack }),
}))

const mockUseUserCalendars = useUserCalendars as jest.Mock
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

async function pressDeleteAndChoose(buttonIndex: number) {
  const alertSpy = jest.spyOn(Alert, "alert")
  await fireEvent.press(screen.getByTestId("user-calendar-delete"))
  expect(alertSpy).toHaveBeenCalledWith(
    "Confirm deletion",
    "Are you sure you want to delete the calendar ENSEEIHT?",
    expect.any(Array),
  )
  const button = alertSpy.mock.calls[0]?.[2]?.[buttonIndex]
  await act(async () => {
    await button?.onPress?.()
  })
  return button
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseUserCalendars.mockReturnValue([calendar()])
  actions.setVisible.mockResolvedValue(true)
  actions.remove.mockResolvedValue(true)
  mockUseUserCalendarActions.mockReturnValue({ ...actions, failed: false })
  renameActions.rename.mockResolvedValue(undefined)
  mockUseRenameCalendar.mockReturnValue(renameActions)
})

describe("UserCalendarDetailScreen", () => {
  it("titles the page with the calendar name and lists its settings", async () => {
    await render(<UserCalendarDetailScreen />)
    expect(mockScreenOptions).toHaveBeenCalledWith({
      title: "ENSEEIHT",
      headerBackButtonDisplayMode: "minimal",
    })
    expect(
      screen.getByRole("button", { name: "Name" }).props.accessibilityHint,
    ).toBe("Rename calendar")
    expect(screen.getByText("ENSEEIHT")).toBeTruthy()
    expect(screen.getByTestId("user-calendar-school")).toBeTruthy()
    expect(screen.getByText("Toulouse INP")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Delete calendar" })).toBeTruthy()
    expect(screen.queryByTestId("user-calendars-write-error")).toBeNull()
  })

  it("falls back to the placeholder name and omits the school of a personal calendar", async () => {
    mockUseUserCalendars.mockReturnValue([
      calendar({ name: "  ", schoolName: null }),
    ])
    await render(<UserCalendarDetailScreen />)
    expect(mockScreenOptions).toHaveBeenCalledWith(
      expect.objectContaining({ title: "My timetable" }),
    )
    expect(screen.queryByTestId("user-calendar-school")).toBeNull()
  })

  it("renders an empty page for an unknown or deleted calendar", async () => {
    mockUseUserCalendars.mockReturnValue([calendar({ id: "other" })])
    await render(<UserCalendarDetailScreen />)
    expect(screen.queryByTestId("user-calendar-rename")).toBeNull()
    expect(mockScreenOptions).toHaveBeenCalledWith({ title: "" })
  })

  it("forwards the native switch value to setVisible", async () => {
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await render(<UserCalendarDetailScreen />)
    const visibilitySwitch = screen.getByRole("switch", {
      name: "Show in Home and Calendar",
      checked: true,
    })
    await fireEvent(visibilitySwitch, "valueChange", true)
    expect(actions.setVisible).toHaveBeenCalledWith("cal-1", true)
    expect(
      screen.getByText(
        "Events from this calendar appear in Home and Calendar. Turn off to hide them without deleting the calendar.",
      ),
    ).toBeTruthy()
  })

  it("updates visibility immediately and keeps it optimistic until the live query catches up", async () => {
    const write = deferred<boolean>()
    actions.setVisible.mockReturnValueOnce(write.promise)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await render(<UserCalendarDetailScreen />)

    const switchName = "Show in Home and Calendar"
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
    await render(<UserCalendarDetailScreen />)

    const visibilitySwitch = screen.getByRole("switch", {
      name: "Show in Home and Calendar",
    })
    await fireEvent(visibilitySwitch, "valueChange", false)
    await fireEvent(visibilitySwitch, "valueChange", true)
    await fireEvent(visibilitySwitch, "valueChange", false)

    expect(actions.setVisible).toHaveBeenCalledTimes(1)
    expect(actions.setVisible).toHaveBeenCalledWith("cal-1", false)
    expect(
      await screen.findByRole("switch", {
        name: "Show in Home and Calendar",
        checked: false,
      }),
    ).toBeTruthy()

    await act(async () => {
      firstWrite.resolve(true)
      await firstWrite.promise
    })
    await fireEvent(
      screen.getByRole("switch", {
        name: "Show in Home and Calendar",
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
    const view = await render(<UserCalendarDetailScreen />)
    const switchName = "Show in Home and Calendar"

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
    await view.rerender(<UserCalendarDetailScreen />)
    expect(
      screen.getByRole("switch", { name: switchName, checked: true }),
    ).toBeTruthy()

    await act(async () => {
      showWrite.resolve(true)
      await showWrite.promise
    })
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await view.rerender(<UserCalendarDetailScreen />)
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
    const view = await render(<UserCalendarDetailScreen />)
    const switchName = "Show in Home and Calendar"

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
    await view.rerender(<UserCalendarDetailScreen />)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: false })])
    await view.rerender(<UserCalendarDetailScreen />)

    expect(
      screen.getByRole("switch", { name: switchName, checked: false }),
    ).toBeTruthy()
    expect(actions.setVisible).toHaveBeenCalledTimes(2)
  })

  it("discards an old optimistic value after canonical visibility changes", async () => {
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    const view = await render(<UserCalendarDetailScreen />)
    const switchName = "Show in Home and Calendar"

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    await screen.findByRole("switch", { name: switchName, checked: false })

    mockUseUserCalendars.mockReturnValue([calendar({ visible: false })])
    await view.rerender(<UserCalendarDetailScreen />)
    await screen.findByRole("switch", { name: switchName, checked: false })

    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await view.rerender(<UserCalendarDetailScreen />)
    await screen.findByRole("switch", { name: switchName, checked: true })
  })

  it("rolls optimistic visibility back when persistence fails", async () => {
    actions.setVisible.mockResolvedValueOnce(false)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await render(<UserCalendarDetailScreen />)

    const switchName = "Show in Home and Calendar"
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
    await render(<UserCalendarDetailScreen />)
    const switchName = "Show in Home and Calendar"

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
    const view = await render(<UserCalendarDetailScreen />)
    const switchName = "Show in Home and Calendar"

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await view.rerender(<UserCalendarDetailScreen />)
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
    const view = await render(<UserCalendarDetailScreen />)
    const switchName = "Show in Home and Calendar"

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    mockUseUserCalendars.mockReturnValue([])
    await view.rerender(<UserCalendarDetailScreen />)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await view.rerender(<UserCalendarDetailScreen />)

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
    const view = await render(<UserCalendarDetailScreen />)
    const switchName = "Show in Home and Calendar"

    await fireEvent(
      screen.getByRole("switch", { name: switchName }),
      "valueChange",
      false,
    )
    mockUseUserCalendars.mockReturnValue([calendar({ visible: false })])
    await view.rerender(<UserCalendarDetailScreen />)
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await view.rerender(<UserCalendarDetailScreen />)
    await act(async () => {
      write.resolve(true)
      await write.promise
    })

    expect(
      screen.getByRole("switch", { name: switchName, checked: true }),
    ).toBeTruthy()
  })

  it("removes, announces, and pops back once the delete is confirmed", async () => {
    const announceSpy = jest.spyOn(
      AccessibilityInfo,
      "announceForAccessibility",
    )
    await render(<UserCalendarDetailScreen />)
    const confirm = await pressDeleteAndChoose(1)

    expect(confirm?.style).toBe("destructive")
    expect(actions.remove).toHaveBeenCalledWith("cal-1")
    expect(announceSpy).toHaveBeenCalledWith("ENSEEIHT deleted")
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it("does nothing when the delete confirm is cancelled", async () => {
    await render(<UserCalendarDetailScreen />)
    const cancel = await pressDeleteAndChoose(0)

    expect(cancel?.style).toBe("cancel")
    expect(cancel?.onPress).toBeUndefined()
    expect(actions.remove).not.toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it("stays on the page without announcing when the delete write fails", async () => {
    const announceSpy = jest.spyOn(
      AccessibilityInfo,
      "announceForAccessibility",
    )
    actions.remove.mockResolvedValue(false)
    await render(<UserCalendarDetailScreen />)
    await pressDeleteAndChoose(1)

    expect(actions.remove).toHaveBeenCalledWith("cal-1")
    expect(announceSpy).not.toHaveBeenCalledWith("ENSEEIHT deleted")
    expect(mockBack).not.toHaveBeenCalled()
  })

  it("shows the write failure as the page's first alert", async () => {
    mockUseUserCalendarActions.mockReturnValue({ ...actions, failed: true })
    await render(<UserCalendarDetailScreen />)
    expect(screen.getByTestId("user-calendars-write-error")).toBeTruthy()
    expect(screen.getByText("Couldn't update calendar")).toBeTruthy()
    expect(
      screen.getByTestId("user-calendars-write-error-message").props.children,
    ).toBe("We couldn't update your calendars. Please try again.")
  })

  it("opens the rename dialog seeded with the current name and closes it on cancel", async () => {
    await render(<UserCalendarDetailScreen />)
    expect(screen.queryByTestId("user-calendar-rename-dialog")).toBeNull()

    await fireEvent.press(screen.getByTestId("user-calendar-rename"))
    expect(screen.getByTestId("user-calendar-rename-dialog")).toBeTruthy()
    expect(screen.getByTestId("user-calendar-rename-input").props.value).toBe(
      "ENSEEIHT",
    )

    await fireEvent.press(screen.getByTestId("user-calendar-rename-cancel"))
    expect(screen.queryByTestId("user-calendar-rename-dialog")).toBeNull()
    expect(renameActions.rename).not.toHaveBeenCalled()
    expect(actions.remove).not.toHaveBeenCalled()
  })

  describe("on Android", () => {
    usePlatform("android")

    it("keeps the same rows, switch, and destructive action", async () => {
      await render(<UserCalendarDetailScreen />)
      expect(screen.getByTestId("user-calendar-rename")).toBeTruthy()
      await fireEvent(
        screen.getByTestId("user-calendar-visibility-cal-1"),
        "valueChange",
        false,
      )
      expect(actions.setVisible).toHaveBeenCalledWith("cal-1", false)
      await pressDeleteAndChoose(1)
      expect(actions.remove).toHaveBeenCalledWith("cal-1")
    })
  })
})
