import { accessibilityProbeFixture } from "@/test-support/owned-calendar/accessibility-probe"

import {
  compareCalendarAccessibilityOrdinal,
  projectCalendarAccessibilityEntries,
} from "./accessibility-projection"
import {
  type CalendarTimelinePageV1,
  planCalendarThreePageRange,
} from "./index"
import { buildCalendarTimelinePresentation } from "./timeline-presentation"

const range = planCalendarThreePageRange({
  anchor: new Date("2026-06-15T12:00:00.000Z"),
  mode: "week",
  displayZone: "UTC",
  firstWeekday: 1,
  showWeekends: true,
})

function projection(events = accessibilityProbeFixture()) {
  const presentation = buildCalendarTimelinePresentation({
    range,
    generation: 1,
    events,
  })
  return projectCalendarAccessibilityEntries(presentation.pages[1])
}

describe("projectCalendarAccessibilityEntries", () => {
  it("compares identity fields by code-point ordinal", () => {
    expect(compareCalendarAccessibilityOrdinal("a", "b")).toBe(-1)
    expect(compareCalendarAccessibilityOrdinal("b", "a")).toBe(1)
    expect(compareCalendarAccessibilityOrdinal("a", "a")).toBe(0)
  })

  it("orders the committed page by date, start, end, source, and UID", () => {
    const expected = [
      "synced:probe-early",
      "synced:probe-tied-short",
      "personal:probe-tied-personal",
      "synced:probe-tied-a",
      "synced:probe-tied-b",
      "synced:probe-overlap-a",
      "synced:probe-overlap-b",
      "synced:probe-tiny-a",
      "synced:probe-tiny-b",
      "synced:probe-late",
      "synced:probe-next-date",
    ]
    expect(projection().map(({ key }) => key)).toEqual(expected)
    expect(projection([...accessibilityProbeFixture()].reverse())).toEqual(
      projection(),
    )
  })

  it("keeps one immutable original identity and prepared geometry reference", () => {
    const entries = projection()
    expect(new Set(entries.map(({ key }) => key)).size).toBe(entries.length)
    expect(Object.isFrozen(entries)).toBe(true)
    expect(entries.every(Object.isFrozen)).toBe(true)
    for (const entry of entries) {
      expect(entry.identity).toBe(entry.tile.identity)
      expect(entry.startsAt).toBe(entry.tile.startsAt)
      expect(entry.endsAt).toBe(entry.tile.endsAt)
    }
  })

  it("is independent of zoom and viewport inputs by construction", () => {
    const entries = projection()
    expect(entries.map(({ tile }) => tile.startMinute)).toEqual([
      60, 600, 600, 600, 600, 660, 675, 720, 723, 1380, 60,
    ])
    expect(entries.some((entry) => "viewport" in entry)).toBe(false)
    expect(entries.some((entry) => "pixelsPerHour" in entry)).toBe(false)
  })

  it("rejects neighbour pages and duplicate identities across dates", () => {
    const presentation = buildCalendarTimelinePresentation({
      range,
      generation: 1,
      events: accessibilityProbeFixture(),
    })
    expect(() =>
      projectCalendarAccessibilityEntries(presentation.pages[0]),
    ).toThrow("committed page")

    const first = presentation.pages[1].columns[0]!.tiles[0]!
    const duplicatePage = {
      ...presentation.pages[1],
      columns: [
        presentation.pages[1].columns[0]!,
        {
          ...presentation.pages[1].columns[1]!,
          tiles: [first],
        },
      ],
    } satisfies CalendarTimelinePageV1
    expect(() => projectCalendarAccessibilityEntries(duplicatePage)).toThrow(
      "identities must be unique",
    )
  })
})
