// The central durability proof CI *can* run (ADR 024) — checklist_items is
// irreplaceable (no server backup), so the write-then-read-back contract is the
// load-bearing test of the whole ship. On-disk SQLite materialization is on-device
// (the inboxed manual restart pass); here we prove the repository's contract
// against a stateful in-memory mock @/db (a Map-backed fake honoring insert /
// select+where+orderBy / update+set+where / delete+where / transaction). The Map
// lives at MODULE scope OUTSIDE the jest.mock factory and is NOT reset between the
// write and the read, standing in for the on-disk store that survives a process
// restart — so after jest.resetModules() a FRESHLY-imported repository module reads
// back exactly what the prior module wrote. A SECOND table Map proves the soft-ref
// survival property: a simulated calendar_events replaceAll (drop the events table)
// leaves the checklist table untouched (no FK cascade — ADR 024 / decision 2). Spy
// state is `mock`-prefixed so the hoisted jest.mock factory may reference it.

import type { ChecklistItem } from "./types"

// require() (not dynamic import()) so jest.resetModules() yields a fresh module
// instance under the CJS transform. The fresh require after resetModules() is the
// "restart": a new repository module + a new @/db handle, while the module-scoped
// stores (the "disk") survive.
type Repository = typeof import("./repository")
const loadRepository = (): Repository =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as Repository

// The "disk": a Map per table, persisting across module resets.
const mockChecklistStore = new Map<string, Record<string, unknown>>()
const mockCalendarStore = new Map<string, Record<string, unknown>>()

// A column token → { table, field } map so the fake can resolve eq(col, val).
const mockColumn: Record<string, { table: string; field: string }> = {
  "checklistItems.uuid": { table: "checklist", field: "uuid" },
  "checklistItems.eventUid": { table: "checklist", field: "eventUid" },
  "checklistItems.order": { table: "checklist", field: "order" },
}

jest.mock("@/db", () => {
  const tableOf = (token: unknown): Map<string, Record<string, unknown>> =>
    token === "calendarEvents" ? mockCalendarStore : mockChecklistStore
  const pkOf = (token: unknown): string =>
    token === "calendarEvents" ? "uid" : "uuid"

  const matches = (
    row: Record<string, unknown>,
    cond: { field: string; val: unknown } | null,
  ): boolean => cond === null || row[cond.field] === cond.val

  const makeSelect = () => {
    let store = mockChecklistStore
    let cond: { field: string; val: unknown } | null = null
    let orderField: string | null = null
    const builder: Record<string, unknown> = {
      from: (token: unknown) => {
        store = tableOf(token)
        return builder
      },
      where: (c: { field: string; val: unknown } | null) => {
        cond = c
        return builder
      },
      orderBy: (o: { field: string }) => {
        orderField = o.field
        return builder
      },
      then: (resolve: (rows: unknown[]) => unknown) => {
        let rows = [...store.values()].filter((row) => matches(row, cond))
        if (orderField !== null) {
          const f = orderField
          rows = [...rows].sort((a, b) => Number(a[f]) - Number(b[f]))
        }
        return resolve(rows)
      },
    }
    return builder
  }

  const makeInsert = () => {
    let store = mockChecklistStore
    let pk = "uuid"
    const builder: Record<string, unknown> = {
      from: () => builder,
      values: (row: Record<string, unknown>) => {
        store.set(String(row[pk]), { ...row })
        return builder
      },
      then: (resolve: (v: unknown) => unknown) => resolve(undefined),
    }
    // insert(table) sets the target store before .values runs.
    return (token: unknown) => {
      store = tableOf(token)
      pk = pkOf(token)
      return builder
    }
  }

  const makeDelete = () => {
    let store = mockChecklistStore
    const builder: Record<string, unknown> = {
      where: (c: { field: string; val: unknown } | null) => {
        if (c !== null) {
          for (const [key, row] of store) {
            if (row[c.field] === c.val) store.delete(key)
          }
        }
        return { then: (r: (v: unknown) => unknown) => r(undefined) }
      },
      then: (resolve: (v: unknown) => unknown) => {
        // delete(table) with no where: clear the whole table (the sync drop).
        store.clear()
        return resolve(undefined)
      },
    }
    return (token: unknown) => {
      store = tableOf(token)
      return builder
    }
  }

  const makeUpdate = () => {
    let store = mockChecklistStore
    let patch: Record<string, unknown> = {}
    const builder: Record<string, unknown> = {
      set: (p: Record<string, unknown>) => {
        patch = p
        return builder
      },
      where: (c: { field: string; val: unknown } | null) => {
        if (c !== null) {
          for (const [key, row] of store) {
            if (row[c.field] === c.val) store.set(key, { ...row, ...patch })
          }
        }
        return { then: (r: (v: unknown) => unknown) => r(undefined) }
      },
    }
    return (token: unknown) => {
      store = tableOf(token)
      return builder
    }
  }

  const db: Record<string, unknown> = {
    select: () => makeSelect(),
    insert: (token: unknown) => makeInsert()(token),
    delete: (token: unknown) => makeDelete()(token),
    update: (token: unknown) => makeUpdate()(token),
    // The reorder runs inside db.transaction; the fake just hands the same db back
    // (a single store, no real isolation needed for the read-back contract).
    transaction: (cb: (tx: unknown) => Promise<unknown>) => cb(db),
  }

  return {
    db,
    checklistItems: {
      uuid: "checklistItems.uuid",
      eventUid: "checklistItems.eventUid",
      order: "checklistItems.order",
    },
    calendarEvents: "calendarEvents",
    eq: (col: string, val: unknown) => {
      const c = mockColumn[col]
      return { field: c?.field ?? col, val }
    },
    asc: (col: string) => ({ field: mockColumn[col]?.field ?? col }),
  }
})

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
  mockChecklistStore.clear()
  mockCalendarStore.clear()
})

describe("event-checklists restart durability", () => {
  it("reads back prior writes through a freshly-imported repository module, in order", async () => {
    const first = loadRepository()
    await first.add(makeItem({ uuid: "u-1", content: "First", order: 1 }))
    await first.add(makeItem({ uuid: "u-2", content: "Second", order: 2 }))

    // Simulate a process restart: drop the module registry (a fresh handle), but
    // the "disk" (the module-scoped Maps) survives — exactly what on-disk SQLite
    // gives across a real restart.
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
    const { db, calendarEvents } = jest.requireMock("@/db") as {
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
