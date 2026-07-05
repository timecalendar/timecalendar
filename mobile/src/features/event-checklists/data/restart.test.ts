// The central durability proof CI *can* run (ADR 024) — checklist_items is
// irreplaceable (no server backup), so the write-then-read-back contract is the
// load-bearing test of the whole ship. On-disk SQLite materialization is on-device
// (the inboxed manual restart pass); here we prove the repository's contract
// against the shared stateful in-memory @/db fake (createFakeDb — a Map-backed
// "disk" honoring insert / select+where+orderBy / update+set+where / delete+where /
// transaction). The store lives inside the fake's closure OUTSIDE the jest.mock
// factory and is NOT reset between the write and the read, standing in for the
// on-disk store that survives a process restart — so after jest.resetModules() a
// FRESHLY-imported repository module reads back exactly what the prior module wrote.
// A SECOND table proves the soft-ref survival property: a simulated
// calendar_events replaceAll (drop the events table) leaves the checklist table
// untouched (no FK cascade — ADR 024 / decision 2). The fake instance is
// `mock`-prefixed so the hoisted jest.mock factory may reference it.

import { createFakeDb } from "@/test-support/fake-db"

import type { ChecklistItem } from "./types"

// require() (not dynamic import()) so jest.resetModules() yields a fresh module
// instance under the CJS transform. The fresh require after resetModules() is the
// "restart": a new repository module + a new @/db handle, while the fake's stores
// (the "disk") survive.
type Repository = typeof import("./repository")
const loadRepository = (): Repository =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as Repository

const mockFake = createFakeDb({
  tables: {
    checklistItems: { columns: ["uuid", "eventUid", "order"], pk: "uuid" },
    calendarEvents: { columns: ["uid"], pk: "uid" },
  },
})

// The row↔domain mappers now live on the @/db seam — the fake stubs the query
// surface, so spread the real mapper impls back in (they are pure; stubbing them
// would destroy the no-behavior-change oracle).
jest.mock("@/db", () => ({
  ...mockFake.module,
  ...jest.requireActual<object>("@/db/mappers"),
}))

function makeItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    uuid: "u-1",
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

describe("event-checklists restart durability", () => {
  it("reads back prior writes through a freshly-imported repository module, in order", async () => {
    const first = loadRepository()
    await first.add(makeItem({ uuid: "u-1", content: "First", order: 1 }))
    await first.add(makeItem({ uuid: "u-2", content: "Second", order: 2 }))

    // Simulate a process restart: drop the module registry (a fresh handle), but
    // the "disk" (the fake's stores) survives — exactly what on-disk SQLite gives
    // across a real restart.
    jest.resetModules()
    const second = loadRepository()

    const restored = await second.findByEvent("ev-1")
    expect(restored).toHaveLength(2)
    expect(restored.map((i) => i.content)).toEqual(["First", "Second"])
    expect(restored[0]?.order).toBe(1)
    expect(restored[1]?.order).toBe(2)
    // Every field survives intact.
    expect(restored[0]?.createdAt?.toISOString()).toBe(
      "2026-06-14T09:00:00.000Z",
    )
  })

  it("a setChecked / setContent survives the restart", async () => {
    const first = loadRepository()
    await first.add(makeItem({ uuid: "u-1", content: "Draft" }))
    await first.setContent("u-1", "Final")
    await first.setChecked("u-1", true)

    jest.resetModules()
    const second = loadRepository()
    const [item] = await second.findByEvent("ev-1")
    expect(item?.content).toBe("Final")
    expect(item?.isChecked).toBe(true)
  })

  it("a removed item is absent after a simulated restart", async () => {
    const first = loadRepository()
    await first.add(makeItem({ uuid: "u-1" }))
    await first.remove("u-1")

    jest.resetModules()
    const second = loadRepository()
    expect(await second.findByEvent("ev-1")).toHaveLength(0)
  })

  it("a reorder re-numbers the order and survives the restart", async () => {
    const first = loadRepository()
    await first.add(makeItem({ uuid: "u-1", content: "A", order: 1 }))
    await first.add(makeItem({ uuid: "u-2", content: "B", order: 2 }))
    await first.add(makeItem({ uuid: "u-3", content: "C", order: 3 }))
    const items = await first.findByEvent("ev-1")
    // Move C to the front.
    await first.reorder([items[2]!, items[0]!, items[1]!])

    jest.resetModules()
    const second = loadRepository()
    const reordered = await second.findByEvent("ev-1")
    expect(reordered.map((i) => i.content)).toEqual(["C", "A", "B"])
    expect(reordered.map((i) => i.order)).toEqual([1, 2, 3])
  })

  it("a checklist survives a simulated calendar_events replaceAll (soft-ref, no FK cascade)", async () => {
    const first = loadRepository()
    // A checklist keyed on a SYNCED event's uid.
    await first.add(makeItem({ uuid: "u-1", eventUid: "synced-ev-1" }))

    // Simulate the sync drop+replace: clear the calendar_events table entirely
    // (what replaceAll's transaction does before re-inserting). The checklist
    // table is a SEPARATE store with no FK cascade.
    const { db, calendarEvents } = mockFake.module as {
      db: {
        delete: (t: unknown) => {
          then: (r: (v: unknown) => unknown) => unknown
        }
      }
      calendarEvents: unknown
    }
    await Promise.resolve(db.delete(calendarEvents))

    const survivors = await first.findByEvent("synced-ev-1")
    expect(survivors).toHaveLength(1)
    expect(survivors[0]?.uuid).toBe("u-1")
  })
})
