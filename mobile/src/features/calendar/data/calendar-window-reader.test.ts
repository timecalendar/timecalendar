import { findAll } from "@/features/calendar-sources/data"
import { readChecklistProgress } from "@/features/event-checklists"
import { selectPersonalEventRowsInRange } from "@/features/personal-events"

import { readCalendarWindow } from "./calendar-window-reader"
import { selectSyncedTimedRowsInRange } from "./sync/hooks"
import { chunkRange } from "./window-chunks"

jest.mock("@/features/calendar-sources/data", () => ({ findAll: jest.fn() }))
jest.mock("@/features/event-checklists", () => ({
  readChecklistProgress: jest.fn(),
}))
jest.mock("@/features/personal-events", () => ({
  selectPersonalEventRowsInRange: jest.fn(),
}))
jest.mock("./sync/hooks", () => ({ selectSyncedTimedRowsInRange: jest.fn() }))

const mockFindAll = findAll as jest.Mock
const mockChecklist = readChecklistProgress as jest.Mock
const mockPersonal = selectPersonalEventRowsInRange as jest.Mock
const mockSynced = selectSyncedTimedRowsInRange as jest.Mock

function syncedRow(uid: string, startsAt: string, endsAt: string) {
  return {
    uid,
    title: uid,
    color: "#112233",
    groupColor: "#112233",
    startsAt,
    endsAt,
    exportedAt: "2026-09-13T08:00:00.000Z",
    location: null,
    description: null,
    allDay: false,
    teachers: "[]",
    tags: "[]",
    fields: null,
    type: "cm",
    userCalendarId: "cal-1",
  }
}

const first = chunkRange(20_724, "UTC")
const second = chunkRange(20_752, "UTC")

beforeEach(() => {
  mockSynced.mockResolvedValue([
    syncedRow(
      "in-first",
      "2026-09-28T08:00:00.000Z",
      "2026-09-28T09:00:00.000Z",
    ),
    syncedRow(
      "in-second",
      "2026-10-26T08:00:00.000Z",
      "2026-10-26T09:00:00.000Z",
    ),
    syncedRow("bad", "not-a-date", "2026-10-26T09:00:00.000Z"),
  ])
  mockPersonal.mockResolvedValue([
    {
      uid: "personal",
      title: "Study",
      color: "#334455",
      startsAt: "2026-10-27T10:00:00.000Z",
      endsAt: "2026-10-27T11:00:00.000Z",
      exportedAt: "2026-09-13T08:00:00.000Z",
      location: null,
      description: null,
    },
  ])
  mockFindAll.mockResolvedValue([
    { id: "cal-1", visible: true },
    { id: "cal-2", visible: false },
  ])
  mockChecklist.mockResolvedValue(
    new Map([["personal", { completed: 1, total: 1, isComplete: true }]]),
  )
})

describe("readCalendarWindow", () => {
  it("scans each table once over the union of the chunks and splits rows per chunk", async () => {
    const read = await readCalendarWindow({
      chunks: [second, first],
      displayZone: "UTC",
    })

    expect(mockSynced).toHaveBeenCalledTimes(1)
    expect(mockSynced).toHaveBeenCalledWith({ from: first.from, to: second.to })
    expect(mockPersonal).toHaveBeenCalledWith({
      from: first.from,
      to: second.to,
    })
    expect(mockChecklist).toHaveBeenCalledWith([
      "in-first",
      "in-second",
      "personal",
    ])
    expect(
      read.chunks.get(first.start)?.events.map((event) => event.identity.uid),
    ).toEqual(["in-first"])
    expect(
      read.chunks.get(second.start)?.events.map((event) => event.identity.uid),
    ).toEqual(["in-second", "personal"])
    expect(read.chunks.get(first.start)?.checklist.size).toBe(0)
    expect(read.chunks.get(second.start)?.checklist.get("personal")).toEqual({
      completed: 1,
      total: 1,
      isComplete: true,
    })
    expect(Object.isFrozen(read.chunks.get(first.start)?.events)).toBe(true)
    expect([...read.visibleCalendarIds]).toEqual(["cal-1"])
    expect(read.rejectedCounts["invalid-start"]).toBe(1)
  })

  it("rejects when a table read fails", async () => {
    mockPersonal.mockRejectedValue(new Error("locked"))
    await expect(
      readCalendarWindow({ chunks: [first], displayZone: "UTC" }),
    ).rejects.toThrow("locked")
  })
})
