import { fromZonedTime, toZonedTime } from "date-fns-tz"

import { dateDialogValue, mergePickedDay } from "./wall-clock-day"

const DEVICE_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

describe.each([DEVICE_ZONE, "Pacific/Noumea", "America/Los_Angeles"])(
  "wall-clock day helpers in %s",
  (zone) => {
    it("feeds the date dialog the zone's calendar day as UTC midnight", () => {
      // 2026-03-10T22:30Z is 2026-03-11 in Nouméa and 2026-03-10 in Los Angeles.
      const instant = new Date("2026-03-10T22:30:00.000Z")
      const wallClock = toZonedTime(instant, zone)

      const dialogValue = dateDialogValue(wallClock)

      expect(dialogValue.getUTCHours()).toBe(0)
      expect(dialogValue.getUTCMinutes()).toBe(0)
      expect(dialogValue.toISOString().slice(0, 10)).toBe(
        new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(instant),
      )
    })

    it("keeps the wall-clock time of day when merging the picked day", () => {
      const wallClock = toZonedTime(new Date("2026-03-10T22:30:00.000Z"), zone)

      const merged = mergePickedDay(wallClock, new Date(Date.UTC(2026, 6, 4)))

      expect(merged.getFullYear()).toBe(2026)
      expect(merged.getMonth()).toBe(6)
      expect(merged.getDate()).toBe(4)
      expect(merged.getHours()).toBe(wallClock.getHours())
      expect(merged.getMinutes()).toBe(wallClock.getMinutes())
      expect(merged.getSeconds()).toBe(0)
    })

    it("round-trips an unchanged day back to the stored instant", () => {
      const instant = new Date("2026-03-10T22:30:00.000Z")
      const wallClock = toZonedTime(instant, zone)

      const merged = mergePickedDay(wallClock, dateDialogValue(wallClock))

      expect(fromZonedTime(merged, zone)).toEqual(instant)
    })
  },
)

it("crosses a year boundary from the UTC day, not the local one", () => {
  const wallClock = new Date(2026, 11, 31, 23, 45)

  expect(dateDialogValue(wallClock).toISOString()).toBe(
    "2026-12-31T00:00:00.000Z",
  )
  const merged = mergePickedDay(wallClock, new Date(Date.UTC(2027, 0, 1)))
  expect([merged.getFullYear(), merged.getMonth(), merged.getDate()]).toEqual([
    2027, 0, 1,
  ])
  expect([merged.getHours(), merged.getMinutes()]).toEqual([23, 45])
})
