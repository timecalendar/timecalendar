import { dayKey } from "./day-key"
import {
  cancelWeekTransition,
  createWeekTransitionState,
  replaceWeekTransitionAnchor,
  requestWeekTransition,
  settleWeekTransition,
} from "./week-transition"

const zone = "Europe/Paris"
const monday = 1 as const

function initial() {
  return createWeekTransitionState(
    new Date("2026-09-16T12:00:00.000Z"),
    zone,
    monday,
  )
}

describe("week transition state", () => {
  it("accepts the current request once", () => {
    const requested = requestWeekTransition(
      initial(),
      { revision: 1, direction: 1, source: "gesture" },
      zone,
      monday,
    )
    const settled = settleWeekTransition(requested, 1)

    expect(settled.accepted).toBe(true)
    expect(dayKey(settled.state.anchor, zone)).toBe("2026-09-21")
    expect(settled.state.generation).toBe(1)
    expect(settleWeekTransition(settled.state, 1)).toEqual({
      accepted: false,
      state: settled.state,
    })
  })

  it("supports exactly one previous destination", () => {
    const state = requestWeekTransition(
      initial(),
      { revision: 3, direction: -1, source: "previous" },
      zone,
      monday,
    )
    expect(dayKey(state.pending!.destination, zone)).toBe("2026-09-07")
    expect(settleWeekTransition(state, 3).accepted).toBe(true)
  })

  it("rejects stale requests and completions", () => {
    const first = requestWeekTransition(
      initial(),
      { revision: 2, direction: 1, source: "next" },
      zone,
      monday,
    )
    const second = requestWeekTransition(
      first,
      { revision: 3, direction: -1, source: "gesture" },
      zone,
      monday,
    )

    expect(second.pending?.revision).toBe(3)
    expect(requestWeekTransition(second, first.pending!, zone, monday)).toBe(
      second,
    )
    expect(settleWeekTransition(second, 2).accepted).toBe(false)
    expect(settleWeekTransition(second, 3).accepted).toBe(true)
  })

  it("cancels only the current revision", () => {
    const state = requestWeekTransition(
      initial(),
      { revision: 1, direction: 1, source: "gesture" },
      zone,
      monday,
    )
    expect(cancelWeekTransition(state, 4)).toBe(state)
    const cancelled = cancelWeekTransition(state, 1)
    expect(cancelled.pending).toBeNull()
    expect(settleWeekTransition(cancelled, 1).accepted).toBe(false)
  })

  it("normalizes direct dates and invalidates pending replacement work", () => {
    const pending = requestWeekTransition(
      initial(),
      { revision: 7, direction: 1, source: "gesture" },
      zone,
      monday,
    )
    const replaced = replaceWeekTransitionAnchor(
      pending,
      new Date("2027-01-01T12:00:00.000Z"),
      zone,
      monday,
    )

    expect(dayKey(replaced.anchor, zone)).toBe("2026-12-28")
    expect(replaced.pending).toBeNull()
    expect(replaced.lastRequestRevision).toBe(8)
    expect(settleWeekTransition(replaced, 7).accepted).toBe(false)
    expect(
      replaceWeekTransitionAnchor(
        replaced,
        new Date("2026-12-30T12:00:00.000Z"),
        zone,
        monday,
      ),
    ).toBe(replaced)
  })
})
