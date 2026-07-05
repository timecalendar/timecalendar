// Prove each repository function against the @/db seam, mocked (D9): real
// expo-sqlite has no off-device JS, so we assert the Drizzle query SHAPE and the
// row→domain mapping rather than a real round-trip (the on-disk proof is on-device
// — the Maestro launch / the inboxed manual restart pass). The shared createFakeDb
// fake overrides the seam with a stateful, spy-instrumented query builder; the
// tests read its `spies` for the shape assertions and `seed()` for the read rows.
// The fake instance is `mock`-prefixed so the hoisted jest.mock factory may
// reference it.

import { createFakeDb } from "@/test-support/fake-db"

import type { UserCalendar } from "./types"

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

// require() the SUT lazily (not a top-level import) so the eager `@/db` value
// import inside repository.ts can't fire the hoisted jest.mock factory before
// `mockFake` is assigned. The table token comes from the mocked module.
const { userCalendars } = mockFake.module as {
  userCalendars: { id: string; token: string }
}
const { findAll, getById, getByToken, remove, setVisible, upsert } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as typeof import("./repository")
// Required lazily (not a top-level value import) for the same reason as the SUT:
// `./types`' `@/db` mapper imports would otherwise fire the mock factory before
// `mockFake` is assigned.
const { calendarToRow } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./types") as typeof import("./types")

const calendar: UserCalendar = {
  id: "cal-1",
  token: "tok-1",
  name: "ENSEEIHT",
  schoolName: "ENSEEIHT",
  schoolId: "school-1",
  lastUpdatedAt: new Date("2026-06-14T09:00:00.000Z"),
  createdAt: new Date("2026-06-10T08:00:00.000Z"),
  visible: true,
}

beforeEach(() => {
  mockFake.reset()
})

describe("user-calendars repository", () => {
  it("findAll selects all rows and maps them to domain", async () => {
    mockFake.seed("userCalendars", [calendarToRow(calendar)])
    const result = await findAll()
    expect(mockFake.spies.select).toHaveBeenCalled()
    expect(mockFake.spies.from).toHaveBeenCalledWith(userCalendars)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe("cal-1")
    expect(result[0]?.lastUpdatedAt).toBeInstanceOf(Date)
  })

  it("getById selects by id and maps the row, or returns undefined", async () => {
    mockFake.seed("userCalendars", [calendarToRow(calendar)])
    const found = await getById("cal-1")
    expect(mockFake.spies.eq).toHaveBeenCalledWith(userCalendars.id, "cal-1")
    expect(mockFake.spies.where).toHaveBeenCalled()
    expect(found?.id).toBe("cal-1")

    expect(await getById("missing")).toBeUndefined()
  })

  it("getByToken selects by token and maps the row, or returns undefined", async () => {
    mockFake.seed("userCalendars", [calendarToRow(calendar)])
    const found = await getByToken("tok-1")
    expect(mockFake.spies.eq).toHaveBeenCalledWith(userCalendars.token, "tok-1")
    expect(mockFake.spies.where).toHaveBeenCalled()
    expect(found?.token).toBe("tok-1")

    expect(await getByToken("missing")).toBeUndefined()
  })

  it("upsert inserts with onConflictDoUpdate by id using the mapped row", async () => {
    await upsert(calendar)
    expect(mockFake.spies.insert).toHaveBeenCalledWith(userCalendars)
    expect(mockFake.spies.values).toHaveBeenCalledWith(calendarToRow(calendar))
    // Pin concrete literal fields so the assertion cannot pass on a wrong/stubbed
    // mapper (the `calendarToRow(calendar)` match alone is tautological); prove the
    // row carries the id verbatim and the Date→ISO conversion actually happened.
    expect(mockFake.spies.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cal-1",
        lastUpdatedAt: "2026-06-14T09:00:00.000Z",
      }),
    )
    expect(mockFake.spies.onConflictDoUpdate).toHaveBeenCalledWith({
      target: userCalendars.id,
      set: calendarToRow(calendar),
    })
  })

  it("remove deletes by id", async () => {
    await remove("cal-1")
    expect(mockFake.spies.delete).toHaveBeenCalledWith(userCalendars)
    expect(mockFake.spies.eq).toHaveBeenCalledWith(userCalendars.id, "cal-1")
    expect(mockFake.spies.where).toHaveBeenCalled()
  })

  it("setVisible updates the visible column by id", async () => {
    await setVisible("cal-1", false)
    expect(mockFake.spies.update).toHaveBeenCalledWith(userCalendars)
    expect(mockFake.spies.set).toHaveBeenCalledWith({ visible: false })
    expect(mockFake.spies.eq).toHaveBeenCalledWith(userCalendars.id, "cal-1")
    expect(mockFake.spies.where).toHaveBeenCalled()
  })
})
