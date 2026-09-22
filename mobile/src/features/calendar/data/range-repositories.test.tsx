import { renderHook } from "@testing-library/react-native"

import { createFakeDb } from "@/test-support/fake-db"
const mockFake = createFakeDb({
  tables: {
    calendarEvents: {
      pk: "uid",
      columns: ["uid", "allDay", "startsAt", "endsAt"],
    },
    personalEvents: {
      pk: "uid",
      columns: ["uid", "startsAt", "endsAt"],
    },
  },
})

jest.mock("@/db", () => mockFake.module)
jest.mock("@/features/hidden-events/data", () => ({
  useHiddenEvents: () => ({ uidHiddenEvents: [], namedHiddenEvents: [] }),
}))
jest.mock("@/features/calendar-sources/data", () => ({
  useUserCalendarsSnapshot: () => ({
    calendars: [{ id: "cal-1", visible: true }],
    ready: true,
    revision: "sources-1",
  }),
}))

const { usePersonalEventRowsInRange } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/features/personal-events/data/hooks") as typeof import("@/features/personal-events/data/hooks")
const { useSyncedEventRowsInRange } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./sync/hooks") as typeof import("./sync/hooks")
const { useCalendarEventsSnapshot } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./events") as typeof import("./events")

const instant = {
  from: new Date("2026-09-14T00:00:00.000Z"),
  to: new Date("2026-09-17T00:00:00.000Z"),
}

