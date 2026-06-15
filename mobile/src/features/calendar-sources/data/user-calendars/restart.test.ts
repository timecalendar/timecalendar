// The central durability proof CI *can* run (D9). On-disk SQLite materialization
// is on-device (the Maestro launch / the inboxed manual restart pass); here we
// prove the repository's write-then-read-back CONTRACT against a stateful
// in-memory mock @/db (a Map-backed fake honoring insert/onConflictDoUpdate/
// select/where/delete). The Map lives at MODULE scope OUTSIDE the jest.mock
// factory and is NOT reset between the write and the read, standing in for the
// on-disk store that survives a process restart — so after jest.resetModules() a
// FRESHLY-imported repository module reads back exactly what the prior module
// wrote (token + every field intact). Token correctness IS the user's identity,
// so this is the load-bearing test of the whole ship. Spy state is `mock`-prefixed
// so the hoisted jest.mock factory may reference it.

import type { UserCalendar } from "./types"

// require() (not dynamic import()) so jest.resetModules() yields a fresh module
// instance under the CJS transform — a dynamic import() needs
// --experimental-vm-modules, which this jest config doesn't enable. The fresh
// require after resetModules() is the "restart": a new repository module + a new
// @/db handle, while the module-scoped mockStore (the "disk") survives.
type Repository = typeof import("./repository")
const loadRepository = (): Repository =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as Repository

// The "disk": a Map<id, row> that persists across module resets.
const mockStore = new Map<string, Record<string, unknown>>()

// A column-token → field-name map so the fake can resolve eq(col, val).
const mockColumn: Record<string, string> = {
  "userCalendars.id": "id",
  "userCalendars.token": "token",
}

jest.mock("@/db", () => {
  // A resolved eq() condition: { field, val } or null (no where).
  const matches = (
    row: Record<string, unknown>,
    cond: { field: string; val: unknown } | null,
  ): boolean => cond === null || row[cond.field] === cond.val

  const makeSelect = () => {
    let cond: { field: string; val: unknown } | null = null
    const builder: Record<string, unknown> = {
      from: () => builder,
      where: (c: { field: string; val: unknown }) => {
        cond = c
        return builder
      },
      then: (resolve: (rows: unknown[]) => unknown) =>
        resolve([...mockStore.values()].filter((row) => matches(row, cond))),
    }
    return builder
  }

  const makeInsert = () => {
    let pending: Record<string, unknown> | null = null
    const builder: Record<string, unknown> = {
      values: (row: Record<string, unknown>) => {
        pending = row
        return builder
      },
      onConflictDoUpdate: ({ set }: { set: Record<string, unknown> }) => {
        // Upsert by id: insert when absent, overwrite when present (Flutter put).
        const id = String((pending ?? set).id)
        mockStore.set(id, {
          ...mockStore.get(id),
          ...(pending ?? {}),
          ...set,
        })
        return builder
      },
      then: (resolve: (v: unknown) => unknown) => resolve(undefined),
    }
    return builder
  }

  const makeDelete = () => {
    const builder: Record<string, unknown> = {
      where: (c: { field: string; val: unknown }) => {
        for (const [id, row] of mockStore) {
          if (row[c.field] === c.val) {
            mockStore.delete(id)
          }
        }
        return builder
      },
      then: (resolve: (v: unknown) => unknown) => resolve(undefined),
    }
    return builder
  }

  const makeUpdate = () => {
    let patch: Record<string, unknown> = {}
    const builder: Record<string, unknown> = {
      set: (p: Record<string, unknown>) => {
        patch = p
        return builder
      },
      where: (c: { field: string; val: unknown }) => {
        for (const [id, row] of mockStore) {
          if (row[c.field] === c.val) {
            mockStore.set(id, { ...row, ...patch })
          }
        }
        return builder
      },
      then: (resolve: (v: unknown) => unknown) => resolve(undefined),
    }
    return builder
  }

  return {
    db: {
      select: () => makeSelect(),
      insert: () => makeInsert(),
      delete: () => makeDelete(),
      update: () => makeUpdate(),
    },
    userCalendars: { id: "userCalendars.id", token: "userCalendars.token" },
    eq: (col: string, val: unknown) => ({
      field: mockColumn[col] ?? col,
      val,
    }),
  }
})

const calendar: UserCalendar = {
  id: "cal-restart",
  token: "AdWBldUNaMhQfLjGrsAlN",
  name: "ENSEEIHT — 3A SN",
  schoolName: "ENSEEIHT",
  schoolId: "school-1",
  lastUpdatedAt: new Date("2026-06-14T09:00:00.000Z"),
  createdAt: new Date("2026-06-10T08:00:00.000Z"),
  visible: true,
}

beforeEach(() => {
  mockStore.clear()
})

describe("user-calendars restart durability", () => {
  it("reads back a prior write through a freshly-imported repository module", async () => {
    // First "session": import the repository, write a calendar.
    const first = loadRepository()
    await first.upsert(calendar)

    // Simulate a process restart: drop the module registry (a fresh handle), but
    // the "disk" (the module-scoped Map) survives — exactly what on-disk SQLite
    // gives across a real restart.
    jest.resetModules()
    const second = loadRepository()

    const restored = await second.getById("cal-restart")
    expect(restored).toBeDefined()
    expect(restored?.id).toBe(calendar.id)
    // The irreplaceable identity field survives intact.
    expect(restored?.token).toBe(calendar.token)
    expect(restored?.name).toBe(calendar.name)
    expect(restored?.schoolName).toBe(calendar.schoolName)
    expect(restored?.schoolId).toBe(calendar.schoolId)
    expect(restored?.lastUpdatedAt.getTime()).toBe(
      calendar.lastUpdatedAt.getTime(),
    )
    expect(restored?.createdAt.getTime()).toBe(calendar.createdAt.getTime())
    expect(restored?.visible).toBe(true)
  })

  it("reads back the token via getByToken after a simulated restart", async () => {
    const first = loadRepository()
    await first.upsert(calendar)

    jest.resetModules()
    const second = loadRepository()

    const byToken = await second.getByToken("AdWBldUNaMhQfLjGrsAlN")
    expect(byToken?.id).toBe("cal-restart")
  })

  it("an upsert by the same id updates rather than duplicating", async () => {
    const repo = loadRepository()
    await repo.upsert(calendar)
    await repo.upsert({ ...calendar, name: "Renamed" })

    const all = await repo.findAll()
    expect(all).toHaveLength(1)
    expect(all[0]?.name).toBe("Renamed")
  })

  it("a removed calendar is absent after a simulated restart", async () => {
    const first = loadRepository()
    await first.upsert(calendar)
    await first.remove("cal-restart")

    jest.resetModules()
    const second = loadRepository()
    expect(await second.getById("cal-restart")).toBeUndefined()
  })
})
