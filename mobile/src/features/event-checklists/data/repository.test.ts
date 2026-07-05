// Prove each repository function against the @/db seam, mocked: real expo-sqlite
// has no off-device JS, so we assert the Drizzle query SHAPE (the ordered read,
// the insert, the column UPDATE, the transactional re-number, the hard DELETE) and
// the row→domain mapping rather than a real round-trip. The shared createFakeDb
// fake overrides the seam with a stateful, spy-instrumented query builder + a
// transaction whose `tx` IS the same instrumented db (so the reorder's tx-scoped
// update/set/where record to the shared spies). The fake instance is `mock`-prefixed
// so the hoisted jest.mock factory may reference it.

import { createFakeDb } from "@/test-support/fake-db"

import { type ChecklistItem, checklistItemToRow } from "./types"

const mockFake = createFakeDb({
  tables: {
    checklistItems: { columns: ["uuid", "eventUid", "order"], pk: "uuid" },
  },
})

jest.mock("@/db", () => mockFake.module)

// require() the SUT lazily (not a top-level import) so the eager `@/db` value
// import inside repository.ts can't fire the hoisted jest.mock factory before
// `mockFake` is assigned. The table token comes from the mocked module.
const { checklistItems } = mockFake.module as {
  checklistItems: { uuid: string; eventUid: string; order: string }
}
const { add, findByEvent, remove, reorder, setChecked, setContent } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as typeof import("./repository")

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

beforeEach(() => {
  mockFake.reset()
})

describe("event-checklists repository", () => {
  it("findByEvent selects by eventUid ordered by order asc, with NO deletedAt filter", async () => {
    mockFake.seed("checklistItems", [
      checklistItemToRow(makeItem()),
      checklistItemToRow(makeItem({ uuid: "u-2", order: 2 })),
    ])
    const result = await findByEvent("ev-1")

    expect(mockFake.spies.select).toHaveBeenCalled()
    expect(mockFake.spies.from).toHaveBeenCalledWith(checklistItems)
    expect(mockFake.spies.eq).toHaveBeenCalledWith(
      checklistItems.eventUid,
      "ev-1",
    )
    expect(mockFake.spies.where).toHaveBeenCalledTimes(1)
    expect(mockFake.spies.asc).toHaveBeenCalledWith(checklistItems.order)
    expect(mockFake.spies.orderBy).toHaveBeenCalled()
    expect(result).toHaveLength(2)
    expect(result[0]?.uuid).toBe("11111111-1111-4111-8111-111111111111")
    expect(result[0]?.createdAt).toBeInstanceOf(Date)
  })

  it("add inserts the mapped row", async () => {
    const item = makeItem()
    await add(item)
    expect(mockFake.spies.insert).toHaveBeenCalledWith(checklistItems)
    expect(mockFake.spies.values).toHaveBeenCalledWith(checklistItemToRow(item))
  })

  it("setContent updates the content column + updatedAt by uuid", async () => {
    await setContent("u-1", "Revise chapter 4")
    expect(mockFake.spies.update).toHaveBeenCalledWith(checklistItems)
    const patch = mockFake.spies.set.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >
    expect(patch.content).toBe("Revise chapter 4")
    expect(typeof patch.updatedAt).toBe("string")
    expect(mockFake.spies.eq).toHaveBeenCalledWith(checklistItems.uuid, "u-1")
  })

  it("setChecked updates the isChecked column + updatedAt by uuid", async () => {
    await setChecked("u-1", true)
    expect(mockFake.spies.update).toHaveBeenCalledWith(checklistItems)
    const patch = mockFake.spies.set.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >
    expect(patch.isChecked).toBe(true)
    expect(typeof patch.updatedAt).toBe("string")
    expect(mockFake.spies.eq).toHaveBeenCalledWith(checklistItems.uuid, "u-1")
  })

  it("reorder re-numbers order 1-based inside one transaction", async () => {
    const items = [
      makeItem({ uuid: "u-a", order: 5 }),
      makeItem({ uuid: "u-b", order: 9 }),
      makeItem({ uuid: "u-c", order: 2 }),
    ]
    await reorder(items)

    expect(mockFake.spies.transaction).toHaveBeenCalledTimes(1)
    expect(mockFake.spies.update).toHaveBeenCalledTimes(3)
    // Each row gets its 1-based order in list position.
    expect(mockFake.spies.set.mock.calls[0]?.[0]).toMatchObject({ order: 1 })
    expect(mockFake.spies.set.mock.calls[1]?.[0]).toMatchObject({ order: 2 })
    expect(mockFake.spies.set.mock.calls[2]?.[0]).toMatchObject({ order: 3 })
    // Keyed on each item's uuid.
    expect(mockFake.spies.eq).toHaveBeenCalledWith(checklistItems.uuid, "u-a")
    expect(mockFake.spies.eq).toHaveBeenCalledWith(checklistItems.uuid, "u-c")
  })

  it("remove hard-deletes by uuid", async () => {
    await remove("u-1")
    expect(mockFake.spies.delete).toHaveBeenCalledWith(checklistItems)
    expect(mockFake.spies.eq).toHaveBeenCalledWith(checklistItems.uuid, "u-1")
    expect(mockFake.spies.where).toHaveBeenCalled()
  })
})
