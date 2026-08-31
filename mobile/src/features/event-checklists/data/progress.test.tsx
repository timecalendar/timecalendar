import { act, renderHook } from "@testing-library/react-native"

import { aggregateChecklistProgress, useChecklistProgress } from "./progress"

type Row = { eventUid: string; isChecked: boolean; deletedAt?: string | null }

let mockRows: Row[] = []
const mockListeners = new Set<(value: (current: number) => number) => void>()
const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockInArray = jest.fn((column, values) => ({ column, values }))
const mockSql = jest.fn(() => ({ alwaysFalse: true }))
const mockUseLiveQuery = jest.fn()

jest.mock("@/db", () => {
  const React = jest.requireActual<typeof import("react")>("react")
  const builder: Record<string, unknown> = {
    from: (table: unknown) => {
      mockFrom(table)
      return builder
    },
    where: (predicate: unknown) => {
      mockWhere(predicate)
      return builder
    },
  }

  return {
    checklistItems: {
      eventUid: "checklistItems.eventUid",
      isChecked: "checklistItems.isChecked",
      deletedAt: "checklistItems.deletedAt",
    },
    db: {
      select: (projection: unknown) => {
        mockSelect(projection)
        return builder
      },
    },
    inArray: (column: unknown, values: unknown[]) =>
      mockInArray(column, values),
    sql: (parts: TemplateStringsArray) => mockSql(parts),
    useLiveQuery: (query: unknown, deps: unknown[]) => {
      mockUseLiveQuery(query, deps)
      const [, setVersion] = React.useState(0)
      React.useEffect(() => {
        mockListeners.add(setVersion)
        return () => mockListeners.delete(setVersion)
      }, [])
      return { data: mockRows }
    },
  }
})

function notifyChecklistChange(rows: Row[]): void {
  mockRows = rows
  for (const listener of mockListeners) listener((current) => current + 1)
}

beforeEach(() => {
  mockRows = []
  mockListeners.clear()
  ;[
    mockSelect,
    mockFrom,
    mockWhere,
    mockInArray,
    mockSql,
    mockUseLiveQuery,
  ].forEach((mock) => mock.mockClear())
})

describe("aggregateChecklistProgress", () => {
  it("returns no entry for zero rows and aggregates partial and complete counts", () => {
    const progress = aggregateChecklistProgress([
      { eventUid: "partial", isChecked: true },
      { eventUid: "partial", isChecked: false },
      { eventUid: "partial", isChecked: false },
      { eventUid: "complete", isChecked: true },
      { eventUid: "complete", isChecked: true },
    ])

    expect(progress.get("zero")).toBeUndefined()
    expect(progress.get("partial")).toEqual({
      completed: 1,
      total: 3,
      isComplete: false,
    })
    expect(progress.get("complete")).toEqual({
      completed: 2,
      total: 2,
      isComplete: true,
    })
  })

  it("counts imported rows with non-null deletedAt", () => {
    const importedRows: Row[] = [
      {
        eventUid: "imported",
        isChecked: true,
        deletedAt: "2025-01-01T00:00:00.000Z",
      },
    ]
    const progress = aggregateChecklistProgress(importedRows)

    expect(progress.get("imported")).toMatchObject({ completed: 1, total: 1 })
  })
})

describe("useChecklistProgress", () => {
  it("normalizes duplicate synced/personal-style UIDs into one projected live query", async () => {
    mockRows = [
      { eventUid: "personal-1", isChecked: false },
      { eventUid: "synced-1", isChecked: true },
    ]
    const { result } = await renderHook(() =>
      useChecklistProgress(["synced-1", "personal-1", "synced-1", ""]),
    )

    expect(mockUseLiveQuery).toHaveBeenCalledTimes(1)
    expect(mockSelect).toHaveBeenCalledWith({
      eventUid: "checklistItems.eventUid",
      isChecked: "checklistItems.isChecked",
    })
    expect(mockInArray).toHaveBeenCalledWith("checklistItems.eventUid", [
      "personal-1",
      "synced-1",
    ])
    expect(mockWhere).toHaveBeenCalledTimes(1)
    expect(mockWhere.mock.calls[0]?.[0]).not.toEqual(
      expect.objectContaining({ column: "checklistItems.deletedAt" }),
    )
    expect(result.current.get("synced-1")?.completed).toBe(1)
    expect(result.current.get("personal-1")?.total).toBe(1)
  })

  it("uses an always-false predicate for an empty UID set", async () => {
    const { result } = await renderHook(() => useChecklistProgress([]))

    expect(result.current.size).toBe(0)
    expect(mockSql).toHaveBeenCalledTimes(1)
    expect(mockInArray).not.toHaveBeenCalled()
    expect(mockUseLiveQuery).toHaveBeenCalledTimes(1)
  })

  it("updates one mounted consumer across add, check, uncheck, reorder, and hard-delete notifications", async () => {
    const { result } = await renderHook(() => useChecklistProgress(["event-1"]))
    expect(result.current.get("event-1")).toBeUndefined()

    await act(async () =>
      notifyChecklistChange([{ eventUid: "event-1", isChecked: false }]),
    )
    expect(result.current.get("event-1")).toMatchObject({
      completed: 0,
      total: 1,
    })

    await act(async () =>
      notifyChecklistChange([{ eventUid: "event-1", isChecked: true }]),
    )
    expect(result.current.get("event-1")).toMatchObject({
      completed: 1,
      total: 1,
    })

    await act(async () =>
      notifyChecklistChange([{ eventUid: "event-1", isChecked: false }]),
    )
    expect(result.current.get("event-1")?.completed).toBe(0)

    await act(async () =>
      notifyChecklistChange([{ eventUid: "event-1", isChecked: false }]),
    )
    expect(result.current.get("event-1")).toMatchObject({
      completed: 0,
      total: 1,
    })

    await act(async () => notifyChecklistChange([]))
    expect(result.current.get("event-1")).toBeUndefined()
    expect(mockListeners.size).toBe(1)
  })
})