describe("bounded local calendar repositories", () => {
  beforeEach(() => mockFake.reset())

  it("reads timed and civil intersections with exact half-open boundaries", async () => {
    mockFake.seed("calendarEvents", [
      {
        uid: "covers-from",
        allDay: false,
        startsAt: "2026-09-13T23:00:00.000Z",
        endsAt: "2026-09-14T01:00:00.000Z",
      },
      {
        uid: "ends-at-from",
        allDay: false,
        startsAt: "2026-09-13T22:00:00.000Z",
        endsAt: "2026-09-14T00:00:00.000Z",
      },
      {
        uid: "starts-at-to",
        allDay: false,
        startsAt: "2026-09-17T00:00:00.000Z",
        endsAt: "2026-09-17T01:00:00.000Z",
      },
      {
        uid: "point-at-from",
        allDay: false,
        startsAt: "2026-09-14T00:00:00.000Z",
        endsAt: "2026-09-14T00:00:00.000Z",
      },
      {
        uid: "point-at-to",
        allDay: false,
        startsAt: "2026-09-17T00:00:00.000Z",
        endsAt: "2026-09-17T00:00:00.000Z",
      },
      {
        uid: "date-only",
        allDay: true,
        startsAt: "2026-09-16T00:00:00.000Z",
        endsAt: "2026-09-18T00:00:00.000Z",
      },
      {
        uid: "date-only-out",
        allDay: true,
        startsAt: "2026-09-17T00:00:00.000Z",
        endsAt: "2026-09-18T00:00:00.000Z",
      },
    ])
    const { result } = await renderHook(() =>
      useSyncedEventRowsInRange({
        instant,
        civil: { fromDay: "2026-09-14", toDay: "2026-09-17" },
      }),
    )
    expect(result.current.timedRows.map((row) => row.uid)).toEqual([
      "covers-from",
      "point-at-from",
    ])
    expect(result.current.dateOnlyRows.map((row) => row.uid)).toEqual([
      "date-only",
    ])
    expect(result.current.ready).toBe(true)
    expect(mockFake.spies.lt).toHaveBeenCalledWith(
      "calendarEvents.startsAt",
      "2026-09-17T00:00:00.000Z",
    )
    expect(mockFake.spies.gt).toHaveBeenCalledWith(
      "calendarEvents.endsAt",
      "2026-09-14T00:00:00.000Z",
    )
    expect(mockFake.spies.limit).not.toHaveBeenCalled()
  })

  it("scopes personal rows by the same timed intersection", async () => {
    mockFake.seed("personalEvents", [
      {
        uid: "inside",
        startsAt: "2026-09-15T10:00:00.000Z",
        endsAt: "2026-09-15T11:00:00.000Z",
      },
      {
        uid: "ends-at-from",
        startsAt: "2026-09-13T23:00:00.000Z",
        endsAt: "2026-09-14T00:00:00.000Z",
      },
      {
        uid: "starts-at-to",
        startsAt: "2026-09-17T00:00:00.000Z",
        endsAt: "2026-09-17T01:00:00.000Z",
      },
      {
        uid: "point-at-from",
        startsAt: "2026-09-14T00:00:00.000Z",
        endsAt: "2026-09-14T00:00:00.000Z",
      },
      {
        uid: "point-at-to",
        startsAt: "2026-09-17T00:00:00.000Z",
        endsAt: "2026-09-17T00:00:00.000Z",
      },
    ])
    const { result } = await renderHook(() =>
      usePersonalEventRowsInRange(instant),
    )
    expect(result.current.rows.map((row) => row.uid)).toEqual([
      "inside",
      "point-at-from",
    ])
    expect(mockFake.spies.from).toHaveBeenCalledWith(
      mockFake.module.personalEvents,
    )
    expect(mockFake.spies.limit).not.toHaveBeenCalled()
  })

  it("admits one-valid-endpoint candidates through decoding without hiding Maths", async () => {
    mockFake.seed("calendarEvents", [
      {
        uid: "maths",
        title: "Maths",
        color: "#112233",
        groupColor: "#112233",
        startsAt: "2026-09-15T08:00:00.000Z",
        endsAt: "2026-09-15T09:00:00.000Z",
        exportedAt: "2026-09-14T08:00:00.000Z",
        location: null,
        description: null,
        allDay: false,
        teachers: "[]",
        tags: "[]",
        fields: null,
        type: "cm",
        userCalendarId: "cal-1",
      },
      {
        uid: "malformed-start",
        title: "Ignored",
        color: "#112233",
        groupColor: "#112233",
        startsAt: "not-a-date",
        endsAt: "2026-09-15T10:00:00.000Z",
        exportedAt: "2026-09-14T08:00:00.000Z",
        location: null,
        description: null,
        allDay: false,
        teachers: "[]",
        tags: "[]",
        fields: null,
        type: "cm",
        userCalendarId: "cal-1",
      },
    ])
    mockFake.seed("personalEvents", [
      {
        uid: "malformed-end",
        title: "Ignored",
        color: "#334455",
        startsAt: "2026-09-15T11:00:00.000Z",
        endsAt: "not-a-date",
        exportedAt: "2026-09-14T08:00:00.000Z",
        location: null,
        description: null,
      },
    ])

    const { result } = await renderHook(() =>
      useCalendarEventsSnapshot({
        ...instant,
        civilFromDay: "2026-09-14",
        civilToDay: "2026-09-17",
      }),
    )

    expect(result.current.events.map((event) => event.title)).toEqual(["Maths"])
    expect(result.current.rejectedCounts["invalid-start"]).toBe(1)
    expect(result.current.rejectedCounts["invalid-end"]).toBe(1)
    expect(result.current.counts.queriedSyncedTimed).toBe(2)
    expect(result.current.counts.queriedPersonal).toBe(1)
  })

  it("publishes pending and error state without inventing a completed revision", async () => {
    const failure = new Error("read failed")
    mockFake.queueLiveQueryResult({ error: failure, updatedAt: new Date(7) })
    mockFake.queueLiveQueryResult({})
    const synced = await renderHook(() =>
      useSyncedEventRowsInRange({
        instant,
        civil: { fromDay: "2026-09-14", toDay: "2026-09-17" },
      }),
    )
    expect(synced.result.current).toMatchObject({
      ready: false,
      error: failure,
      revision: "7:pending",
    })
    await synced.unmount()

    mockFake.queueLiveQueryResult({})
    mockFake.queueLiveQueryResult({ error: failure, updatedAt: new Date(9) })
    const inverse = await renderHook(() =>
      useSyncedEventRowsInRange({
        instant,
        civil: { fromDay: "2026-09-14", toDay: "2026-09-17" },
      }),
    )
    expect(inverse.result.current).toMatchObject({
      ready: false,
      error: failure,
      revision: "pending:9",
    })
    await inverse.unmount()

    mockFake.queueLiveQueryResult({ error: failure })
    const personal = await renderHook(() =>
      usePersonalEventRowsInRange(instant),
    )
    expect(personal.result.current).toMatchObject({
      ready: false,
      error: failure,
      revision: "pending",
    })
  })
})
