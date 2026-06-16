// The durability proof CI *can* run: the write-then-read-back contract against a
// stateful in-memory mock @/db (a Map-backed fake honoring the transactional
// replaceAll + a range select). The Map lives at MODULE scope OUTSIDE the
// jest.mock factory and is NOT reset between the write and the read, standing in
// for on-disk SQLite that survives a process restart — so after jest.resetModules()
// a FRESHLY-imported repository module reads back exactly what the prior module
// wrote (the drop+replace persisted). On-disk atomicity is the on-device manual
// pass (inbox); here we prove the repository contract. Spy state is `mock`-prefixed
// so the hoisted jest.mock factory may reference it.

import type { calendarEvents } from "@/db"

type CalendarEventInsert = typeof calendarEvents.$inferInsert
type Repository = typeof import("./repository")
const loadRepository = (): Repository =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as Repository

// The "disk": a Map<uid, row> that persists across module resets.
const mockStore = new Map<string, Record<string, unknown>>()

// A resolved overlap condition produced by and(lte(...), gte(...)): the
// repository builds it from ISO bounds; the fake reproduces the same filter. The
// type lives at module scope (not inside the jest.mock factory, whose hoisting
// disallows referencing a factory-local type).
type Cond = { startsAtMax: string; endsAtMin: string } | null

jest.mock("@/db", () => {
  const makeSelect = () => {
    let cond: Cond = null
    const builder: Record<string, unknown> = {
      from: () => builder,
      where: (c: Cond) => {
        cond = c
        return builder
      },
      then: (resolve: (rows: unknown[]) => unknown) =>
        resolve(
          [...mockStore.values()].filter((row) => {
            if (cond === null) return true
            const startsAt = String(row.startsAt)
            const endsAt = String(row.endsAt)
            return startsAt <= cond.startsAtMax && endsAt >= cond.endsAtMin
          }),
        ),
    }
    return builder
  }

  const tx = {
    delete: () => {
      mockStore.clear()
      return { then: (r: (v: unknown) => unknown) => r(undefined) }
    },
    insert: () => ({
      values: (rows: Record<string, unknown>[]) => {
        for (const row of rows) mockStore.set(String(row.uid), row)
        return { then: (r: (v: unknown) => unknown) => r(undefined) }
      },
    }),
  }

  return {
    db: {
      select: () => makeSelect(),
      transaction: (cb: (t: typeof tx) => Promise<unknown>) => cb(tx),
    },
    calendarEvents: {
      startsAt: "calendarEvents.startsAt",
      endsAt: "calendarEvents.endsAt",
    },
    and: (lte: { val: string }, gte: { val: string }) => ({
      startsAtMax: lte.val,
      endsAtMin: gte.val,
    }),
    lte: (_col: string, val: string) => ({ val }),
    gte: (_col: string, val: string) => ({ val }),
  }
})

// replaceAll takes verbatim INSERT rows now (dtoToRow's output), not domain events.
function row(
  overrides: Partial<CalendarEventInsert> = {},
): CalendarEventInsert {
  return {
    uid: "ev-restart",
    title: "Algorithms",
    color: "#1E88E5",
    groupColor: "#0D47A1",
    startsAt: "2026-06-16T09:00:00.000Z",
    endsAt: "2026-06-16T10:30:00.000Z",
    exportedAt: "2026-06-15T08:00:00.000Z",
    location: "Room A1",
    description: "Lecture",
    allDay: false,
    teachers: JSON.stringify(["Dr. Ada"]),
    tags: JSON.stringify([{ name: "CM", color: "#FF0000", icon: "book" }]),
    fields: null,
    type: "cm",
    userCalendarId: "cal-1",
    ...overrides,
  }
}

const wideRange = {
  from: new Date("2026-06-01T00:00:00.000Z"),
  to: new Date("2026-06-30T00:00:00.000Z"),
}

beforeEach(() => {
  mockStore.clear()
})

describe("calendar-sync restart durability", () => {
  it("reads back a prior replaceAll through a freshly-imported repository module", async () => {
    const first = loadRepository()
    await first.replaceAll([row()])

    // Simulate a process restart: drop the module registry, but the "disk" (the
    // module-scoped Map) survives — exactly what on-disk SQLite gives.
    jest.resetModules()
    const second = loadRepository()

    const restored = await second.findInRange(wideRange.from, wideRange.to)
    expect(restored).toHaveLength(1)
    expect(restored[0]?.id).toBe("ev-restart")
    expect(restored[0]?.title).toBe("Algorithms")
    expect(restored[0]?.teachers).toEqual(["Dr. Ada"])
    expect(restored[0]?.userCalendarId).toBe("cal-1")
    expect(restored[0]?.startsAt.getTime()).toBe(
      new Date(row().startsAt).getTime(),
    )
  })

  it("a second replaceAll fully replaces the prior set (drop+replace)", async () => {
    const repo = loadRepository()
    await repo.replaceAll([row(), row({ uid: "ev-old" })])
    await repo.replaceAll([row({ uid: "ev-new" })])

    const all = await repo.findInRange(wideRange.from, wideRange.to)
    expect(all.map((e) => e.id).sort()).toEqual(["ev-new"])
  })

  it("an empty replaceAll clears the table", async () => {
    const repo = loadRepository()
    await repo.replaceAll([row()])
    await repo.replaceAll([])

    jest.resetModules()
    const second = loadRepository()
    expect(await second.findInRange(wideRange.from, wideRange.to)).toEqual([])
  })
})
