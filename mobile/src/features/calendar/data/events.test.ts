import { renderHook } from "@testing-library/react-native"

import { useHiddenEvents } from "@/features/hidden-events/data"
import {
  type PersonalEvent,
  usePersonalEvents,
} from "@/features/personal-events"

import { useCalendarEvents } from "./events"
import { denseWeekFixture } from "./fixtures"
import { useSyncedEvents } from "./sync"
import type { CalendarEvent } from "./types"

// The events-source seam now merges the synced calendar_events read with the
// personal-events read (the sync ship's swap) and filters out hidden events (ADR
// 023) — the fixture is no longer in the default runtime merge. All three sources
// are mocked so the merge + hidden-filter + range-filter are asserted
// deterministically without a SQLite/network/MMKV dependency.
jest.mock("@/features/personal-events", () => ({
  usePersonalEvents: jest.fn(),
}))
jest.mock("@/features/hidden-events/data", () => ({
  useHiddenEvents: jest.fn(),
}))
jest.mock("./sync", () => ({
  useSyncedEvents: jest.fn(),
}))

const mockUsePersonalEvents = usePersonalEvents as jest.Mock
const mockUseHiddenEvents = useHiddenEvents as jest.Mock
const mockUseSyncedEvents = useSyncedEvents as jest.Mock

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

function syncedEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  const startsAt = new Date()
  startsAt.setHours(9, 0, 0, 0)
  const endsAt = new Date(startsAt)
  endsAt.setHours(10, 30, 0, 0)
  return {
    id: "sync-1",
    title: "Lecture",
    color: "#1E88E5",
    startsAt,
    endsAt,
    location: "Room A1",
    allDay: false,
    description: undefined,
    teachers: ["Dr. Ada"],
    tags: ["CM"],
    canceled: false,
    userCalendarId: "cal-1",
    ...overrides,
  }
}

beforeEach(() => {
  mockUsePersonalEvents.mockReturnValue([])
  mockUseSyncedEvents.mockReturnValue([])
  mockUseHiddenEvents.mockReturnValue({
    uidHiddenEvents: [],
    namedHiddenEvents: [],
  })
})

describe("useCalendarEvents", () => {
  it("returns the synced events within the range", async () => {
    mockUseSyncedEvents.mockReturnValue([syncedEvent()])
    const { result } = await renderHook(() =>
      useCalendarEvents(thisWeekRange()),
    )
    expect(result.current.some((e) => e.id === "sync-1")).toBe(true)
  })

  it("does NOT include the dense-week fixture in the default merge", async () => {
    const { result } = await renderHook(() =>
      useCalendarEvents(thisWeekRange()),
    )
    const fixtureIds = new Set(denseWeekFixture().map((e) => e.id))
    expect(result.current.some((e) => fixtureIds.has(e.id))).toBe(false)
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

  it("merges synced + personal events", async () => {
    mockUseSyncedEvents.mockReturnValue([syncedEvent()])
    mockUsePersonalEvents.mockReturnValue([personalEvent()])
    const { result } = await renderHook(() =>
      useCalendarEvents(thisWeekRange()),
    )
    expect(result.current.some((e) => e.id === "sync-1")).toBe(true)
    expect(result.current.some((e) => e.id === "pe-1")).toBe(true)
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

  it("excludes a uid-hidden event from the merged result", async () => {
    mockUseSyncedEvents.mockReturnValue([
      syncedEvent({ id: "sync-1" }),
      syncedEvent({ id: "sync-2", title: "Other" }),
    ])
    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: ["sync-1"],
      namedHiddenEvents: [],
    })
    const { result } = await renderHook(() =>
      useCalendarEvents(thisWeekRange()),
    )
    expect(result.current.some((e) => e.id === "sync-1")).toBe(false)
    expect(result.current.some((e) => e.id === "sync-2")).toBe(true)
  })

  it("excludes every same-titled event for a name-hidden title", async () => {
    mockUseSyncedEvents.mockReturnValue([
      syncedEvent({ id: "sync-1", title: "Lecture" }),
      syncedEvent({ id: "sync-2", title: "Lecture" }),
      syncedEvent({ id: "sync-3", title: "Lab" }),
    ])
    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: [],
      namedHiddenEvents: ["Lecture"],
    })
    const { result } = await renderHook(() =>
      useCalendarEvents(thisWeekRange()),
    )
    expect(result.current.map((e) => e.id)).toEqual(["sync-3"])
  })

  it("filters the merged list — a name-hidden title also hides a same-titled personal event (Flutter parity)", async () => {
    mockUseSyncedEvents.mockReturnValue([
      syncedEvent({ id: "sync-1", title: "Yoga" }),
    ])
    mockUsePersonalEvents.mockReturnValue([
      personalEvent({ uid: "pe-1", title: "Yoga" }),
    ])
    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: [],
      namedHiddenEvents: ["Yoga"],
    })
    const { result } = await renderHook(() =>
      useCalendarEvents(thisWeekRange()),
    )
    expect(result.current).toEqual([])
  })

  it("excludes nothing when the hidden set is empty", async () => {
    mockUseSyncedEvents.mockReturnValue([syncedEvent({ id: "sync-1" })])
    const { result } = await renderHook(() =>
      useCalendarEvents(thisWeekRange()),
    )
    expect(result.current.some((e) => e.id === "sync-1")).toBe(true)
  })
})
