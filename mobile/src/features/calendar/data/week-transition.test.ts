import { dayKey } from "./day-key"
import {
  type CalendarTimelineMode,
  cancelCalendarTransition,
  createCalendarTransitionState,
  normalizeTimelineAnchor,
  replaceCalendarTransition,
  requestCalendarTransition,
  settleCalendarTransition,
  shiftTimelineAnchor,
  timelineColumns,
} from "./week-transition"

const zone = "Europe/Paris"
const monday = 1 as const

function initial(mode: CalendarTimelineMode = "week") {
  return createCalendarTransitionState(
    new Date("2026-09-16T12:00:00.000Z"),
    mode,
    zone,
    monday,
  )
}

describe("calendar timeline policy", () => {
  it.each([
    ["day", "2026-09-16"],
    ["week", "2026-09-14"],
  ] as const)("normalizes %s anchors", (mode, expected) => {
    expect(
      dayKey(
        normalizeTimelineAnchor(
          new Date("2026-09-16T12:00:00.000Z"),
          mode,
          zone,
          monday,
        ),
        zone,
      ),
    ).toBe(expected)
  })

  it.each([
    ["day", 1, "2027-01-01"],
    ["day", -1, "2026-12-30"],
    ["week", 1, "2027-01-04"],
    ["week", -1, "2026-12-21"],
  ] as const)("steps %s by its civil unit", (mode, direction, expected) => {
    expect(
      dayKey(
        shiftTimelineAnchor(
          new Date("2026-12-31T12:00:00.000Z"),
          mode,
          direction,
          zone,
          monday,
        ),
        zone,
      ),
    ).toBe(expected)
  })

  it("steps across a DST boundary without fixed-duration drift", () => {
    const saturday = new Date("2026-03-28T12:00:00.000Z")
    const sunday = shiftTimelineAnchor(saturday, "day", 1, zone, monday)
    const mondayDate = shiftTimelineAnchor(sunday, "day", 1, zone, monday)
    expect(dayKey(sunday, zone)).toBe("2026-03-29")
    expect(dayKey(mondayDate, zone)).toBe("2026-03-30")
    expect(mondayDate.getTime() - sunday.getTime()).toBe(23 * 60 * 60 * 1000)
  })

  it("keeps weekend days visible in day mode when weekends are hidden", () => {
    const friday = new Date("2026-09-18T12:00:00.000Z")
    const saturday = shiftTimelineAnchor(friday, "day", 1, zone, monday)
    const sunday = shiftTimelineAnchor(saturday, "day", 1, zone, monday)
    expect(timelineColumns(friday, "day", zone, monday, false)).toHaveLength(1)
    expect(dayKey(saturday, zone)).toBe("2026-09-19")
    expect(dayKey(sunday, zone)).toBe("2026-09-20")
    expect(timelineColumns(saturday, "day", zone, monday, false)[0]?.key).toBe(
      "2026-09-19",
    )
  })
})

describe("calendar transition state", () => {
  it.each(["day", "week"] as const)(
    "accepts the current %s request once",
    (mode) => {
      const requested = requestCalendarTransition(
        initial(mode),
        { revision: 1, direction: 1, source: "gesture" },
        zone,
        monday,
      )
      const settled = settleCalendarTransition(requested, 1)
      expect(settled.accepted).toBe(true)
      expect(dayKey(settled.state.anchor, zone)).toBe(
        mode === "day" ? "2026-09-17" : "2026-09-21",
      )
      expect(settled.state.generation).toBe(1)
      expect(settled.state.pagePosition).toBe(1)
      expect(settleCalendarTransition(settled.state, 1)).toEqual({
        accepted: false,
        state: settled.state,
      })
    },
  )

  it("rejects stale requests and cancelled completions", () => {
    const first = requestCalendarTransition(
      initial(),
      { revision: 2, direction: 1, source: "next" },
      zone,
      monday,
    )
    const second = requestCalendarTransition(
      first,
      { revision: 3, direction: -1, source: "gesture" },
      zone,
      monday,
    )
    expect(
      requestCalendarTransition(second, first.pending!, zone, monday),
    ).toBe(second)
    expect(settleCalendarTransition(second, 2).accepted).toBe(false)
    expect(cancelCalendarTransition(second, 2)).toBe(second)
    const cancelled = cancelCalendarTransition(second, 3)
    expect(settleCalendarTransition(cancelled, 3).accepted).toBe(false)
  })

  it.each([
    ["week", "day", "2026-09-14"],
    ["day", "week", "2026-09-14"],
  ] as const)(
    "replaces %s with %s using the committed anchor",
    (from, to, expected) => {
      const pending = requestCalendarTransition(
        initial(from),
        { revision: 7, direction: 1, source: "gesture" },
        zone,
        monday,
      )
      const replaced = replaceCalendarTransition(
        pending,
        { mode: to },
        zone,
        monday,
      )
      expect(replaced.mode).toBe(to)
      expect(dayKey(replaced.anchor, zone)).toBe(expected)
      expect(replaced.pending).toBeNull()
      expect(replaced.lastRequestRevision).toBe(8)
      expect(replaced.generation).toBe(1)
      expect(settleCalendarTransition(replaced, 7).accepted).toBe(false)
      expect(
        replaceCalendarTransition(replaced, { mode: to }, zone, monday),
      ).toBe(replaced)
    },
  )

  it("normalizes a direct replacement in the retained mode", () => {
    const replaced = replaceCalendarTransition(
      initial("day"),
      { date: new Date("2027-01-01T12:00:00.000Z") },
      zone,
      monday,
    )
    expect(dayKey(replaced.anchor, zone)).toBe("2027-01-01")
    expect(replaced.pagePosition).toBe(0)
  })
})
