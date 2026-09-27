import { fireEvent, render, screen } from "@testing-library/react-native"

import {
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"
import { usePlatform } from "@/test-support/platform"

import { UserCalendarsScreen } from "./user-calendars-screen"

// The calendar list rendered through the real native-settings seam (Jest stubs
// for SwiftUI/Compose), theme, and i18n. The reactive read and its loaded flag
// are mocked so the rows, load-gated empty state, and the platform-specific add
// affordance are provable without SQLite. Native header items are asserted
// through Stack.Screen options because the navigator chrome is outside the tree.

// `effectiveCalendarName` is spread back in from the real module: it is the pure
// display rule under test here, and stubbing it would destroy the fallback oracle.
jest.mock("@/features/calendar-sources/data", () => ({
  ...jest.requireActual<object>(
    "@/features/calendar-sources/data/effective-name",
  ),
  useUserCalendars: jest.fn(),
  useUserCalendarsLoaded: jest.fn(),
}))

jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native")
  return {
    SafeAreaView: ({
      children,
      ...props
    }: React.ComponentProps<typeof View>) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  }
})

const mockPush = jest.fn()
const mockScreenOptions = jest.fn()
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ options }: { options?: unknown }) => {
      mockScreenOptions(options)
      return null
    },
  },
  router: { push: (href: unknown) => mockPush(href) },
  useRouter: () => ({ push: mockPush }),
}))

const mockUseUserCalendars = useUserCalendars as jest.Mock
const mockUseUserCalendarsLoaded = useUserCalendarsLoaded as jest.Mock

const schoolSelection = {
  pathname: "/onboarding/school",
  params: { source: "calendar-management" },
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

type HeaderOptions = {
  headerBackButtonDisplayMode?: string
  unstable_headerRightItems?: () => {
    identifier: string
    onPress: () => void
  }[]
}

function headerOptions() {
  return mockScreenOptions.mock.lastCall?.[0] as HeaderOptions
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseUserCalendars.mockReturnValue([])
  mockUseUserCalendarsLoaded.mockReturnValue(true)
})

describe("UserCalendarsScreen", () => {
  it("renders the empty state once the read has resolved with no calendars", async () => {
    await render(<UserCalendarsScreen />)
    expect(screen.getByText("No calendars yet")).toBeTruthy()
    expect(screen.getByText("No calendars imported.")).toBeTruthy()
    expect(screen.queryByTestId("user-calendars-list")).toBeNull()
  })

  it("does not render the empty state (or its live region) before the read resolves", async () => {
    mockUseUserCalendarsLoaded.mockReturnValue(false)
    await render(<UserCalendarsScreen />)
    expect(screen.queryByText("No calendars yet")).toBeNull()
    expect(screen.queryByTestId("user-calendars-list")).toBeNull()
  })

  it("lists each calendar as a navigation row with its school and visibility", async () => {
    mockUseUserCalendars.mockReturnValue([
      calendar(),
      calendar({ id: "cal-2", name: "L3", visible: false }),
    ])
    await render(<UserCalendarsScreen />)

    const row = screen.getByRole("button", { name: "ENSEEIHT, Toulouse INP" })
    expect(row.props.accessibilityHint).toBe("Opens this calendar's settings")
    expect(row.props.accessibilityValue).toEqual({ text: "Shown" })
    expect(screen.getByTestId("user-calendar-row-cal-2")).toBeTruthy()
    expect(screen.getByText("Hidden")).toBeTruthy()
    expect(
      screen.getByText(
        "Tap a calendar to choose whether it appears in Home and Calendar, rename it, or delete it.",
      ),
    ).toBeTruthy()

    await fireEvent.press(row)
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/user-calendars/[id]",
      params: { id: "cal-1" },
    })
  })

  it("falls back to placeholders for an empty name and a personal (no-school) calendar", async () => {
    mockUseUserCalendars.mockReturnValue([
      calendar({ id: "cal-2", name: "", schoolName: undefined }),
    ])
    await render(<UserCalendarsScreen />)
    expect(
      screen.getByRole("button", { name: "My timetable, Personal calendar" }),
    ).toBeTruthy()
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

  it("routes the iOS header add action to school selection", async () => {
    await render(<UserCalendarsScreen />)
    const options = headerOptions()
    const [add] = options.unstable_headerRightItems?.() ?? []
    expect(add?.identifier).toBe("user-calendars-add")
    add?.onPress()
    expect(mockPush).toHaveBeenCalledWith(schoolSelection)
    expect(options.headerBackButtonDisplayMode).toBe("minimal")
    expect(screen.queryByTestId("user-calendars-add")).toBeNull()
  })

  describe("on Android", () => {
    usePlatform("android")

    it("adds through a Material FAB instead of a header item", async () => {
      mockUseUserCalendars.mockReturnValue([calendar()])
      await render(<UserCalendarsScreen />)

      expect(headerOptions().unstable_headerRightItems).toBeUndefined()
      expect(screen.getByLabelText("Add a calendar")).toBeTruthy()
      await fireEvent.press(screen.getByTestId("user-calendars-add"))
      expect(mockPush).toHaveBeenCalledWith(schoolSelection)
    })

    it("keeps the FAB on the empty state", async () => {
      await render(<UserCalendarsScreen />)
      expect(screen.getByText("No calendars yet")).toBeTruthy()
      expect(screen.getByTestId("user-calendars-add")).toBeTruthy()
    })
  })
})
