import { renderHook, waitFor } from "@testing-library/react-native"

import { useUserCalendarsSnapshot } from "@/features/calendar-sources/data"
import { useHiddenEvents } from "@/features/hidden-events/data"
import { usePersonalEventRowsInRange } from "@/features/personal-events"
import { recordError } from "@/firebase"

import {
  type DateRange,
  intersectsRange,
  useCalendarEvents,
  useCalendarEventsSnapshot,
} from "./events"
import { useSyncedEventRowsInRange } from "./sync/hooks"

jest.mock("@/features/personal-events", () => ({
  usePersonalEventRowsInRange: jest.fn(),
}))
jest.mock("@/features/hidden-events/data", () => ({
  useHiddenEvents: jest.fn(),
}))
jest.mock("@/features/calendar-sources/data", () => ({
  useUserCalendarsSnapshot: jest.fn(),
}))
jest.mock("./sync/hooks", () => ({
  useSyncedEventRowsInRange: jest.fn(),
}))
jest.mock("@/firebase", () => ({ recordError: jest.fn() }))

const mockPersonal = usePersonalEventRowsInRange as jest.Mock
const mockHidden = useHiddenEvents as jest.Mock
const mockCalendarSources = useUserCalendarsSnapshot as jest.Mock
const mockSynced = useSyncedEventRowsInRange as jest.Mock
const mockRecordError = recordError as jest.Mock

function syncedRow(overrides: Record<string, unknown> = {}) {
  return {
    uid: "sync-1",
    title: "Maths",
    color: "#112233",
    groupColor: "#112233",
    startsAt: "2026-09-14T08:00:00.000Z",
    endsAt: "2026-09-14T09:00:00.000Z",
    exportedAt: "2026-09-13T08:00:00.000Z",
    location: "B12",
    description: null,
    allDay: false,
    teachers: "[]",
    tags: "[]",
    fields: null,
    type: "cm",
    userCalendarId: "cal-1",
    ...overrides,
  }
}

function personalRow(overrides: Record<string, unknown> = {}) {
  return {
    uid: "personal-1",
    title: "Study",
    color: "#334455",
    startsAt: "2026-09-14T10:00:00.000Z",
    endsAt: "2026-09-14T11:00:00.000Z",
    exportedAt: "2026-09-13T08:00:00.000Z",
    location: null,
    description: null,
    ...overrides,
  }
}

const range = {
  from: new Date("2026-09-14T00:00:00.000Z"),
  to: new Date("2026-09-17T00:00:00.000Z"),
  civilFromDay: "2026-09-14",
  civilToDay: "2026-09-17",
}

beforeEach(() => {
  mockSynced.mockReturnValue({
    timedRows: [],
    dateOnlyRows: [],
    error: undefined,
    ready: true,
    revision: "sync-1",
  })
  mockPersonal.mockReturnValue({
    rows: [],
    error: undefined,
    ready: true,
    revision: "personal-1",
  })
  mockHidden.mockReturnValue({
    uidHiddenEvents: [],
    namedHiddenEvents: [],
  })
  mockCalendarSources.mockReturnValue({
    calendars: [{ id: "cal-1", visible: true }],
    ready: true,
    revision: "sources-1",
  })
  mockRecordError.mockClear()
})

