import { renderHook } from "@testing-library/react-native"

import {
  type PersonalEvent,
  usePersonalEvents,
} from "@/features/personal-events"

import { useCalendarEvents } from "./events"

jest.mock("@/features/personal-events", () => ({
  usePersonalEvents: jest.fn(),
}))

const mockUsePersonalEvents = usePersonalEvents as jest.Mock

// A range covering the current week (the fixture anchors to this week's Monday).
function thisWeekRange() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  from.setDate(from.getDate() - 7)
  const to = new Date(from)
  to.setDate(to.getDate() + 21)
  return { from, to }
}

function personalEvent(overrides: Partial<PersonalEvent> = {}): PersonalEvent {
  const startsAt = new Date()
  startsAt.setHours(15, 0, 0, 0)
  const endsAt = new Date(startsAt)
  endsAt.setHours(16, 0, 0, 0)
  return {
    uid: "pe-1",
    title: "Dentist",
    color: "#123456",
    startsAt,
    endsAt,
    exportedAt: new Date(),
    location: "Downtown",
    description: "Checkup",
    ...overrides,
  }
}

beforeEach(() => {
  mockUsePersonalEvents.mockReturnValue([])
})

describe("useCalendarEvents", () => {
  it("returns the fixture events within the range", async () => {
    const { result } = await renderHook(() =>
      useCalendarEvents(thisWeekRange()),
    )
    expect(result.current.length).toBeGreaterThan(0)
    expect(result.current.some((e) => e.title === "Lecture")).toBe(true)
  })

  it("maps personal events into CalendarEvent shape and merges them", async () => {
    mockUsePersonalEvents.mockReturnValue([personalEvent()])
    const { result } = await renderHook(() =>
      useCalendarEvents(thisWeekRange()),
    )
    const dentist = result.current.find((e) => e.id === "pe-1")
    expect(dentist).toMatchObject({
      title: "Dentist",
      color: "#123456",
      location: "Downtown",
      description: "Checkup",
      allDay: false,
      teachers: [],
      tags: [],
      canceled: false,
      userCalendarId: undefined,
    })
  })

  it("includes events intersecting the range and excludes those outside", async () => {
    const inside = personalEvent({ uid: "pe-in" })
    const outsideStart = new Date()
    outsideStart.setFullYear(outsideStart.getFullYear() + 5)
    const outsideEnd = new Date(outsideStart)
    outsideEnd.setHours(outsideStart.getHours() + 1)
    const outside = personalEvent({
      uid: "pe-out",
      startsAt: outsideStart,
      endsAt: outsideEnd,
    })
    mockUsePersonalEvents.mockReturnValue([inside, outside])

    const { result } = await renderHook(() =>
      useCalendarEvents(thisWeekRange()),
    )
    expect(result.current.some((e) => e.id === "pe-in")).toBe(true)
    expect(result.current.some((e) => e.id === "pe-out")).toBe(false)
  })

  it("returns nothing for a range with no intersecting events", async () => {
    const from = new Date()
    from.setFullYear(from.getFullYear() + 10)
    const to = new Date(from)
    to.setDate(to.getDate() + 1)
    const { result } = await renderHook(() => useCalendarEvents({ from, to }))
    expect(result.current).toEqual([])
  })
})
