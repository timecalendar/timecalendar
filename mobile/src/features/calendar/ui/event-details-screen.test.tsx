import { render, screen } from "@testing-library/react-native"
import { useLocalSearchParams } from "expo-router"

import { type EventDetails, useEventDetails } from "@/features/calendar/data"
import { useUserCalendars } from "@/features/calendar-sources"

import { EventDetailsScreen } from "./event-details-screen"

// Presentational read-only screen (70% floor): renders through the real theme +
// i18n trees. The rich read (useEventDetails) + the user-calendars read + the
// uid route param are mocked so the row→sections wiring + the not-found state are
// provable without a SQLite dependency (D9). Stack.Screen is a no-op stub (it sets
// the header title outside a navigator).

jest.mock("@/features/calendar/data", () => {
  const actual = jest.requireActual("@/features/calendar/data")
  return { ...actual, useEventDetails: jest.fn() }
})

jest.mock("@/features/calendar-sources", () => ({
  useUserCalendars: jest.fn(),
}))

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: () => null },
}))

const mockUseEventDetails = useEventDetails as jest.Mock
const mockUseUserCalendars = useUserCalendars as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock

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

beforeEach(() => {
  mockUseLocalSearchParams.mockReturnValue({ uid: "ev-1" })
  mockUseUserCalendars.mockReturnValue([])
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
