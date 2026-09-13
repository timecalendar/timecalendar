import {
  clampVerticalOffset,
  DEFAULT_PIXELS_PER_HOUR,
  eventHeight,
  FULL_DAY_END_MINUTE,
  FULL_DAY_START_MINUTE,
  fullDayMajorMinutes,
  fullDayMinorMinutes,
  GRID_END_MINUTE,
  GRID_START_MINUTE,
  gridContentHeight,
  hourLabels,
  maxVerticalOffset,
  minuteToPixel,
  nowIndicatorPosition,
} from "./time-grid"

describe("time-grid constants", () => {
  it("matches the Flutter-parity window (7:00–21:00)", () => {
    expect(GRID_START_MINUTE).toBe(7 * 60)
    expect(GRID_END_MINUTE).toBe(21 * 60)
    expect(DEFAULT_PIXELS_PER_HOUR).toBe(60)
  })

  it("names the complete 00:00–24:00 renderer window", () => {
    expect(FULL_DAY_START_MINUTE).toBe(0)
    expect(FULL_DAY_END_MINUTE).toBe(24 * 60)
  })
})

describe("full-day geometry", () => {
  it("uses one minute mapping for closing, major, and minor boundaries", () => {
    expect(fullDayMajorMinutes()).toEqual(
      Array.from({ length: 25 }, (_, hour) => hour * 60),
    )
    expect(fullDayMinorMinutes()).toEqual(
      Array.from({ length: 24 }, (_, hour) => hour * 60 + 30),
    )
    expect(
      fullDayMajorMinutes().map((minute) =>
        minuteToPixel(minute, {
          startMinute: FULL_DAY_START_MINUTE,
        }),
      ),
    ).toEqual(Array.from({ length: 25 }, (_, hour) => hour * 60))
    expect(
      fullDayMinorMinutes().map((minute) =>
        minuteToPixel(minute, {
          startMinute: FULL_DAY_START_MINUTE,
        }),
      ),
    ).toEqual(Array.from({ length: 24 }, (_, hour) => hour * 60 + 30))
  })

  it("scales the entire day and keeps positions monotonic", () => {
    expect(gridContentHeight(FULL_DAY_START_MINUTE, FULL_DAY_END_MINUTE)).toBe(
      1440,
    )
    expect(
      gridContentHeight(FULL_DAY_START_MINUTE, FULL_DAY_END_MINUTE, 90),
    ).toBe(2160)
    const positions = fullDayMajorMinutes().map((minute) =>
      minuteToPixel(minute, {
        pixelsPerHour: 90,
        startMinute: FULL_DAY_START_MINUTE,
      }),
    )
    expect(
      positions.every(
        (position, index) => index === 0 || position > positions[index - 1]!,
      ),
    ).toBe(true)
    expect(positions.at(-1)).toBe(gridContentHeight(0, 1440, 90))
  })

  it("clamps top, interior, bottom, and non-scrollable content", () => {
    expect(maxVerticalOffset(1440, 500)).toBe(940)
    expect(maxVerticalOffset(400, 500)).toBe(0)
    expect(clampVerticalOffset(-1, 1440, 500)).toBe(0)
    expect(clampVerticalOffset(420, 1440, 500)).toBe(420)
    expect(clampVerticalOffset(2000, 1440, 500)).toBe(940)
    expect(clampVerticalOffset(200, 400, 500)).toBe(0)
  })
})

describe("minuteToPixel", () => {
  it("places the grid start at pixel 0", () => {
    expect(minuteToPixel(GRID_START_MINUTE)).toBe(0)
  })

  it("uses (minutes - startMinute) / 60 * pixelsPerHour", () => {
    // 9:00 is two hours past the 7:00 start → 120px at 60px/hour.
    expect(minuteToPixel(9 * 60)).toBe(120)
  })

  it("honours a custom pixelsPerHour and startMinute", () => {
    expect(
      minuteToPixel(8 * 60, { pixelsPerHour: 100, startMinute: 7 * 60 }),
    ).toBe(100)
  })
})

describe("eventHeight", () => {
  it("scales the duration by pixels-per-hour", () => {
    expect(eventHeight(90)).toBe(90)
    expect(eventHeight(30, 120)).toBe(60)
  })
})

describe("hourLabels", () => {
  it("lists each hour boundary for 7:00–21:00 inclusive", () => {
    expect(hourLabels()).toEqual([
      7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    ])
  })

  it("honours a custom window", () => {
    expect(hourLabels(8 * 60, 10 * 60)).toEqual([8, 9, 10])
  })
})

describe("nowIndicatorPosition", () => {
  // UTC instants + a pinned non-device zone (Nouméa, UTC+11): the minute-of-day
  // is the DISPLAY zone's wall clock, machine-TZ-independent (spec proof).
  it("is visible and positioned when the zone wall clock is within the window", () => {
    // 22:00Z = 09:00 in Nouméa.
    const now = new Date("2026-06-14T22:00:00.000Z")
    const result = nowIndicatorPosition(now, "Pacific/Noumea")
    expect(result.visible).toBe(true)
    expect(result.pixel).toBe(120)
    expect(Number(result.fraction.toFixed(5))).toBe(Number((2 / 14).toFixed(5)))
  })

  it("is not visible before the window", () => {
    // 19:00Z = 06:00 in Nouméa.
    const now = new Date("2026-06-14T19:00:00.000Z")
    expect(nowIndicatorPosition(now, "Pacific/Noumea").visible).toBe(false)
  })

  it("is not visible after the window", () => {
    // 11:00Z = 22:00 in Nouméa.
    const now = new Date("2026-06-14T11:00:00.000Z")
    expect(nowIndicatorPosition(now, "Pacific/Noumea").visible).toBe(false)
  })

  it("positions the SAME instant differently per display zone", () => {
    // 08:00Z: 09:00 in London (UTC+1 in June) vs 19:00 in Nouméa.
    const now = new Date("2026-06-15T08:00:00.000Z")
    expect(nowIndicatorPosition(now, "Europe/London").pixel).toBe(120)
    expect(nowIndicatorPosition(now, "Pacific/Noumea").pixel).toBe(720)
  })
})
