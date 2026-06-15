import type { CalendarForPublic } from "@/api/generated/timeCalendar.schemas"

import {
  calendarToRow,
  fromCalendarForPublic,
  rowToCalendar,
  type UserCalendar,
} from "./types"

// Pure mappers — no SQLite mock. Proves the round-trip (every field preserved,
// timestamps equal, row date strings canonical UTC ISO-8601, `visible` preserved),
// the importer-fidelity verbatim property (a toDbMap()-shaped row reads back with
// no value change), null↔undefined handling, and the server-DTO mapper. Token
// correctness IS the user's identity, so these are the load-bearing tests.

const baseCalendar: UserCalendar = {
  id: "700ff-cal-id",
  token: "AdWBldUNaMhQfLjGrsAlN",
  name: "ENSEEIHT — 3A SN",
  schoolName: "ENSEEIHT",
  schoolId: "school-1",
  lastUpdatedAt: new Date("2026-06-14T09:00:00.000Z"),
  createdAt: new Date("2026-06-10T08:00:00.000Z"),
  visible: true,
}

describe("user-calendars mappers", () => {
  it("round-trips a domain calendar through calendarToRow → rowToCalendar", () => {
    const row = calendarToRow(baseCalendar)
    const back = rowToCalendar({
      ...row,
      // $inferInsert widens optionals + defaults; the select shape has them present.
      schoolName: row.schoolName ?? null,
      schoolId: row.schoolId ?? null,
      visible: row.visible ?? true,
    })

    expect(back.id).toBe(baseCalendar.id)
    expect(back.token).toBe(baseCalendar.token)
    expect(back.name).toBe(baseCalendar.name)
    expect(back.schoolName).toBe(baseCalendar.schoolName)
    expect(back.schoolId).toBe(baseCalendar.schoolId)
    expect(back.lastUpdatedAt.getTime()).toBe(
      baseCalendar.lastUpdatedAt.getTime(),
    )
    expect(back.createdAt.getTime()).toBe(baseCalendar.createdAt.getTime())
    expect(back.visible).toBe(true)
  })

  it("writes canonical UTC ISO-8601 date strings", () => {
    const row = calendarToRow(baseCalendar)
    expect(row.lastUpdatedAt).toBe("2026-06-14T09:00:00.000Z")
    expect(row.createdAt).toBe("2026-06-10T08:00:00.000Z")
  })

  it("normalizes a non-UTC Date to a canonical Z string", () => {
    const row = calendarToRow({
      ...baseCalendar,
      lastUpdatedAt: new Date("2026-06-14T11:00:00.000+02:00"),
    })
    expect(row.lastUpdatedAt).toBe("2026-06-14T09:00:00.000Z")
  })

  it("maps undefined schoolName/schoolId to null on write", () => {
    const row = calendarToRow({
      ...baseCalendar,
      schoolName: undefined,
      schoolId: undefined,
    })
    expect(row.schoolName).toBeNull()
    expect(row.schoolId).toBeNull()
  })

  it("maps null schoolName/schoolId to undefined on read", () => {
    const back = rowToCalendar({
      id: "id-2",
      token: "tok-2",
      name: "Personal",
      schoolName: null,
      schoolId: null,
      lastUpdatedAt: "2026-06-14T09:00:00.000Z",
      createdAt: "2026-06-10T08:00:00.000Z",
      visible: false,
    })
    expect(back.schoolName).toBeUndefined()
    expect(back.schoolId).toBeUndefined()
    expect(back.visible).toBe(false)
  })

  it("imports a toDbMap()-shaped row verbatim (importer fidelity)", () => {
    // The exact Flutter UserCalendar.toDbMap() wire format (id, token, name,
    // nullable schoolName/schoolId, UTC ISO-8601 dates, boolean visible). Reading
    // it back and re-writing it must change NO value — the no-data-loss property
    // for the no-backup Phase-09 recovery.
    const dbMapRow = {
      id: "700ff8e0-recovered",
      token: "AdWBldUNaMhQfLjGrsAlN",
      name: "ENSEEIHT — 3A SN",
      schoolName: "ENSEEIHT",
      schoolId: "school-1",
      lastUpdatedAt: "2026-06-14T09:00:00.000Z",
      createdAt: "2026-06-10T08:00:00.000Z",
      visible: true,
    }
    const reWritten = calendarToRow(rowToCalendar(dbMapRow))
    expect(reWritten).toEqual(dbMapRow)
  })

  it("imports a toDbMap()-shaped row with null school fields verbatim", () => {
    const dbMapRow = {
      id: "imported-no-school",
      token: "tok-import",
      name: "Imported calendar",
      schoolName: null,
      schoolId: null,
      lastUpdatedAt: "2026-06-01T00:00:00.000Z",
      createdAt: "2026-05-01T00:00:00.000Z",
      visible: false,
    }
    expect(calendarToRow(rowToCalendar(dbMapRow))).toEqual(dbMapRow)
  })

  it("maps a CalendarForPublic DTO to the domain type (visible defaults true)", () => {
    const dto: CalendarForPublic = {
      id: "srv-id",
      token: "srv-tok",
      name: "Server calendar",
      schoolName: "ENSEEIHT",
      schoolId: "school-1",
      lastUpdatedAt: "2026-06-14T09:00:00.000Z",
      createdAt: "2026-06-10T08:00:00.000Z",
    }
    const calendar = fromCalendarForPublic(dto)
    expect(calendar.id).toBe("srv-id")
    expect(calendar.token).toBe("srv-tok")
    expect(calendar.name).toBe("Server calendar")
    expect(calendar.schoolName).toBe("ENSEEIHT")
    expect(calendar.schoolId).toBe("school-1")
    expect(calendar.lastUpdatedAt.getTime()).toBe(
      new Date("2026-06-14T09:00:00.000Z").getTime(),
    )
    expect(calendar.createdAt.getTime()).toBe(
      new Date("2026-06-10T08:00:00.000Z").getTime(),
    )
    expect(calendar.visible).toBe(true)
  })

  it("maps a DTO null schoolName and absent schoolId to undefined", () => {
    const dto: CalendarForPublic = {
      id: "srv-id",
      token: "srv-tok",
      name: "Server calendar",
      schoolName: null,
      lastUpdatedAt: "2026-06-14T09:00:00.000Z",
      createdAt: "2026-06-10T08:00:00.000Z",
    }
    const calendar = fromCalendarForPublic(dto)
    expect(calendar.schoolName).toBeUndefined()
    expect(calendar.schoolId).toBeUndefined()
  })
})
