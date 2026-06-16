import { render, screen, userEvent } from "@testing-library/react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { ReactElement } from "react"
import { Alert } from "react-native"

import { type EventDetails, useEventDetails } from "@/features/calendar/data"
import { useUserCalendars } from "@/features/calendar-sources"
import { useHiddenEvents, useHideActions } from "@/features/hidden-events/data"

import { EventDetailsScreen } from "./event-details-screen"

// Presentational read-only screen (70% floor): renders through the real theme +
// i18n trees. The rich read (useEventDetails) + the user-calendars read + the
// uid route param + the hidden-events seam are mocked so the row→sections wiring,
// the not-found state, and the synced-only hide/un-hide action are provable
// without a SQLite/MMKV dependency (D9). Stack.Screen renders its headerRight so
// the hide action is reachable in the test (the default stub drops the header).

jest.mock("@/features/calendar/data", () => {
  const actual = jest.requireActual("@/features/calendar/data")
  return { ...actual, useEventDetails: jest.fn() }
})

jest.mock("@/features/calendar-sources", () => ({
  useUserCalendars: jest.fn(),
}))

jest.mock("@/features/hidden-events/data", () => ({
  useHiddenEvents: jest.fn(),
  useHideActions: jest.fn(),
}))

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
  // Render the headerRight (the hide action lives there) so it is in the tree.
  Stack: {
    Screen: ({
      options,
    }: {
      options?: { headerRight?: () => ReactElement }
    }) => (options?.headerRight ? options.headerRight() : null),
  },
}))

const mockUseEventDetails = useEventDetails as jest.Mock
const mockUseUserCalendars = useUserCalendars as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockUseRouter = useRouter as jest.Mock
const mockUseHiddenEvents = useHiddenEvents as jest.Mock
const mockUseHideActions = useHideActions as jest.Mock

function eventDetails(overrides: Partial<EventDetails> = {}): EventDetails {
  return {
    id: "ev-1",
    title: "Algorithms",
    color: "#1E88E5",
    groupColor: "#0D47A1",
    type: "cm",
    // Local-time dates so the formatted date/time is TZ-independent.
    startsAt: new Date(2026, 5, 16, 9, 0, 0, 0),
    endsAt: new Date(2026, 5, 16, 10, 30, 0, 0),
    exportedAt: new Date(2026, 5, 15, 22, 0, 0, 0),
    location: "Room A1",
    description: "Intro lecture",
    teachers: ["Dr. Turing", "Dr. Lovelace"],
    tags: [{ name: "CM", color: "#FF0000", icon: "book" }],
    canceled: false,
    userCalendarId: "cal-1",
    ...overrides,
  }
}

const hideActions = {
  hideByUid: jest.fn(),
  hideByName: jest.fn(),
  unhideUid: jest.fn(),
  unhideName: jest.fn(),
  failed: false,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseLocalSearchParams.mockReturnValue({ uid: "ev-1" })
  mockUseUserCalendars.mockReturnValue([])
  mockUseRouter.mockReturnValue({ back: jest.fn() })
  mockUseHiddenEvents.mockReturnValue({
    uidHiddenEvents: [],
    namedHiddenEvents: [],
  })
  mockUseHideActions.mockReturnValue({ ...hideActions, failed: false })
  mockUseEventDetails.mockReturnValue({
    event: eventDetails(),
    loading: false,
  })
})

