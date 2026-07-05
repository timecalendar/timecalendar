// Prove each repository function against the @/db seam, mocked (D8): real
// expo-sqlite has no off-device JS, so we assert the Drizzle query SHAPE and the
// row→domain mapping rather than a real round-trip (that is on-device — the
// Maestro launch runs the real CREATE TABLE). The shared createFakeDb fake
// overrides the seam with a stateful, spy-instrumented query builder; the tests
// read its `spies` for the shape assertions and `seed()` for the read rows. The
// fake instance is `mock`-prefixed so the hoisted jest.mock factory may reference it.

import { createFakeDb } from "@/test-support/fake-db"

import { eventToRow, type PersonalEvent } from "./types"

const mockFake = createFakeDb({
  tables: { personalEvents: { columns: ["uid"], pk: "uid" } },
})

jest.mock("@/db", () => mockFake.module)

// require() the SUT lazily (not a top-level import) so the eager `@/db` value
// import inside repository.ts can't fire the hoisted jest.mock factory before
// `mockFake` is assigned. The table token comes from the mocked module.
const { personalEvents } = mockFake.module as {
  personalEvents: { uid: string }
}
const { findAll, getById, remove, upsert } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as typeof import("./repository")

const event: PersonalEvent = {
  uid: "uid-1",
  title: "Lecture",
  color: "#E91E63",
  startsAt: new Date("2026-06-14T09:00:00.000Z"),
  endsAt: new Date("2026-06-14T10:30:00.000Z"),
  exportedAt: new Date("2026-06-14T08:00:00.000Z"),
  location: "Room 12",
  description: undefined,
}

beforeEach(() => {
  mockFake.reset()
})

describe("personal-events repository", () => {
  it("findAll selects all rows and maps them to domain", async () => {
    mockFake.seed("personalEvents", [eventToRow(event)])
    const result = await findAll()
    expect(mockFake.spies.select).toHaveBeenCalled()
    expect(mockFake.spies.from).toHaveBeenCalledWith(personalEvents)
    expect(result).toHaveLength(1)
    expect(result[0]?.uid).toBe("uid-1")
    expect(result[0]?.startsAt).toBeInstanceOf(Date)
  })

  it("getById selects by uid and maps the row, or returns undefined", async () => {
    mockFake.seed("personalEvents", [eventToRow(event)])
    const found = await getById("uid-1")
    expect(mockFake.spies.eq).toHaveBeenCalledWith(personalEvents.uid, "uid-1")
    expect(mockFake.spies.where).toHaveBeenCalled()
    expect(found?.uid).toBe("uid-1")

    expect(await getById("missing")).toBeUndefined()
  })

  it("upsert inserts with onConflictDoUpdate by uid using the mapped row", async () => {
    await upsert(event)
    expect(mockFake.spies.insert).toHaveBeenCalledWith(personalEvents)
    expect(mockFake.spies.values).toHaveBeenCalledWith(eventToRow(event))
    expect(mockFake.spies.onConflictDoUpdate).toHaveBeenCalledWith({
      target: personalEvents.uid,
      set: eventToRow(event),
    })
  })

  it("remove deletes by uid", async () => {
    await remove("uid-1")
    expect(mockFake.spies.delete).toHaveBeenCalledWith(personalEvents)
    expect(mockFake.spies.eq).toHaveBeenCalledWith(personalEvents.uid, "uid-1")
    expect(mockFake.spies.where).toHaveBeenCalled()
  })
})
