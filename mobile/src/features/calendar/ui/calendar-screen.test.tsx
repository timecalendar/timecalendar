import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { router } from "expo-router"

import { useCalendarEvents, useSyncCalendars } from "@/features/calendar/data"

import { CalendarScreen } from "./calendar-screen"

// Presentational screen (70% floor): renders through the real theme + i18n
// trees. The calendar-kit grid is mocked suite-wide (jest/setup-calendar-kit) so
// its mocked CalendarBody invokes renderEvent per event — proving the screen's
// event→tile wiring + the CalendarEvent→EventItem mapping + theme/label plumbing
// without the Reanimated grid (D7). The events-source seam + the sync orchestrator
// are mocked here to drive deterministic state without a SQLite/network dependency.

jest.mock("@/features/calendar/data", () => {
  const actual = jest.requireActual("@/features/calendar/data")
  return {
    ...actual,
    useCalendarEvents: jest.fn(),
    useSyncCalendars: jest.fn(),
  }
})

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}))

const mockUseCalendarEvents = useCalendarEvents as jest.Mock
const mockUseSyncCalendars = useSyncCalendars as jest.Mock
const mockSync = jest.fn()
const mockPush = router.push as jest.Mock

function syncState(overrides = {}) {
  return {
    sync: mockSync,
    isSyncing: false,
    isError: false,
    reset: jest.fn(),
    ...overrides,
  }
}

function calendarEvent(overrides = {}) {
  // Local-time dates so the formatted "09:00–10:30" label is TZ-independent.
  const startsAt = new Date(2026, 5, 16, 9, 0, 0, 0)
  const endsAt = new Date(2026, 5, 16, 10, 30, 0, 0)
  return {
    id: "ev-1",
    title: "Algorithms",
    color: "#1E88E5",
    startsAt,
    endsAt,
    location: "Room A1",
    allDay: false,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: undefined,
    ...overrides,
  }
}

beforeEach(() => {
  mockUseCalendarEvents.mockReturnValue([calendarEvent()])
  mockSync.mockReset()
  mockPush.mockReset()
  mockUseSyncCalendars.mockReturnValue(syncState())
})

describe("CalendarScreen", () => {
  it("renders the localized title (not the key)", async () => {
    await render(<CalendarScreen />)
    expect(screen.getByText("Calendar")).toBeTruthy()
  })

  it("renders a fixture event's tile with its title and location", async () => {
    await render(<CalendarScreen />)
    expect(screen.getByText("Algorithms")).toBeTruthy()
    expect(screen.getByText("Room A1")).toBeTruthy()
  })

  it("exposes an accessible label combining title, time and location", async () => {
    await render(<CalendarScreen />)
    expect(
      screen.getByLabelText("Algorithms, 09:00–10:30 Room A1"),
    ).toBeTruthy()
  })

  it("defaults to the week view selected and toggles to day", async () => {
    await render(<CalendarScreen />)
    const day = screen.getByTestId("calendar-view-day")
    const week = screen.getByTestId("calendar-view-week")
    expect(week.props.accessibilityState.selected).toBe(true)
    expect(day.props.accessibilityState.selected).toBe(false)

    fireEvent.press(day)
    await waitFor(() => {
      expect(
        screen.getByTestId("calendar-view-day").props.accessibilityState
          .selected,
      ).toBe(true)
    })
    expect(
      screen.getByTestId("calendar-view-week").props.accessibilityState
        .selected,
    ).toBe(false)
  })

  it("shows the empty-range state when no events intersect", async () => {
    mockUseCalendarEvents.mockReturnValue([])
    await render(<CalendarScreen />)
    expect(screen.getByText("No events this period.")).toBeTruthy()
  })

  it("switches to the agenda view and renders a day header + tile", async () => {
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("calendar-view-agenda"))

    await waitFor(() => {
      expect(
        screen.getByTestId("calendar-view-agenda").props.accessibilityState
          .selected,
      ).toBe(true)
    })

    // 2026-06-16 is a Tuesday — the formatted day header (weekday + day number).
    expect(screen.getByText("TUE")).toBeTruthy()
    expect(screen.getByText("16")).toBeTruthy()
    // The fixture event's tile renders with its title + formatted time range.
    expect(screen.getByText("Algorithms")).toBeTruthy()
    expect(screen.getByText("09:00 – 10:30")).toBeTruthy()
  })

  it("shows the agenda empty state when no events intersect", async () => {
    mockUseCalendarEvents.mockReturnValue([])
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("calendar-view-agenda"))
    await waitFor(() => {
      expect(screen.getByText("No events this period.")).toBeTruthy()
    })
  })

  it("renders an accessible sync-error with a retry that re-syncs", async () => {
    mockUseSyncCalendars.mockReturnValue(syncState({ isError: true }))
    await render(<CalendarScreen />)

    expect(
      screen.getByText(
        "We couldn't refresh your calendar. Showing your last update.",
      ),
    ).toBeTruthy()
    const retry = screen.getByTestId("calendar-sync-retry")
    expect(retry.props.accessibilityLabel).toBe(
      "Retry refreshing your calendar",
    )
    fireEvent.press(retry)
    expect(mockSync).toHaveBeenCalledTimes(1)
  })

  it("does not render the sync-error banner when there is no error", async () => {
    await render(<CalendarScreen />)
    expect(screen.queryByTestId("calendar-sync-error")).toBeNull()
  })

  it("pull-to-refresh on the agenda triggers a sync", async () => {
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("calendar-view-agenda"))
    await waitFor(() => {
      expect(
        screen.getByTestId("calendar-view-agenda").props.accessibilityState
          .selected,
      ).toBe(true)
    })

    // The agenda SectionList's RefreshControl — fire its onRefresh prop.
    const list = screen.getByTestId("agenda-section-list")
    list.props.refreshControl.props.onRefresh()
    expect(mockSync).toHaveBeenCalledTimes(1)
  })

  it("routes a synced grid-event press to the read-only details screen", async () => {
    mockUseCalendarEvents.mockReturnValue([
      calendarEvent({ id: "synced-1", userCalendarId: "cal-1" }),
    ])
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("grid-event-synced-1"))
    expect(mockPush).toHaveBeenCalledWith("/event-details/synced-1")
  })

  it("routes a personal grid-event press to the existing edit form", async () => {
    mockUseCalendarEvents.mockReturnValue([
      calendarEvent({ id: "personal-1", userCalendarId: undefined }),
    ])
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("grid-event-personal-1"))
    expect(mockPush).toHaveBeenCalledWith("/personal-event-form?uid=personal-1")
  })

  it("makes the agenda tile a touchable button that routes by origin", async () => {
    mockUseCalendarEvents.mockReturnValue([
      calendarEvent({ id: "synced-1", userCalendarId: "cal-1" }),
    ])
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("calendar-view-agenda"))
    await waitFor(() => {
      expect(
        screen.getByTestId("calendar-view-agenda").props.accessibilityState
          .selected,
      ).toBe(true)
    })

    const tile = screen.getByLabelText(
      "Algorithms, 09:00 – 10:30 Room A1. View details",
    )
    expect(tile.props.accessibilityRole).toBe("button")
    fireEvent.press(tile)
    expect(mockPush).toHaveBeenCalledWith("/event-details/synced-1")
  })
})
