import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { router } from "expo-router"

import { useCalendarEvents, useSyncCalendars } from "@/features/calendar/data"

import { HomeScreen } from "./home-screen"

// Presentational screen (70% floor): renders through the real theme + i18n trees.
// The events-source seam + the sync orchestrator are mocked here to drive
// deterministic state without a SQLite/network dependency. No calendar-kit is used
// on home (the today timeline is the custom overlap grid), so no calendar-kit mock
// is needed. The home selectors run for real (pure). Tap routing + pull-to-refresh
// wiring are asserted against the mocked router/sync.

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
  // The "Add personal event" Link renders its asChild Pressable child.
  Link: ({ children }: { children: React.ReactNode }) => children,
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

// An event TODAY (so displayedDay picks today and the timeline/now-indicator show).
function todayEvent(overrides = {}) {
  const base = new Date()
  base.setHours(9, 0, 0, 0)
  const start = new Date(base)
  start.setHours(start.getHours() + 1) // keep it after `now` so it counts as today
  const end = new Date(start)
  end.setHours(end.getHours() + 1)
  return {
    id: "ev-1",
    title: "Algorithms",
    color: "#1E88E5",
    startsAt: start,
    endsAt: end,
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
  mockSync.mockReset()
  mockPush.mockReset()
  mockUseSyncCalendars.mockReturnValue(syncState())
  mockUseCalendarEvents.mockReturnValue([])
})

describe("HomeScreen", () => {
  it("renders the app-name heading and the empty-day state when there are no events", async () => {
    await render(<HomeScreen />)
    expect(screen.getByText("TimeCalendar")).toBeTruthy()
    expect(screen.getByText("Nothing planned.")).toBeTruthy()
    expect(screen.getByText("No events for this day.")).toBeTruthy()
    // No scroller / timeline when the day is empty.
    expect(screen.queryByTestId("upcoming-scroller")).toBeNull()
    expect(screen.queryByTestId("today-timeline")).toBeNull()
  })

  it("renders the scroller and timeline with the day's events", async () => {
    mockUseCalendarEvents.mockReturnValue([todayEvent()])
    await render(<HomeScreen />)
    expect(screen.getByTestId("upcoming-scroller")).toBeTruthy()
    expect(screen.getByTestId("today-timeline")).toBeTruthy()
    // The pluralized count line (one event).
    expect(screen.getByText("1 event")).toBeTruthy()
    // The card + tile both render the title.
    expect(screen.getAllByText("Algorithms").length).toBeGreaterThan(0)
  })

  it("routes a personal-event card to its edit form", async () => {
    mockUseCalendarEvents.mockReturnValue([todayEvent()])
    await render(<HomeScreen />)
    fireEvent.press(screen.getByTestId("upcoming-card-ev-1"))
    expect(mockPush).toHaveBeenCalledWith("/personal-event-form?uid=ev-1")
  })

  it("routes a synced-event tile to the read-only details screen", async () => {
    mockUseCalendarEvents.mockReturnValue([
      todayEvent({ id: "sync-1", userCalendarId: "cal-1" }),
    ])
    await render(<HomeScreen />)
    fireEvent.press(screen.getByTestId("today-tile-sync-1"))
    expect(mockPush).toHaveBeenCalledWith("/event-details/sync-1")
  })

  it("pull-to-refresh calls sync()", async () => {
    await render(<HomeScreen />)
    const scroll = screen.getByTestId("home-scroll")
    scroll.props.refreshControl.props.onRefresh()
    expect(mockSync).toHaveBeenCalled()
  })

  it("shows the accessible error banner with a retry that re-syncs", async () => {
    mockUseSyncCalendars.mockReturnValue(syncState({ isError: true }))
    await render(<HomeScreen />)
    expect(screen.getByTestId("home-sync-error")).toBeTruthy()
    fireEvent.press(screen.getByTestId("home-sync-retry"))
    expect(mockSync).toHaveBeenCalled()
  })

  it("exposes the Add personal event control", async () => {
    await render(<HomeScreen />)
    await waitFor(() => {
      expect(screen.getByTestId("home-add-personal-event")).toBeTruthy()
    })
  })
})
