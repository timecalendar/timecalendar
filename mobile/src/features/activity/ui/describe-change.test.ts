import { describeChangedItem } from "./describe-change"

const event = (overrides: Partial<ReturnType<typeof baseEvent>> = {}) => ({
  ...baseEvent(),
  ...overrides,
})

function baseEvent() {
  return {
    uid: "event",
    title: "Algorithms",
    startsAt: "2026-08-30T10:00:00.000Z",
    endsAt: "2026-08-30T11:00:00.000Z",
    location: "A1" as string | null,
  }
}

describe("describeChangedItem", () => {
  it("lists only a location change", () => {
    expect(describeChangedItem(event(), event({ location: "B2" }))).toEqual([
      { field: "location", from: "A1", to: "B2" },
    ])
  })

  it("lists only a time change", () => {
    const result = describeChangedItem(
      event(),
      event({ startsAt: "2026-08-30T12:00:00.000Z" }),
      (start, end) => `${start.getUTCHours()}-${end.getUTCHours()}`,
    )
    expect(result).toEqual([{ field: "time", from: "10-11", to: "12-11" }])
  })

  it("lists a title change", () => {
    expect(describeChangedItem(event(), event({ title: "Databases" }))).toEqual(
      [{ field: "title", from: "Algorithms", to: "Databases" }],
    )
  })

  it("returns no differences for identical versions", () => {
    expect(describeChangedItem(event(), event())).toEqual([])
  })

  it("treats null and a location value as different", () => {
    expect(
      describeChangedItem(event({ location: null }), event({ location: "A1" })),
    ).toEqual([{ field: "location", from: "", to: "A1" }])
  })

  it("drops an unparseable time difference", () => {
    expect(
      describeChangedItem(event(), event({ startsAt: "not-a-date" })),
    ).toEqual([])
  })
})
