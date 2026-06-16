import { render, screen, userEvent } from "@testing-library/react-native"

import { useSyncedEvents } from "@/features/calendar/data"
import { useHiddenEvents, useHideActions } from "@/features/hidden-events/data"

import { HiddenEventsScreen } from "./hidden-events-screen"

// Presentational management screen (70% floor): renders through the real theme +
// i18n trees. The hidden set, the synced-events read (uid → title/time
// resolution), and the hide actions are mocked so the lists + un-hide wiring +
// the empty state are provable without an MMKV/SQLite dependency. Stack.Screen is
// a no-op (it sets the header title outside a navigator).

jest.mock("@/features/calendar/data", () => ({
  useSyncedEvents: jest.fn(),
  formatTimeRange: () => "09:00 – 10:30",
  resolveLocale: () => "en",
}))

jest.mock("@/features/hidden-events/data", () => ({
  useHiddenEvents: jest.fn(),
  useHideActions: jest.fn(),
}))

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
}))

const mockUseHiddenEvents = useHiddenEvents as jest.Mock
const mockUseHideActions = useHideActions as jest.Mock
const mockUseSyncedEvents = useSyncedEvents as jest.Mock

const hideActions = {
  hideByUid: jest.fn(),
  hideByName: jest.fn(),
  unhideUid: jest.fn(),
  unhideName: jest.fn(),
  failed: false,
}

function syncedEvent(id: string, title: string) {
  return {
    id,
    title,
    color: "#1E88E5",
    startsAt: new Date(2026, 5, 16, 9, 0),
    endsAt: new Date(2026, 5, 16, 10, 30),
    location: undefined,
    allDay: false,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: "cal-1",
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseSyncedEvents.mockReturnValue([])
  mockUseHideActions.mockReturnValue({ ...hideActions, failed: false })
  mockUseHiddenEvents.mockReturnValue({
    uidHiddenEvents: [],
    namedHiddenEvents: [],
  })
})

describe("HiddenEventsScreen", () => {
  it("renders the empty state when nothing is hidden", async () => {
    await render(<HiddenEventsScreen />)
    expect(screen.getByText("No hidden events.")).toBeTruthy()
  })

  it("lists name-hidden titles with an un-hide control", async () => {
    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: [],
      namedHiddenEvents: ["Algorithms"],
    })
    await render(<HiddenEventsScreen />)
    expect(screen.getByText("Hidden by name")).toBeTruthy()
    expect(screen.getByText("Algorithms")).toBeTruthy()

    const user = userEvent.setup()
    await user.press(screen.getByLabelText("Un-hide Algorithms"))
    expect(hideActions.unhideName).toHaveBeenCalledWith("Algorithms")
  })

  it("lists a resolving uid-hidden event with its title + time and un-hides it", async () => {
    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: ["ev-1"],
      namedHiddenEvents: [],
    })
    mockUseSyncedEvents.mockReturnValue([syncedEvent("ev-1", "Lecture")])
    await render(<HiddenEventsScreen />)
    expect(screen.getByText("Lecture")).toBeTruthy()
    expect(screen.getByText("09:00 – 10:30")).toBeTruthy()

    const user = userEvent.setup()
    await user.press(screen.getByLabelText("Un-hide Lecture"))
    expect(hideActions.unhideUid).toHaveBeenCalledWith("ev-1")
  })

  it("does NOT list a uid-hidden event that no longer resolves (Flutter parity)", async () => {
    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: ["gone-uid"],
      namedHiddenEvents: [],
    })
    mockUseSyncedEvents.mockReturnValue([syncedEvent("ev-1", "Lecture")])
    await render(<HiddenEventsScreen />)
    // The non-resolving uid is not shown; with nothing else hidden, the screen
    // shows the empty state.
    expect(screen.getByText("No hidden events.")).toBeTruthy()
  })

  it("surfaces an accessible failure state when an un-hide write failed", async () => {
    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: [],
      namedHiddenEvents: ["Algorithms"],
    })
    mockUseHideActions.mockReturnValue({ ...hideActions, failed: true })
    await render(<HiddenEventsScreen />)
    expect(
      screen.getByText(
        "We couldn't update your hidden events. Please try again.",
      ),
    ).toBeTruthy()
  })
})
