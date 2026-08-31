import { act, renderHook } from "@testing-library/react-native"

import { createFakeDb } from "@/test-support/fake-db"

import type { ChecklistItem } from "./types"

const mockFake = createFakeDb({
  tables: {
    checklistItems: {
      columns: [
        "uuid",
        "eventUid",
        "content",
        "isChecked",
        "order",
        "createdAt",
        "updatedAt",
        "deletedAt",
      ],
      pk: "uuid",
    },
  },
})

jest.mock("@/db", () => ({
  ...mockFake.module,
  ...jest.requireActual<object>("@/db/mappers"),
}))

const { checklistItems } = mockFake.module as {
  checklistItems: { eventUid: string; isChecked: string }
}
const { aggregateChecklistProgress, useChecklistProgress } =
  jest.requireActual<typeof import("./progress")>("./progress")
const { add, remove, reorder, setChecked } =
  jest.requireActual<typeof import("./repository")>("./repository")
const { checklistItemToRow } =
  jest.requireActual<typeof import("./types")>("./types")

function item(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    uuid: "item-1",
    eventUid: "event-1",
    content: "Review notes",
    isChecked: false,
    order: 1,
    createdAt: new Date("2026-08-31T00:00:00.000Z"),
    updatedAt: new Date("2026-08-31T00:00:00.000Z"),
    deletedAt: undefined,
    ...overrides,
  }
}

beforeEach(() => mockFake.reset())

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
})

describe("useChecklistProgress", () => {
  it("runs one projected UID-set live query and excludes rows outside the set", async () => {
    mockFake.seed("checklistItems", [
      checklistItemToRow(
        item({
          uuid: "synced-row",
          eventUid: "synced-1",
          isChecked: true,
          deletedAt: new Date("2025-01-01T00:00:00.000Z"),
        }),
      ),
      checklistItemToRow(
        item({ uuid: "personal-row", eventUid: "personal-1" }),
      ),
      checklistItemToRow(
        item({ uuid: "outside-row", eventUid: "outside", isChecked: true }),
      ),
    ])

    const { result } = await renderHook(() =>
      useChecklistProgress(["synced-1", "personal-1", "synced-1", ""]),
    )

    expect(mockFake.spies.select).toHaveBeenCalledWith({
      eventUid: checklistItems.eventUid,
      isChecked: checklistItems.isChecked,
    })
    expect(mockFake.spies.inArray).toHaveBeenCalledWith(
      checklistItems.eventUid,
      ["personal-1", "synced-1"],
    )
    expect(mockFake.spies.where).toHaveBeenCalledTimes(1)
    expect(mockFake.spies.where).not.toHaveBeenCalledWith(
      expect.objectContaining({ field: "deletedAt" }),
    )
    expect(result.current.get("synced-1")).toEqual({
      completed: 1,
      total: 1,
      isComplete: true,
    })
    expect(result.current.get("personal-1")?.total).toBe(1)
    expect(result.current.get("outside")).toBeUndefined()
    expect(mockFake.liveQueryListenerCount()).toBe(1)
  })

  it("uses an always-false database predicate for an empty UID set", async () => {
    mockFake.seed("checklistItems", [checklistItemToRow(item())])

    const { result } = await renderHook(() => useChecklistProgress([]))

    expect(result.current.size).toBe(0)
    expect(mockFake.spies.sql).toHaveBeenCalledTimes(1)
    expect(mockFake.spies.inArray).not.toHaveBeenCalled()
    expect(mockFake.liveQueryListenerCount()).toBe(1)
  })

  it("requeries one mounted consumer after repository mutations", async () => {
    const imported = item({
      uuid: "imported",
      isChecked: true,
      deletedAt: new Date("2025-01-01T00:00:00.000Z"),
    })
    const added = item({ uuid: "added", order: 2 })
    mockFake.seed("checklistItems", [checklistItemToRow(imported)])
    const { result } = await renderHook(() => useChecklistProgress(["event-1"]))
    expect(result.current.get("event-1")).toMatchObject({
      completed: 1,
      total: 1,
    })

    await act(async () => add(added))
    expect(result.current.get("event-1")).toMatchObject({
      completed: 1,
      total: 2,
    })

    await act(async () => setChecked("added", true))
    expect(result.current.get("event-1")).toMatchObject({
      completed: 2,
      total: 2,
    })

    await act(async () => setChecked("added", false))
    expect(result.current.get("event-1")?.completed).toBe(1)

    await act(async () => reorder([added, imported]))
    expect(result.current.get("event-1")).toMatchObject({
      completed: 1,
      total: 2,
    })

    await act(async () => remove("imported"))
    expect(result.current.get("event-1")).toMatchObject({
      completed: 0,
      total: 1,
    })

    await act(async () => remove("added"))
    expect(result.current.get("event-1")).toBeUndefined()
    expect(mockFake.liveQueryListenerCount()).toBe(1)
  })
})
