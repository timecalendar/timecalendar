import { dayKey } from "./day-key"
import { normalizeTimelineAnchor } from "./week-transition"

const zone = "Europe/Paris"
const monday = 1 as const

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
})