describe("bounded calendar events seam", () => {
  it("decodes synced, date-only, and personal rows with source identity", async () => {
    mockSynced.mockReturnValue({
      timedRows: [syncedRow()],
      dateOnlyRows: [
        syncedRow({
          uid: "day-1",
          allDay: true,
          startsAt: "2026-09-15T00:00:00.000Z",
          endsAt: "2026-09-16T00:00:00.000Z",
        }),
      ],
      error: undefined,
      ready: true,
      revision: "sync-1",
    })
    mockPersonal.mockReturnValue({
      rows: [personalRow()],
      error: undefined,
      ready: true,
      revision: "personal-1",
    })

    const { result } = await renderHook(() => useCalendarEventsSnapshot(range))
    expect(
      result.current.events.map(({ kind, identity }) => ({ kind, identity })),
    ).toEqual([
      { kind: "timed", identity: { source: "synced", uid: "sync-1" } },
      { kind: "date-only", identity: { source: "synced", uid: "day-1" } },
      {
        kind: "timed",
        identity: { source: "personal", uid: "personal-1" },
      },
    ])
    expect(result.current.counts).toEqual({
      queriedSyncedTimed: 1,
      queriedSyncedDateOnly: 1,
      queriedPersonal: 1,
      accepted: 3,
      filtered: 0,
    })
  })

  it("filters cancelled, hidden, named, invisible, and deleted sources before projection", async () => {
    mockSynced.mockReturnValue({
      timedRows: [
        syncedRow({ uid: "kept" }),
        syncedRow({ uid: "cancelled", fields: '{"canceled":true}' }),
        syncedRow({ uid: "hidden" }),
        syncedRow({ uid: "named", title: "Secret" }),
        syncedRow({ uid: "invisible", userCalendarId: "cal-2" }),
        syncedRow({ uid: "deleted", userCalendarId: "cal-gone" }),
      ],
      dateOnlyRows: [],
      error: undefined,
      ready: true,
      revision: "sync-1",
    })
    mockPersonal.mockReturnValue({
      rows: [personalRow()],
      error: undefined,
      ready: true,
      revision: "personal-1",
    })
    mockHidden.mockReturnValue({
      uidHiddenEvents: ["hidden"],
      namedHiddenEvents: ["Secret"],
    })
    mockCalendarSources.mockReturnValue({
      calendars: [
        { id: "cal-1", visible: true },
        { id: "cal-2", visible: false },
      ],
      ready: true,
      revision: "sources-1",
    })

    const { result } = await renderHook(() => useCalendarEventsSnapshot(range))
    expect(result.current.events.map(({ id }) => id)).toEqual([
      "kept",
      "personal-1",
    ])
    expect(result.current.counts).toEqual({
      queriedSyncedTimed: 6,
      queriedSyncedDateOnly: 0,
      queriedPersonal: 1,
      accepted: 7,
      filtered: 5,
    })
    expect(mockRecordError).not.toHaveBeenCalled()
  })

  it("isolates malformed siblings and emits aggregate-only diagnostics once per revision", async () => {
    mockSynced.mockReturnValue({
      timedRows: [syncedRow(), syncedRow({ uid: "bad", startsAt: "private" })],
      dateOnlyRows: [],
      error: undefined,
      ready: true,
      revision: "snapshot-7",
    })
    const { result, rerender } = await renderHook(() =>
      useCalendarEventsSnapshot(range),
    )
    expect(result.current.events.map(({ id }) => id)).toEqual(["sync-1"])
    expect(result.current.rejectedCounts["invalid-start"]).toBe(1)
    await waitFor(() => expect(mockRecordError).toHaveBeenCalledTimes(1))
    expect(mockRecordError.mock.calls[0]?.[0].message).toBe(
      "calendar-row-rejected:invalid-start:1",
    )
    expect(mockRecordError).toHaveBeenCalledWith(
      expect.any(Error),
      "calendar-local-read",
    )
    expect(JSON.stringify(mockRecordError.mock.calls)).not.toContain("private")
    await rerender({})
    expect(mockRecordError).toHaveBeenCalledTimes(1)
  })

  it("responds to visibility restore and range replacement", async () => {
    mockSynced.mockReturnValue({
      timedRows: [syncedRow()],
      dateOnlyRows: [],
      error: undefined,
      ready: true,
      revision: "sync-1",
    })
    mockCalendarSources.mockReturnValue({
      calendars: [{ id: "cal-1", visible: false }],
      ready: true,
      revision: "sources-1",
    })
    let currentRange: DateRange = range
    const { result, rerender } = await renderHook(() =>
      useCalendarEvents(currentRange),
    )
    expect(result.current).toEqual([])

    mockCalendarSources.mockReturnValue({
      calendars: [{ id: "cal-1", visible: true }],
      ready: true,
      revision: "sources-2",
    })
    await rerender({})
    expect(result.current.map(({ id }) => id)).toEqual(["sync-1"])

    const later = {
      from: new Date("2026-09-20T00:00:00.000Z"),
      to: new Date("2026-09-21T00:00:00.000Z"),
    }
    currentRange = later
    await rerender({})
    expect(result.current).toEqual([])
    expect(mockSynced).toHaveBeenLastCalledWith({
      instant: later,
      civil: { fromDay: "2026-09-20", toDay: "2026-09-21" },
    })
  })

  it("waits for source visibility before completing initial or replacement snapshots", async () => {
    mockSynced.mockReturnValue({
      timedRows: [syncedRow()],
      dateOnlyRows: [],
      error: undefined,
      ready: true,
      revision: "sync-1",
    })
    mockCalendarSources.mockReturnValue({
      calendars: [],
      ready: false,
      revision: "pending",
    })
    const { result, rerender } = await renderHook(() =>
      useCalendarEventsSnapshot(range),
    )
    expect(result.current.ready).toBe(false)
    expect(result.current.events).toEqual([])
    expect(result.current.revision).toBe("sync-1:personal-1:pending")

    mockCalendarSources.mockReturnValue({
      calendars: [{ id: "cal-1", visible: true }],
      ready: true,
      revision: "sources-1",
    })
    await rerender({})
    expect(result.current.ready).toBe(true)
    expect(result.current.events.map(({ id }) => id)).toEqual(["sync-1"])

    mockCalendarSources.mockReturnValue({
      calendars: [],
      ready: false,
      revision: "pending",
    })
    await rerender({})
    expect(result.current.ready).toBe(false)
    expect(result.current.revision).toBe("sync-1:personal-1:pending")
  })

  it("uses distinct instant and civil intersection semantics", () => {
    const dateOnly = {
      version: 1,
      kind: "date-only",
      allDay: true,
      identity: { source: "synced", uid: "day" },
      id: "day",
      title: "Holiday",
      color: "#112233",
      startsAt: new Date("2026-09-14T00:00:00.000Z"),
      endsAt: new Date("2026-09-15T00:00:00.000Z"),
      startDay: "2026-09-14",
      endDay: "2026-09-15",
      location: undefined,
      description: undefined,
      teachers: [],
      tags: [],
      canceled: false,
      userCalendarId: "cal-1",
    } as const
    expect(intersectsRange(dateOnly, range)).toBe(true)
    expect(
      intersectsRange(dateOnly, {
        from: new Date("2026-09-15T00:00:00.000Z"),
        to: new Date("2026-09-16T00:00:00.000Z"),
      }),
    ).toBe(false)

    const point = {
      ...dateOnly,
      kind: "timed",
      allDay: false,
      startsAt: range.from,
      endsAt: range.from,
    } as const
    expect(intersectsRange(point, range)).toBe(true)
    expect(
      intersectsRange(
        { ...point, startsAt: range.to, endsAt: range.to },
        range,
      ),
    ).toBe(false)
  })
})
