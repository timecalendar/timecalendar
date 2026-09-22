import {
  eventInteractionGeometry,
  eventVisualGeometry,
} from "./timeline-geometry"

describe("timeline event geometry", () => {
  it.each([
    ["point", 720, 720, 60, { top: 718, height: 4 }],
    ["interval", 600, 602, 60, { top: 600, height: 2 }],
    ["interval", 600, 602, 120, { top: 1200, height: 4 }],
  ] as const)(
    "keeps %s visuals duration-faithful",
    (shape, startMinute, endMinute, pixelsPerHour, expected) => {
      expect(
        eventVisualGeometry({
          shape,
          startMinute,
          endMinute,
          pixelsPerHour,
        }),
      ).toEqual(expected)
    },
  )

  it.each([
    ["ios", { top: -2, height: 4 }, 1440, { top: 0, height: 44 }],
    ["android", { top: 718, height: 4 }, 1440, { top: 696, height: 48 }],
    ["android", { top: 1437, height: 4 }, 1440, { top: 1392, height: 48 }],
    ["ios", { top: 600, height: 60 }, 1440, { top: 600, height: 60 }],
  ] as const)(
    "clamps %s interaction geometry inside the day",
    (platform, visual, dayHeight, expected) => {
      expect(eventInteractionGeometry({ platform, visual, dayHeight })).toEqual(
        expected,
      )
    },
  )
})
