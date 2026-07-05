// The central durability proof CI *can* run (D9). On-disk SQLite materialization
// is on-device (the Maestro launch / the inboxed manual restart pass); here we
// prove the repository's write-then-read-back CONTRACT against the shared stateful
// in-memory @/db fake (createFakeDb — a Map-backed "disk" honoring insert /
// onConflictDoUpdate / select / where / delete). The store lives inside the fake's
// closure OUTSIDE the jest.mock factory and is NOT reset between the write and the
// read, standing in for the on-disk store that survives a process restart — so
// after jest.resetModules() a FRESHLY-imported repository module reads back exactly
// what the prior module wrote (token + every field intact). Token correctness IS
// the user's identity, so this is the load-bearing test of the whole ship. The fake
// instance is `mock`-prefixed so the hoisted jest.mock factory may reference it.

import { createFakeDb } from "@/test-support/fake-db"

import type { UserCalendar } from "./types"

// require() (not dynamic import()) so jest.resetModules() yields a fresh module
// instance under the CJS transform — a dynamic import() needs
// --experimental-vm-modules, which this jest config doesn't enable. The fresh
// require after resetModules() is the "restart": a new repository module + a new
// @/db handle, while the fake's store (the "disk") survives.
type Repository = typeof import("./repository")
const loadRepository = (): Repository =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as Repository

const mockFake = createFakeDb({
  tables: { userCalendars: { columns: ["id", "token"], pk: "id" } },
})

// The row↔domain mappers now live on the @/db seam — the fake stubs the query
// surface, so spread the real mapper impls back in (they are pure; stubbing them
// would destroy the no-behavior-change oracle).
jest.mock("@/db", () => ({
  ...mockFake.module,
  ...jest.requireActual<object>("@/db/mappers"),
}))

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
  mockFake.reset()
})

describe("user-calendars restart durability", () => {
  it("reads back a prior write through a freshly-imported repository module", async () => {
    // First "session": import the repository, write a calendar.
    const first = loadRepository()
    await first.upsert(calendar)

    // Simulate a process restart: drop the module registry (a fresh handle), but
    // the "disk" (the fake's store) survives — exactly what on-disk SQLite gives
    // across a real restart.
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
