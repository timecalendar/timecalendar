import { dayKey, minuteOfDayInZone } from "@/features/calendar/data"

import { accessibilityProbeFixture } from "./accessibility-probe"

const byUid = (zone: string) =>
  new Map(
    accessibilityProbeFixture(zone).map((event) => [event.identity.uid, event]),
  )

describe.each([
  "UTC",
  "Pacific/Kiritimati",
  "Pacific/Pago_Pago",
  "America/St_Johns",
  "Asia/Kathmandu",
])("the accessibility probe fixture in %s", (zone) => {
  it("keeps every fixture but the next-date one on 15 June", () => {
    for (const event of accessibilityProbeFixture(zone)) {
      if (event.identity.uid === "probe-next-date") continue
      expect(dayKey(event.startsAt, zone)).toBe("2026-06-15")
    }
    expect(dayKey(byUid(zone).get("probe-next-date")!.startsAt, zone)).toBe(
      "2026-06-16",
    )
  })

  it.each([
    ["probe-early", 60],
    ["probe-tied-a", 600],
    ["probe-late", 1380],
  ])("starts %s at minute %i of the zone's day", (uid, minute) => {
    expect(minuteOfDayInZone(byUid(zone).get(uid)!.startsAt, zone)).toBe(minute)
  })
})

it("matches the UTC instants in UTC", () => {
  expect(
    accessibilityProbeFixture("UTC").map((event) => [
      event.identity.uid,
      event.startsAt.toISOString(),
      event.endsAt.toISOString(),
    ]),
  ).toEqual([
    ["probe-early", "2026-06-15T01:00:00.000Z", "2026-06-15T02:00:00.000Z"],
    ["probe-tied-b", "2026-06-15T10:00:00.000Z", "2026-06-15T11:00:00.000Z"],
    ["probe-tied-a", "2026-06-15T10:00:00.000Z", "2026-06-15T11:00:00.000Z"],
    [
      "probe-tied-personal",
      "2026-06-15T10:00:00.000Z",
      "2026-06-15T11:00:00.000Z",
    ],
    [
      "probe-tied-short",
      "2026-06-15T10:00:00.000Z",
      "2026-06-15T10:30:00.000Z",
    ],
    ["probe-overlap-a", "2026-06-15T11:00:00.000Z", "2026-06-15T12:00:00.000Z"],
    ["probe-overlap-b", "2026-06-15T11:15:00.000Z", "2026-06-15T12:15:00.000Z"],
    ["probe-tiny-a", "2026-06-15T12:00:00.000Z", "2026-06-15T12:02:00.000Z"],
    ["probe-tiny-b", "2026-06-15T12:03:00.000Z", "2026-06-15T12:05:00.000Z"],
    ["probe-late", "2026-06-15T23:00:00.000Z", "2026-06-15T23:45:00.000Z"],
    ["probe-next-date", "2026-06-16T01:00:00.000Z", "2026-06-16T02:00:00.000Z"],
  ])
})