describe("EventDetailsScreen", () => {
  it("renders the title as a heading", async () => {
    await render(<EventDetailsScreen />)
    expect(screen.getByRole("header", { name: "Algorithms" })).toBeTruthy()
  })

  it("renders the formatted full date/time (not a raw key)", async () => {
    await render(<EventDetailsScreen />)
    expect(
      screen.getByText("Tuesday, June 16th, 2026 · 09:00 – 10:30"),
    ).toBeTruthy()
  })

  it("labels the color swatch accessibly", async () => {
    await render(<EventDetailsScreen />)
    expect(screen.getByLabelText("Event color")).toBeTruthy()
  })

  it("renders the tag bubbles", async () => {
    await render(<EventDetailsScreen />)
    expect(screen.getByText("CM")).toBeTruthy()
  })

  it("renders the present content lines", async () => {
    await render(<EventDetailsScreen />)
    expect(screen.getByText("Room A1")).toBeTruthy()
    expect(screen.getByText("Dr. Turing\nDr. Lovelace")).toBeTruthy()
    expect(screen.getByText("Intro lecture")).toBeTruthy()
  })

  it("shows the calendar-name line only when the user has 2+ calendars", async () => {
    mockUseUserCalendars.mockReturnValue([
      { id: "cal-1", name: "ENSEEIHT" },
      { id: "cal-2", name: "Sport" },
    ])
    await render(<EventDetailsScreen />)
    expect(screen.getByText("ENSEEIHT")).toBeTruthy()
  })

  it("hides the calendar-name line with a single calendar", async () => {
    mockUseUserCalendars.mockReturnValue([{ id: "cal-1", name: "ENSEEIHT" }])
    await render(<EventDetailsScreen />)
    expect(screen.queryByText("ENSEEIHT")).toBeNull()
  })

  it("omits a content line for an absent field", async () => {
    mockUseEventDetails.mockReturnValue({
      event: eventDetails({ location: undefined, description: undefined }),
      loading: false,
    })
    await render(<EventDetailsScreen />)
    expect(screen.queryByText("Room A1")).toBeNull()
    expect(screen.queryByText("Intro lecture")).toBeNull()
  })

  it("renders the updated footer with the formatted date", async () => {
    await render(<EventDetailsScreen />)
    expect(
      screen.getByText("Updated Monday, June 15th, 2026 · 22:00"),
    ).toBeTruthy()
  })

  it("renders an accessible not-found message when the event is missing", async () => {
    mockUseEventDetails.mockReturnValue({ event: null, loading: false })
    await render(<EventDetailsScreen />)
    expect(screen.getByText("This event is no longer available.")).toBeTruthy()
  })

  it("renders an accessible loading indicator while the read resolves", async () => {
    mockUseEventDetails.mockReturnValue({ event: null, loading: true })
    await render(<EventDetailsScreen />)
    expect(screen.getByLabelText("Loading event…")).toBeTruthy()
    // Loading is distinct from not-found — the not-found message must NOT show yet.
    expect(screen.queryByText("This event is no longer available.")).toBeNull()
  })
})

describe("EventDetailsScreen hide / un-hide action (hidden-events)", () => {
  it("offers the hide action for a synced event", async () => {
    await render(<EventDetailsScreen />)
    expect(screen.getByLabelText("Hide this event")).toBeTruthy()
  })

  it("offers NO hide action for a non-synced event (empty userCalendarId)", async () => {
    // A personal event never reaches this screen (it routes to its edit form and
    // EventDetails is built only from a synced row); the empty-id guard stands in
    // for that — hiding is synced-only (Flutter parity).
    mockUseEventDetails.mockReturnValue({
      event: eventDetails({ userCalendarId: "" }),
      loading: false,
    })
    await render(<EventDetailsScreen />)
    expect(screen.queryByLabelText("Hide this event")).toBeNull()
    expect(screen.queryByLabelText("Un-hide this event")).toBeNull()
  })

  it("hides this instance via the chooser (hideByUid)", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _msg, buttons) => {
        // Choose the first option: "Hide this event".
        buttons?.[0]?.onPress?.()
      })
    const back = jest.fn()
    mockUseRouter.mockReturnValue({ back })

    await render(<EventDetailsScreen />)
    const user = userEvent.setup()
    await user.press(screen.getByLabelText("Hide this event"))

    expect(hideActions.hideByUid).toHaveBeenCalledWith("ev-1")
    expect(back).toHaveBeenCalled()
    alertSpy.mockRestore()
  })

  it("hides all of the same name via the chooser (hideByName)", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _msg, buttons) => {
        // Choose the second option: "Hide all events of the same name".
        buttons?.[1]?.onPress?.()
      })
    await render(<EventDetailsScreen />)
    const user = userEvent.setup()
    await user.press(screen.getByLabelText("Hide this event"))

    expect(hideActions.hideByName).toHaveBeenCalledWith("Algorithms")
    alertSpy.mockRestore()
  })

  it("offers un-hide and removes the event when it is currently hidden", async () => {
    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: ["ev-1"],
      namedHiddenEvents: [],
    })
    await render(<EventDetailsScreen />)
    const user = userEvent.setup()
    const unhide = screen.getByLabelText("Un-hide this event")
    await user.press(unhide)

    expect(hideActions.unhideUid).toHaveBeenCalledWith("ev-1")
  })

  it("un-hides by name when the title is in the named set", async () => {
    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: [],
      namedHiddenEvents: ["Algorithms"],
    })
    await render(<EventDetailsScreen />)
    const user = userEvent.setup()
    await user.press(screen.getByLabelText("Un-hide this event"))

    expect(hideActions.unhideName).toHaveBeenCalledWith("Algorithms")
  })

  it("surfaces an accessible failure state when a hide write failed", async () => {
    mockUseHideActions.mockReturnValue({ ...hideActions, failed: true })
    await render(<EventDetailsScreen />)
    expect(
      screen.getByText("We couldn't hide this event. Please try again."),
    ).toBeTruthy()
  })
})
