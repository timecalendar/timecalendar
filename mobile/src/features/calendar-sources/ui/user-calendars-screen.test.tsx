import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native"
import { AccessibilityInfo, Alert, Platform } from "react-native"

import {
  useUserCalendarActions,
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"

import { UserCalendarsScreen } from "./user-calendars-screen"

// Presentational management screen (70% floor): renders through the real theme +
// i18n trees. The reactive read, its loaded flag, and the actions hook are mocked
// so the list, the row-level visibility toggle, the confirm-gated delete (button +
// accessibility action), the load-gated empty state, and the failure surface are
// provable without a SQLite dependency. The iOS swipe pan is device-only —
// ReanimatedSwipeable is stubbed to a passthrough so the covered paths don't drag
// in the Reanimated worklet runtime; the swipe gesture itself is NOT simulated.
// Stack.Screen renders only its headerRight (the add action) — the navigator chrome
// is outside the test tree.

jest.mock("@/features/calendar-sources/data", () => ({
  useUserCalendars: jest.fn(),
  useUserCalendarsLoaded: jest.fn(),
  useUserCalendarActions: jest.fn(),
}))

const mockPush = jest.fn()
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({
      options,
    }: {
      options?: { headerRight?: () => React.ReactNode }
    }) => options?.headerRight?.() ?? null,
  },
  useRouter: () => ({ push: mockPush }),
}))

jest.mock(
  "react-native-gesture-handler/ReanimatedSwipeable",
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children,
)

const mockUseUserCalendars = useUserCalendars as jest.Mock
const mockUseUserCalendarsLoaded = useUserCalendarsLoaded as jest.Mock
const mockUseUserCalendarActions = useUserCalendarActions as jest.Mock

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
    // The row text is hidden from AT (the toggle label carries name+school), so
    // it stays visually rendered but out of the accessibility tree.
    expect(
      screen.getByText("ENSEEIHT", { includeHiddenElements: true }),
    ).toBeTruthy()
    expect(
      screen.getByText("Toulouse INP", { includeHiddenElements: true }),
    ).toBeTruthy()
  })

  it("falls back to placeholders for an empty name and a personal (no-school) calendar", async () => {
    mockUseUserCalendars.mockReturnValue([
      calendar({ id: "cal-2", name: "", schoolName: undefined }),
    ])
    await render(<UserCalendarsScreen />)
    expect(
      screen.getByText("Calendar", { includeHiddenElements: true }),
    ).toBeTruthy()
    expect(
      screen.getByText("Personal calendar", { includeHiddenElements: true }),
    ).toBeTruthy()
  })

  it("toggles visibility through setVisible(id, !visible) on the row toggle", async () => {
    mockUseUserCalendars.mockReturnValue([calendar({ visible: true })])
    await render(<UserCalendarsScreen />)
    const user = userEvent.setup()
    await user.press(screen.getByLabelText("ENSEEIHT, Toulouse INP"))
    expect(actions.setVisible).toHaveBeenCalledWith("cal-1", false)
  })

  it("routes the header add action to school selection", async () => {
    await render(<UserCalendarsScreen />)
    const user = userEvent.setup()
    await user.press(screen.getByLabelText("Add a calendar"))
    expect(mockPush).toHaveBeenCalledWith("/onboarding/school")
  })

  it("opens the delete confirm and removes + announces on confirm", async () => {
    const alertSpy = jest.spyOn(Alert, "alert")
    const announceSpy = jest.spyOn(
      AccessibilityInfo,
      "announceForAccessibility",
    )
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)
    const user = userEvent.setup()
    await user.press(screen.getByLabelText("Delete calendar ENSEEIHT"))

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
    const user = userEvent.setup()
    await user.press(screen.getByLabelText("Delete calendar ENSEEIHT"))

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
    const user = userEvent.setup()
    await user.press(screen.getByLabelText("Delete calendar ENSEEIHT"))

    const buttons = alertSpy.mock.calls[0]?.[2]
    await buttons?.[1]?.onPress?.()

    expect(actions.remove).toHaveBeenCalledWith("cal-1")
    expect(announceSpy).not.toHaveBeenCalled()
  })

  it("reaches delete through the row toggle's accessibility action", async () => {
    const alertSpy = jest.spyOn(Alert, "alert")
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)

    // The action is fired on the toggle element (a real accessibility element AT
    // can reach), not the plain parent row View.
    fireEvent(
      screen.getByTestId("user-calendar-row-cal-1"),
      "accessibilityAction",
      {
        nativeEvent: { actionName: "delete" },
      },
    )
    expect(alertSpy).toHaveBeenCalled()
  })

  it("renders the Android row shape: bare row + a text delete affordance, both controls reachable", async () => {
    jest.replaceProperty(Platform, "OS", "android")
    mockUseUserCalendars.mockReturnValue([calendar()])
    await render(<UserCalendarsScreen />)

    expect(screen.getByLabelText("ENSEEIHT, Toulouse INP")).toBeTruthy()
    expect(screen.getByLabelText("Delete calendar ENSEEIHT")).toBeTruthy()
    expect(screen.getByText("Delete")).toBeTruthy()
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
