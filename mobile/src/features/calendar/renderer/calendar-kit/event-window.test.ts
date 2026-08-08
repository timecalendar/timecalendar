import { fromZonedTime } from "date-fns-tz"

import { quarterStartMs, quarterWindow } from "./event-window"

// The quarter arithmetic runs on the DISPLAY zone's calendar; fixtures are
// zone wall-clock times anchored through `fromZonedTime`, so the suite is
// machine-TZ-independent and pins a non-device zone (Nouméa, UTC+11).
const ZONE = "Pacific/Noumea"
const zoneInstant = (wallClock: string) => fromZonedTime(wallClock, ZONE)

describe("quarterStartMs", () => {
  it("snaps any day to the zone-midnight first day of its calendar quarter", () => {
    expect(quarterStartMs(zoneInstant("2026-02-14T09:30:00"), ZONE)).toBe(
      zoneInstant("2026-01-01T00:00:00").getTime(),
    )
    expect(quarterStartMs(zoneInstant("2026-06-30T23:59:00"), ZONE)).toBe(
      zoneInstant("2026-04-01T00:00:00").getTime(),
    )
    expect(quarterStartMs(zoneInstant("2026-09-01T00:00:00"), ZONE)).toBe(
      zoneInstant("2026-07-01T00:00:00").getTime(),
    )
    expect(quarterStartMs(zoneInstant("2026-12-31T12:00:00"), ZONE)).toBe(
      zoneInstant("2026-10-01T00:00:00").getTime(),
    )
  })

  it("is stable across every day in a quarter", () => {
    const aug1 = quarterStartMs(zoneInstant("2026-08-01T00:00:00"), ZONE)
    const sep30 = quarterStartMs(zoneInstant("2026-09-30T00:00:00"), ZONE)
    const jul15 = quarterStartMs(zoneInstant("2026-07-15T00:00:00"), ZONE)
    expect(aug1).toBe(sep30)
    expect(aug1).toBe(jul15)
  })

  it("changes across a quarter boundary", () => {
    expect(quarterStartMs(zoneInstant("2026-10-01T00:00:00"), ZONE)).not.toBe(
      quarterStartMs(zoneInstant("2026-09-30T00:00:00"), ZONE),
    )
  })

  it("keys the quarter on the ZONE's day, not the device's", () => {
    // 23:30Z on Sep 30 is already Oct 1 (10:30) in Nouméa — Q4, not Q3.
    const utcEdge = new Date("2026-09-30T23:30:00.000Z")
    expect(quarterStartMs(utcEdge, ZONE)).toBe(
      zoneInstant("2026-10-01T00:00:00").getTime(),
    )
  })
})

describe("quarterWindow", () => {
  it("brackets the quarter with a two-month buffer on each side", () => {
    const { from, to } = quarterWindow(
      zoneInstant("2026-07-01T00:00:00").getTime(),
      ZONE,
    )
    expect(from.getTime()).toBe(zoneInstant("2026-05-01T00:00:00").getTime())
    expect(to.getTime()).toBe(zoneInstant("2026-12-01T00:00:00").getTime())
  })

  it("rolls the buffer across year boundaries", () => {
    const q1 = quarterWindow(zoneInstant("2026-01-01T00:00:00").getTime(), ZONE)
    expect(q1.from.getTime()).toBe(zoneInstant("2025-11-01T00:00:00").getTime())
    expect(q1.to.getTime()).toBe(zoneInstant("2026-06-01T00:00:00").getTime())
    const q4 = quarterWindow(zoneInstant("2026-10-01T00:00:00").getTime(), ZONE)
    expect(q4.from.getTime()).toBe(zoneInstant("2026-08-01T00:00:00").getTime())
    expect(q4.to.getTime()).toBe(zoneInstant("2027-03-01T00:00:00").getTime())
  })

  it("spans seven months", () => {
    const { from, to } = quarterWindow(
      zoneInstant("2026-07-01T00:00:00").getTime(),
      ZONE,
    )
    expect(
      (to.getFullYear() - from.getFullYear()) * 12 +
        (to.getMonth() - from.getMonth()),
    ).toBe(7)
  })
})
