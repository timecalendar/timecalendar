import { dateToIso, isoToDate, nullToUndef, undefToNull } from "./mappers"

// The four primitives are mechanical aliases of the expressions the feature
// mappers replaced (new Date(x) / x.toISOString() / x ?? undefined / x ?? null);
// prove each alias equivalence directly. The feature mapper suites (personal-
// events, user-calendars, event-checklists, calendar/sync) are the end-to-end
// no-behavior-change oracle.

describe("db mapper primitives", () => {
  it("isoToDate parses a canonical UTC ISO string to a Date", () => {
    const iso = "2030-01-02T03:04:05.000Z"
    expect(isoToDate(iso)).toEqual(new Date(iso))
    expect(isoToDate(iso).toISOString()).toBe(iso)
  })

  it("dateToIso serializes a Date to the canonical UTC ISO string", () => {
    const date = new Date("2030-01-02T03:04:05.000Z")
    expect(dateToIso(date)).toBe(date.toISOString())
  })

  it("isoToDate/dateToIso round-trip a canonical UTC string", () => {
    const iso = "2030-06-15T12:00:00.000Z"
    expect(dateToIso(isoToDate(iso))).toBe(iso)
  })

  it("nullToUndef maps null → undefined and passes a value through", () => {
    expect(nullToUndef(null)).toBeUndefined()
    expect(nullToUndef("value")).toBe("value")
  })

  it("undefToNull maps undefined → null and passes a value through", () => {
    expect(undefToNull(undefined)).toBeNull()
    expect(undefToNull("value")).toBe("value")
  })
})
