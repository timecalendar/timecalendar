// The durability proof CI *can* run: the write-then-read-back contract against the
// shared stateful in-memory @/db fake (createFakeDb — a Map-backed "disk" honoring
// the transactional replaceAll + a whole-table select). The store lives inside the
// fake's closure OUTSIDE the jest.mock factory and is NOT reset between the write
// and the read, standing in for on-disk SQLite that survives a process restart — so
// after jest.resetModules() the persisted rows still read back exactly what the
// prior module wrote (the drop+replace persisted), through the production
// whole-table read (useSyncedEvents' shape; the dead findInRange range read is
// gone). On-disk atomicity is the on-device manual pass (inbox); here we prove the
// repository contract. The fake instance is `mock`-prefixed so the hoisted
// jest.mock factory may reference it.

import type { CalendarEvent } from "@/features/calendar/data/types"
import { createFakeDb } from "@/test-support/fake-db"

import { rowToCalendarEvent } from "./types"

// Type-only reference to the seam — a `typeof import(...)` never emits a runtime
// require, so it can't trigger the hoisted jest.mock factory before `mockFake` is
// assigned (a top-level value `import … from "@/db"` would). The runtime `db` +
// table token come from `mockFake.module` instead.
type CalendarEventInsert =
  (typeof import("@/db"))["calendarEvents"]["$inferInsert"]
type CalendarEventRow = Parameters<typeof rowToCalendarEvent>[0]
type Db = {
  select: () => { from: (t: unknown) => Promise<CalendarEventRow[]> }
}
type Repository = typeof import("./repository")
const loadRepository = (): Repository =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as Repository

const mockFake = createFakeDb({
  tables: { calendarEvents: { columns: ["uid"], pk: "uid" } },
})

jest.mock("@/db", () => mockFake.module)

const { db, calendarEvents } = mockFake.module as {
  db: Db
  calendarEvents: unknown
}

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

// The production read (useSyncedEvents) is a whole-table select mapped row→domain;
// read the persisted "disk" back through that same shape (findInRange is gone).
async function readAll(): Promise<CalendarEvent[]> {
  const rows = await db.select().from(calendarEvents)
  return rows.map(rowToCalendarEvent)
}

beforeEach(() => {
  mockFake.reset()
})

describe("calendar-sync restart durability", () => {
  it("reads back a prior replaceAll after a simulated restart (persisted disk)", async () => {
    const first = loadRepository()
    await first.replaceAll([row()])

    // Simulate a process restart: drop the module registry, but the "disk" (the
    // fake's store) survives — exactly what on-disk SQLite gives.
    jest.resetModules()

    const restored = await readAll()
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

    const all = await readAll()
    expect(all.map((e) => e.id).sort()).toEqual(["ev-new"])
  })

  it("an empty replaceAll clears the table", async () => {
    const repo = loadRepository()
    await repo.replaceAll([row()])
    await repo.replaceAll([])

    jest.resetModules()
    expect(await readAll()).toEqual([])
  })
})
