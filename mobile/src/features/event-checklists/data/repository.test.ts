// Prove each repository function against the @/db seam, mocked: real expo-sqlite
// has no off-device JS, so we assert the Drizzle query SHAPE (the ordered read,
// the insert, the column UPDATE, the transactional re-number, the hard DELETE) and
// the row→domain mapping rather than a real round-trip. A local jest.mock("@/db")
// overrides the seam with a chainable query-builder + a transaction spy. Spy names
// are `mock`-prefixed so the hoisted jest.mock factory may reference them.

import { asc, checklistItems, eq } from "@/db"

import {
  add,
  findByEvent,
  remove,
  reorder,
  setChecked,
  setContent,
} from "./repository"
import { type ChecklistItem, checklistItemToRow } from "./types"

let mockRows: unknown[] = []
const mockWhere = jest.fn()
const mockFrom = jest.fn()
const mockOrderBy = jest.fn()
const mockValues = jest.fn()
const mockSet = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockDelete = jest.fn()
const mockUpdate = jest.fn()
// Transaction-scoped spies (the `tx` builder inside db.transaction).
const mockTxUpdate = jest.fn()
const mockTxSet = jest.fn()
const mockTxWhere = jest.fn()
const mockTransaction = jest.fn()

jest.mock("@/db", () => {
  const makeBuilder = (): Record<string, unknown> => {
    const builder: Record<string, unknown> = {
      from: (...a: unknown[]) => (mockFrom(...a), builder),
      where: (...a: unknown[]) => (mockWhere(...a), builder),
      orderBy: (...a: unknown[]) => (mockOrderBy(...a), builder),
      values: (...a: unknown[]) => (mockValues(...a), builder),
      set: (...a: unknown[]) => (mockSet(...a), builder),
      then: (resolve: (value: unknown[]) => unknown) => resolve(mockRows),
    }
    return builder
  }
  const tx = {
    update: (...a: unknown[]) => {
      mockTxUpdate(...a)
      const b: Record<string, unknown> = {
        set: (...s: unknown[]) => (mockTxSet(...s), b),
        where: (...w: unknown[]) => {
          mockTxWhere(...w)
          return { then: (r: (v: unknown) => unknown) => r(undefined) }
        },
      }
      return b
    },
  }
  return {
    db: {
      select: (...a: unknown[]) => (mockSelect(...a), makeBuilder()),
      insert: (...a: unknown[]) => (mockInsert(...a), makeBuilder()),
      delete: (...a: unknown[]) => (mockDelete(...a), makeBuilder()),
      update: (...a: unknown[]) => (mockUpdate(...a), makeBuilder()),
      transaction: (cb: (t: typeof tx) => Promise<unknown>) => {
        mockTransaction()
        return cb(tx)
      },
    },
    checklistItems: {
      uuid: "checklistItems.uuid",
      eventUid: "checklistItems.eventUid",
      order: "checklistItems.order",
    },
    eq: jest.fn((col, val) => ({ op: "eq", col, val })),
    asc: jest.fn((col) => ({ op: "asc", col })),
  }
})

function makeItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    uuid: "11111111-1111-4111-8111-111111111111",
    eventUid: "ev-1",
    content: "Bring the lab coat",
    isChecked: false,
    order: 1,
    createdAt: new Date("2026-06-14T09:00:00.000Z"),
    updatedAt: new Date("2026-06-14T09:00:00.000Z"),
    deletedAt: undefined,
    ...overrides,
  }
}

const rowOf = (i: ChecklistItem) => checklistItemToRow(i)

beforeEach(() => {
  mockRows = []
  ;[
    mockWhere,
    mockFrom,
    mockOrderBy,
    mockValues,
    mockSet,
    mockSelect,
    mockInsert,
    mockDelete,
    mockUpdate,
    mockTxUpdate,
    mockTxSet,
    mockTxWhere,
    mockTransaction,
  ].forEach((m) => m.mockClear())
})

describe("event-checklists repository", () => {
  it("findByEvent selects by eventUid ordered by order asc, with NO deletedAt filter", async () => {
    mockRows = [rowOf(makeItem()), rowOf(makeItem({ uuid: "u-2", order: 2 }))]
    const result = await findByEvent("ev-1")

    expect(mockSelect).toHaveBeenCalled()
    expect(mockFrom).toHaveBeenCalledWith(checklistItems)
    expect(eq).toHaveBeenCalledWith(checklistItems.eventUid, "ev-1")
    expect(mockWhere).toHaveBeenCalledTimes(1)
    expect(asc).toHaveBeenCalledWith(checklistItems.order)
    expect(mockOrderBy).toHaveBeenCalled()
    expect(result).toHaveLength(2)
    expect(result[0]?.uuid).toBe("11111111-1111-4111-8111-111111111111")
    expect(result[0]?.createdAt).toBeInstanceOf(Date)
  })

  it("add inserts the mapped row", async () => {
    const item = makeItem()
    await add(item)
    expect(mockInsert).toHaveBeenCalledWith(checklistItems)
    expect(mockValues).toHaveBeenCalledWith(checklistItemToRow(item))
  })

  it("setContent updates the content column + updatedAt by uuid", async () => {
    await setContent("u-1", "Revise chapter 4")
    expect(mockUpdate).toHaveBeenCalledWith(checklistItems)
    const patch = mockSet.mock.calls[0]?.[0] as Record<string, unknown>
    expect(patch.content).toBe("Revise chapter 4")
    expect(typeof patch.updatedAt).toBe("string")
    expect(eq).toHaveBeenCalledWith(checklistItems.uuid, "u-1")
  })

  it("setChecked updates the isChecked column + updatedAt by uuid", async () => {
    await setChecked("u-1", true)
    expect(mockUpdate).toHaveBeenCalledWith(checklistItems)
    const patch = mockSet.mock.calls[0]?.[0] as Record<string, unknown>
    expect(patch.isChecked).toBe(true)
    expect(typeof patch.updatedAt).toBe("string")
    expect(eq).toHaveBeenCalledWith(checklistItems.uuid, "u-1")
  })

  it("reorder re-numbers order 1-based inside one transaction", async () => {
    const items = [
      makeItem({ uuid: "u-a", order: 5 }),
      makeItem({ uuid: "u-b", order: 9 }),
      makeItem({ uuid: "u-c", order: 2 }),
    ]
    await reorder(items)

    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(mockTxUpdate).toHaveBeenCalledTimes(3)
    // Each row gets its 1-based order in list position.
    expect(mockTxSet.mock.calls[0]?.[0]).toMatchObject({ order: 1 })
    expect(mockTxSet.mock.calls[1]?.[0]).toMatchObject({ order: 2 })
    expect(mockTxSet.mock.calls[2]?.[0]).toMatchObject({ order: 3 })
    // Keyed on each item's uuid.
    expect(eq).toHaveBeenCalledWith(checklistItems.uuid, "u-a")
    expect(eq).toHaveBeenCalledWith(checklistItems.uuid, "u-c")
  })

  it("remove hard-deletes by uuid", async () => {
    await remove("u-1")
    expect(mockDelete).toHaveBeenCalledWith(checklistItems)
    expect(eq).toHaveBeenCalledWith(checklistItems.uuid, "u-1")
    expect(mockWhere).toHaveBeenCalled()
  })
})
