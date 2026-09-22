import {
  buildCalendarTimelinePresentation,
  planCalendarThreePageRange,
} from "@/features/calendar/data"

import { DENSE_WEEK_ANCHOR, denseWeekFixture } from "./calendar-dense-week"

const range = planCalendarThreePageRange({
  anchor: DENSE_WEEK_ANCHOR,
  mode: "week",
  displayZone: "UTC",
  firstWeekday: 1,
  showWeekends: true,
})

function placement(events: ReturnType<typeof denseWeekFixture>) {
  return buildCalendarTimelinePresentation({
    range,
    generation: 1,
    events,
  }).pages[1].columns.flatMap((column) =>
    column.tiles.map(({ identity, column, columns, startX, endX }) => ({
      uid: identity.uid,
      column,
      columns,
      startX,
      endX,
    })),
  )
}

describe("denseWeekFixture", () => {
  it("publishes identified deterministic UTC density cases", () => {
    const events = denseWeekFixture()
    expect(events).toHaveLength(16)
    expect(events.map(({ identity }) => identity.uid)).toEqual([
      "fx-mon-1",
      "fx-mon-2",
      "fx-tue-1",
      "fx-tue-2",
      "fx-tue-3",
      "fx-tue-4",
      "fx-tue-5",
      "fx-wed-1",
      "fx-wed-2",
      "fx-wed-3",
      "fx-wed-point",
      "fx-wed-tiny",
      "fx-thu-1",
      "fx-thu-2",
      "fx-fri-1",
      "fx-fri-2",
    ])
    expect(events[0]!.startsAt.toISOString()).toBe("2026-06-15T08:00:00.000Z")
    expect(events[10]!.startsAt.getTime()).toBe(events[10]!.endsAt.getTime())
    expect(events[11]!.endsAt.getTime() - events[11]!.startsAt.getTime()).toBe(
      2 * 60_000,
    )
  })

  it("keeps all 16 identities and placements stable when input reverses", () => {
    const events = denseWeekFixture()
    expect(placement([...events].reverse())).toEqual(placement(events))
    expect(
      placement(events).filter(({ columns }) => columns === 5),
    ).toHaveLength(5)
    expect(
      placement(events).filter(({ columns }) => columns === 3),
    ).toHaveLength(3)
    expect(
      placement(events).filter(({ columns }) => columns === 2),
    ).toHaveLength(2)
  })
})
