import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { useSyncedEvents } from "@/features/calendar/data"
import { useHiddenEvents, useHideActions } from "@/features/hidden-events/data"
import i18n from "@/i18n"

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

beforeEach(async () => {
  await i18n.changeLanguage("en")
  jest.clearAllMocks()
  mockUseSyncedEvents.mockReturnValue([])
  mockUseHideActions.mockReturnValue({ ...hideActions, failed: false })
  mockUseHiddenEvents.mockReturnValue({
    uidHiddenEvents: [],
    namedHiddenEvents: [],
  })
})

describe("HiddenEventsScreen", () => {
  it.each([
    [390, 24, 848],
    [1024, 64, 928],
  ])(
    "uses one measured standard list lane at %ipx",
    async (width, gutter, maxWidth) => {
      mockUseHiddenEvents.mockReturnValue({
        uidHiddenEvents: [],
        namedHiddenEvents: ["Algorithms"],
      })
      const view = await render(<HiddenEventsScreen />)
      await act(() =>
        fireEvent(view.getByTestId("hidden-events-layout-owner"), "layout", {
          nativeEvent: { layout: { width, height: 0, x: 0, y: 0 } },
        }),
      )
      expect(
        StyleSheet.flatten(
          view.getByTestId("hidden-events-responsive-content").props
            .contentContainerStyle,
        ),
      ).toMatchObject({ maxWidth, paddingHorizontal: gutter })
    },
  )

  it("renders the empty state when nothing is hidden", async () => {
    await render(<HiddenEventsScreen />)
    expect(screen.getByText("No hidden events")).toBeTruthy()
    expect(screen.getByText("Events you hide will appear here.")).toBeTruthy()
    expect(
      screen.getByTestId("hidden-events-empty-artwork", {
        includeHiddenElements: true,
      }),
    ).toHaveProp("accessible", false)
  })

  it("renders the exact French empty title and caption", async () => {
    await i18n.changeLanguage("fr")
    await render(<HiddenEventsScreen />)
    expect(screen.getByText("Aucun événement masqué")).toBeTruthy()
    expect(
      screen.getByText("Les événements que vous masquez apparaîtront ici."),
    ).toBeTruthy()
  })

  it("keeps a write failure distinct when rendered entries are empty", async () => {
    mockUseHideActions.mockReturnValue({ ...hideActions, failed: true })
    await render(<HiddenEventsScreen />)
    expect(screen.getByTestId("hidden-events-empty")).toBeTruthy()
    expect(
      screen.getByText(
        "We couldn't update your hidden events. Please try again.",
      ),
    ).toBeTruthy()
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
    expect(screen.getByText("No hidden events")).toBeTruthy()
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
