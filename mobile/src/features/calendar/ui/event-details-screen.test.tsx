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

// The checklist section reads @/db + @/firebase; mock the cross-feature component
// to a marker so the screen's mount + the origin-keyed header actions are provable
// without a SQLite dependency (the checklist itself is proven in its own test).
jest.mock("@/features/event-checklists", () => ({
  EventChecklist: ({ eventUid }: { eventUid: string }) => {
    const { Text } = jest.requireActual("react-native")
    return <Text>{`checklist:${eventUid}`}</Text>
  },
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
    kind: "synced",
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
  mockUseRouter.mockReturnValue({ back: jest.fn(), push: jest.fn() })
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

  it("offers NO hide action for a personal event (synced-only, Flutter parity)", async () => {
    mockUseEventDetails.mockReturnValue({
      event: eventDetails({ kind: "personal", userCalendarId: "" }),
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

describe("EventDetailsScreen unified surface (both kinds) — checklist + Edit action", () => {
  it("mounts the checklist section for a synced event, keyed on the uid", async () => {
    await render(<EventDetailsScreen />)
    expect(screen.getByText("checklist:ev-1")).toBeTruthy()
  })

  it("mounts the checklist section for a personal event, keyed on the uid", async () => {
    mockUseEventDetails.mockReturnValue({
      event: eventDetails({
        kind: "personal",
        id: "pers-1",
        userCalendarId: "",
      }),
      loading: false,
    })
    await render(<EventDetailsScreen />)
    expect(screen.getByText("checklist:pers-1")).toBeTruthy()
  })

  it("renders a personal event's details (title + date)", async () => {
    mockUseEventDetails.mockReturnValue({
      event: eventDetails({
        kind: "personal",
        title: "Dentist",
        userCalendarId: "",
        tags: [],
        teachers: [],
      }),
      loading: false,
    })
    await render(<EventDetailsScreen />)
    expect(screen.getByRole("header", { name: "Dentist" })).toBeTruthy()
  })

  it("offers the Edit action ONLY for a personal event, and it opens the form", async () => {
    const push = jest.fn()
    mockUseRouter.mockReturnValue({ back: jest.fn(), push })
    mockUseEventDetails.mockReturnValue({
      event: eventDetails({
        kind: "personal",
        id: "pers-1",
        userCalendarId: "",
      }),
      loading: false,
    })
    await render(<EventDetailsScreen />)

    expect(screen.queryByLabelText("Hide this event")).toBeNull()
    const edit = screen.getByLabelText("Edit this event")
    const user = userEvent.setup()
    await user.press(edit)
    expect(push).toHaveBeenCalledWith("/personal-event-form?uid=pers-1")
  })

  it("offers NO Edit action for a synced event (Edit is personal-only)", async () => {
    await render(<EventDetailsScreen />)
    expect(screen.queryByLabelText("Edit this event")).toBeNull()
  })
})
