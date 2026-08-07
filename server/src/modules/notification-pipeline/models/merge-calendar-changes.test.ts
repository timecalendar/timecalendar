import {
  filterByDaysAhead,
  mergeCalendarChanges,
  SerializedCalendarChange,
} from "modules/notification-pipeline/models/merge-calendar-changes"

const event = (uid: string, startsAt: string) => ({
  uid,
  title: `Event ${uid}`,
  location: null,
  startsAt,
  endsAt: startsAt,
})

const emptyChange: SerializedCalendarChange = {
  oldItems: [],
  newItems: [],
  changedItems: [],
}

describe("mergeCalendarChanges", () => {
  it("flattens new/cancelled/edited items with revived dates", () => {
    const merged = mergeCalendarChanges([
      {
        newItems: [event("a", "2026-08-10T08:00:00.000Z")],
        oldItems: [event("b", "2026-08-11T08:00:00.000Z")],
        changedItems: [
          [
            event("c", "2026-08-12T08:00:00.000Z"),
            event("c", "2026-08-12T09:00:00.000Z"),
          ],
        ],
      },
    ])

    expect(merged).toHaveLength(3)
    const byUid = Object.fromEntries(merged.map((m) => [m.event.uid, m]))
    expect(byUid.a.type).toBe("new")
    expect(byUid.b.type).toBe("cancel")
    expect(byUid.c.type).toBe("edit")
    expect(byUid.c.event.startsAt).toEqual(new Date("2026-08-12T09:00:00.000Z"))
  })

  it("keeps only the latest change per event uid", () => {
    const merged = mergeCalendarChanges([
      { ...emptyChange, newItems: [event("a", "2026-08-10T08:00:00.000Z")] },
      { ...emptyChange, oldItems: [event("a", "2026-08-10T08:00:00.000Z")] },
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0].type).toBe("cancel")
  })
})

describe("filterByDaysAhead", () => {
  const now = new Date("2026-08-07T12:00:00.000Z")

  const itemAt = (startsAt: string) =>
    mergeCalendarChanges([{ ...emptyChange, newItems: [event("x", startsAt)] }])

  it("keeps events starting inside the window", () => {
    const items = itemAt("2026-08-13T12:00:00.000Z")
    expect(filterByDaysAhead(items, 7, now)).toHaveLength(1)
  })

  it("keeps an event starting exactly at the horizon", () => {
    const items = itemAt("2026-08-14T12:00:00.000Z")
    expect(filterByDaysAhead(items, 7, now)).toHaveLength(1)
  })

  it("drops events starting beyond the horizon", () => {
    const items = itemAt("2026-08-14T12:00:00.001Z")
    expect(filterByDaysAhead(items, 7, now)).toHaveLength(0)
  })
})
