import type { UserCalendar } from "@/features/calendar-sources/data"

import { deriveCalendarSummary } from "./summary"

function calendar(overrides: Partial<UserCalendar> = {}): UserCalendar {
  return {
    id: "calendar-1",
    token: "token-1",
    name: "Calendar",
    schoolName: undefined,
    schoolId: undefined,
    lastUpdatedAt: new Date("2026-01-01T00:00:00Z"),
    createdAt: new Date("2026-01-01T00:00:00Z"),
    visible: true,
    ...overrides,
  }
}

describe("deriveCalendarSummary", () => {
  it("keeps an unresolved read distinct from an empty collection", () => {
    expect(deriveCalendarSummary([], false)).toEqual({ state: "loading" })
    expect(deriveCalendarSummary([], true)).toEqual({
      state: "loaded",
      calendarCount: 0,
      schoolCount: 0,
      schoolName: undefined,
    })
  })

  it("deduplicates several calendars with one school id", () => {
    expect(
      deriveCalendarSummary(
        [
          calendar({ schoolId: "school-1", schoolName: "Sorbonne" }),
          calendar({ id: "calendar-2", schoolId: "school-1" }),
        ],
        true,
      ),
    ).toMatchObject({ schoolCount: 1, schoolName: "Sorbonne" })
  })

  it("normalizes name-only schools and aliases them to an id-backed school", () => {
    const result = deriveCalendarSummary(
      [
        calendar({ schoolName: "  Université   de Paris " }),
        calendar({
          id: "calendar-2",
          schoolId: "paris",
          schoolName: "université de paris",
        }),
      ],
      true,
    )
    expect(result).toMatchObject({ schoolCount: 1 })
  })

  it("counts multiple schools without selecting one", () => {
    expect(
      deriveCalendarSummary(
        [
          calendar({ schoolId: "one", schoolName: "One" }),
          calendar({ id: "calendar-2", schoolName: "Two" }),
        ],
        true,
      ),
    ).toMatchObject({ schoolCount: 2, schoolName: undefined })
  })

  it("excludes metadata-free calendars from school count but includes all calendars", () => {
    expect(
      deriveCalendarSummary(
        [
          calendar({ visible: false }),
          calendar({
            id: "calendar-2",
            schoolId: "one",
            schoolName: "One",
          }),
        ],
        true,
      ),
    ).toEqual({
      state: "loaded",
      calendarCount: 2,
      schoolCount: 1,
      schoolName: "One",
    })
  })

  it("is independent of input order", () => {
    const calendars = [
      calendar({ schoolId: "one", schoolName: "Zulu" }),
      calendar({ id: "calendar-2", schoolId: "one", schoolName: "Alpha" }),
    ]
    expect(deriveCalendarSummary(calendars, true)).toEqual(
      deriveCalendarSummary([...calendars].reverse(), true),
    )
    expect(deriveCalendarSummary(calendars, true)).toMatchObject({
      schoolName: "Alpha",
    })
  })
})
