// Prove each repository function against the @/db seam, mocked (D9): real
// expo-sqlite has no off-device JS, so we assert the Drizzle query SHAPE and the
// row→domain mapping rather than a real round-trip (the on-disk proof is on-device
// — the Maestro launch / the inboxed manual restart pass). A local jest.mock("@/db")
// overrides the seam with a chainable query-builder spy. Spy names are
// `mock`-prefixed so the hoisted jest.mock factory may reference them.

import { eq, userCalendars } from "@/db"

import {
  findAll,
  getById,
  getByToken,
  remove,
  setVisible,
  upsert,
} from "./repository"
import { calendarToRow, type UserCalendar } from "./types"

let mockRows: unknown[] = []
const mockWhere = jest.fn()
const mockFrom = jest.fn()
const mockValues = jest.fn()
const mockOnConflict = jest.fn()
const mockSet = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockDelete = jest.fn()
const mockUpdate = jest.fn()

jest.mock("@/db", () => {
  const makeBuilder = (): Record<string, unknown> => {
    const builder: Record<string, unknown> = {
      from: (...a: unknown[]) => (mockFrom(...a), builder),
      where: (...a: unknown[]) => (mockWhere(...a), builder),
      values: (...a: unknown[]) => (mockValues(...a), builder),
      onConflictDoUpdate: (...a: unknown[]) => (mockOnConflict(...a), builder),
      set: (...a: unknown[]) => (mockSet(...a), builder),
      then: (resolve: (value: unknown[]) => unknown) => resolve(mockRows),
    }
    return builder
  }
  return {
    db: {
      select: (...a: unknown[]) => (mockSelect(...a), makeBuilder()),
      insert: (...a: unknown[]) => (mockInsert(...a), makeBuilder()),
      delete: (...a: unknown[]) => (mockDelete(...a), makeBuilder()),
      update: (...a: unknown[]) => (mockUpdate(...a), makeBuilder()),
    },
    userCalendars: {
      id: "userCalendars.id",
      token: "userCalendars.token",
    },
    eq: jest.fn((col, val) => ({ op: "eq", col, val })),
  }
})

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

const rowOf = (c: UserCalendar) => ({
  id: c.id,
  token: c.token,
  name: c.name,
  schoolName: c.schoolName ?? null,
  schoolId: c.schoolId ?? null,
  lastUpdatedAt: c.lastUpdatedAt.toISOString(),
  createdAt: c.createdAt.toISOString(),
  visible: c.visible,
})

beforeEach(() => {
  mockRows = []
  ;[
    mockWhere,
    mockFrom,
    mockValues,
    mockOnConflict,
    mockSet,
    mockSelect,
    mockInsert,
    mockDelete,
    mockUpdate,
  ].forEach((m) => m.mockClear())
})

describe("user-calendars repository", () => {
  it("findAll selects all rows and maps them to domain", async () => {
    mockRows = [rowOf(calendar)]
    const result = await findAll()
    expect(mockSelect).toHaveBeenCalled()
    expect(mockFrom).toHaveBeenCalledWith(userCalendars)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe("cal-1")
    expect(result[0]?.lastUpdatedAt).toBeInstanceOf(Date)
  })

  it("getById selects by id and maps the row, or returns undefined", async () => {
    mockRows = [rowOf(calendar)]
    const found = await getById("cal-1")
    expect(eq).toHaveBeenCalledWith(userCalendars.id, "cal-1")
    expect(mockWhere).toHaveBeenCalled()
    expect(found?.id).toBe("cal-1")

    mockRows = []
    expect(await getById("missing")).toBeUndefined()
  })

  it("getByToken selects by token and maps the row, or returns undefined", async () => {
    mockRows = [rowOf(calendar)]
    const found = await getByToken("tok-1")
    expect(eq).toHaveBeenCalledWith(userCalendars.token, "tok-1")
    expect(mockWhere).toHaveBeenCalled()
    expect(found?.token).toBe("tok-1")

    mockRows = []
    expect(await getByToken("missing")).toBeUndefined()
  })

  it("upsert inserts with onConflictDoUpdate by id using the mapped row", async () => {
    await upsert(calendar)
    expect(mockInsert).toHaveBeenCalledWith(userCalendars)
    expect(mockValues).toHaveBeenCalledWith(calendarToRow(calendar))
    expect(mockOnConflict).toHaveBeenCalledWith({
      target: userCalendars.id,
      set: calendarToRow(calendar),
    })
  })

  it("remove deletes by id", async () => {
    await remove("cal-1")
    expect(mockDelete).toHaveBeenCalledWith(userCalendars)
    expect(eq).toHaveBeenCalledWith(userCalendars.id, "cal-1")
    expect(mockWhere).toHaveBeenCalled()
  })

  it("setVisible updates the visible column by id", async () => {
    await setVisible("cal-1", false)
    expect(mockUpdate).toHaveBeenCalledWith(userCalendars)
    expect(mockSet).toHaveBeenCalledWith({ visible: false })
    expect(eq).toHaveBeenCalledWith(userCalendars.id, "cal-1")
    expect(mockWhere).toHaveBeenCalled()
  })
})
