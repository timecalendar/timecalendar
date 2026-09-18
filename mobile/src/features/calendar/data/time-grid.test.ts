import * as timeGrid from "./time-grid"
import {
  clampRawOffset,
  clampVerticalOffset,
  clockHourAtFocalPoint,
  DEFAULT_PIXELS_PER_HOUR,
  eventHeight,
  focalPreservingRawOffset,
  FULL_DAY_END_MINUTE,
  FULL_DAY_START_MINUTE,
  fullDayContentHeight,
  fullDayMajorMinutes,
  fullDayMinorMinutes,
  GRID_END_MINUTE,
  GRID_START_MINUTE,
  gridContentHeight,
  hourLabels,
  isValidPixelsPerHour,
  MAX_PIXELS_PER_HOUR,
  maxVerticalOffset,
  MIN_PIXELS_PER_HOUR,
  minuteToPixel,
  NOW_VIEWPORT_FRACTION,
  nowAnchoredRawOffset,
  nowIndicatorPosition,
  rawOffsetBounds,
  resolvePixelsPerHour,
  stepPixelsPerHour,
  usableViewportCenterY,
  ZOOM_PIXELS_PER_HOUR_STEP,
} from "./time-grid"

describe("time-grid constants", () => {
  it("matches the Flutter-parity window (7:00–21:00)", () => {
    expect(GRID_START_MINUTE).toBe(7 * 60)
    expect(GRID_END_MINUTE).toBe(21 * 60)
    expect(DEFAULT_PIXELS_PER_HOUR).toBe(60)
    expect(MIN_PIXELS_PER_HOUR).toBe(40)
    expect(MAX_PIXELS_PER_HOUR).toBe(120)
    expect(ZOOM_PIXELS_PER_HOUR_STEP).toBe(10)
  })

  it("names the complete 00:00–24:00 renderer window", () => {
    expect(FULL_DAY_START_MINUTE).toBe(0)
    expect(FULL_DAY_END_MINUTE).toBe(24 * 60)
    expect(NOW_VIEWPORT_FRACTION).toBe(0.3)
  })
})

describe("calendar zoom geometry", () => {
  it("totally validates and clamps scale values", () => {
    for (const value of [
      undefined,
      null,
      "60",
      Number.NaN,
      Infinity,
      -Infinity,
    ]) {
      expect(resolvePixelsPerHour(value)).toBe(DEFAULT_PIXELS_PER_HOUR)
      expect(isValidPixelsPerHour(value)).toBe(false)
    }

    expect(resolvePixelsPerHour(39)).toBe(MIN_PIXELS_PER_HOUR)
    expect(resolvePixelsPerHour(80)).toBe(80)
    expect(resolvePixelsPerHour(121)).toBe(MAX_PIXELS_PER_HOUR)
    expect(isValidPixelsPerHour(39)).toBe(false)
    expect(isValidPixelsPerHour(40)).toBe(true)
    expect(isValidPixelsPerHour(80.5)).toBe(true)
    expect(isValidPixelsPerHour(120)).toBe(true)
    expect(isValidPixelsPerHour(121)).toBe(false)
  })

  it("derives complete-day height and repeated command limits", () => {
    expect(fullDayContentHeight(40)).toBe(960)
    expect(fullDayContentHeight(60)).toBe(1440)
    expect(fullDayContentHeight(120)).toBe(2880)
    expect(fullDayContentHeight(Number.NaN)).toBe(1440)

    let scale = DEFAULT_PIXELS_PER_HOUR
    for (let index = 0; index < 20; index++) {
      scale = stepPixelsPerHour(scale, 1)
    }
    expect(scale).toBe(MAX_PIXELS_PER_HOUR)
    for (let index = 0; index < 20; index++) {
      scale = stepPixelsPerHour(scale, -1)
    }
    expect(scale).toBe(MIN_PIXELS_PER_HOUR)
    expect(stepPixelsPerHour(Number.NaN, 1)).toBe(70)
  })

  it("models native automatic-inset raw offset bounds", () => {
    const geometry = {
      contentHeight: 1440,
      viewportHeight: 500,
      topInset: 20,
      bottomInset: 30,
    }
    expect(rawOffsetBounds(geometry)).toEqual({ min: -20, max: 970 })
    expect(clampRawOffset(-100, geometry)).toBe(-20)
    expect(clampRawOffset(400, geometry)).toBe(400)
    expect(clampRawOffset(2000, geometry)).toBe(970)
    expect(clampRawOffset(Number.NaN, geometry)).toBe(-20)
    expect(
      rawOffsetBounds({
        contentHeight: Number.NaN,
        viewportHeight: -1,
        topInset: Infinity,
        bottomInset: -1,
      }),
    ).toEqual({ min: -0, max: 0 })
    expect(
      rawOffsetBounds({
        contentHeight: 100,
        viewportHeight: 500,
        topInset: 20,
        bottomInset: 0,
      }),
    ).toEqual({ min: -20, max: -20 })
  })

  it("finds the inset-aware usable viewport center", () => {
    expect(usableViewportCenterY(500, 20, 40)).toBe(240)
    expect(usableViewportCenterY(Number.NaN, Infinity, -1)).toBe(0)
    expect(usableViewportCenterY(100, 120, 50)).toBe(100)
  })

  describe("fresh-open now anchor", () => {
    const cases = [
      {
        label: "midnight clamps to an automatic top inset",
        minuteOfDay: 0,
        pixelsPerHour: 60,
        geometry: { viewportHeight: 500, topInset: 20, bottomInset: 30 },
        expected: -20,
      },
      {
        label: "mid-morning sits at 30% with zero insets",
        minuteOfDay: 9 * 60,
        pixelsPerHour: 60,
        geometry: { viewportHeight: 500, topInset: 0, bottomInset: 0 },
        expected: 390,
      },
      {
        label: "mid-afternoon uses the bounded minimum scale and insets",
        minuteOfDay: 15 * 60,
        pixelsPerHour: 40,
        geometry: { viewportHeight: 400, topInset: 20, bottomInset: 40 },
        expected: 478,
      },
      {
        label: "23:59 clamps to the full-day bottom at maximum scale",
        minuteOfDay: 23 * 60 + 59,
        pixelsPerHour: 120,
        geometry: { viewportHeight: 500, topInset: 10, bottomInset: 50 },
        expected: 2430,
      },
      {
        label: "a viewport taller than the day stays at its top bound",
        minuteOfDay: 12 * 60,
        pixelsPerHour: 40,
        geometry: { viewportHeight: 1_200, topInset: 24, bottomInset: 36 },
        expected: -24,
      },
    ] as const

    it.each(cases)(
      "$label",
      ({ minuteOfDay, pixelsPerHour, geometry, expected }) => {
        expect(
          nowAnchoredRawOffset({ minuteOfDay, pixelsPerHour, geometry }),
        ).toBe(expected)
      },
    )

    it("recovers non-finite inputs and clamps an explicit viewport fraction", () => {
      const geometry = {
        viewportHeight: Number.NaN,
        topInset: Infinity,
        bottomInset: -1,
      }
      expect(
        nowAnchoredRawOffset({
          minuteOfDay: Number.NaN,
          pixelsPerHour: Number.NaN,
          geometry,
          viewportFraction: Number.NaN,
        }),
      ).toBe(0)
      expect(
        nowAnchoredRawOffset({
          minuteOfDay: 12 * 60,
          pixelsPerHour: 60,
          geometry: { viewportHeight: 500, topInset: 20, bottomInset: 30 },
          viewportFraction: 2,
        }),
      ).toBe(250)
    })

    it("always returns an offset inside the full-day raw bounds", () => {
      for (const pixelsPerHour of [40, 60, 120]) {
        for (const minuteOfDay of [0, 1, 9 * 60, 15 * 60, 23 * 60 + 59, 1440]) {
          for (const geometry of [
            { viewportHeight: 0, topInset: 0, bottomInset: 0 },
            { viewportHeight: 500, topInset: 20, bottomInset: 60 },
            { viewportHeight: 3_000, topInset: 40, bottomInset: 80 },
          ]) {
            const offset = nowAnchoredRawOffset({
              minuteOfDay,
              pixelsPerHour,
              geometry,
            })
            const bounds = rawOffsetBounds({
              ...geometry,
              contentHeight: fullDayContentHeight(pixelsPerHour),
            })
            expect(offset).toBeGreaterThanOrEqual(bounds.min)
            expect(offset).toBeLessThanOrEqual(bounds.max)
          }
        }
      }
    })
  })

  it("recovers finite focal inputs and clamps at day boundaries", () => {
    const geometry = {
      contentHeight: fullDayContentHeight(120),
      viewportHeight: 500,
      topInset: 20,
      bottomInset: 30,
    }
    expect(clockHourAtFocalPoint(Number.NaN, Number.NaN, Number.NaN)).toBe(0)
    expect(
      focalPreservingRawOffset({
        rawOffset: -100,
        focalY: Number.NaN,
        oldPixelsPerHour: 60,
        newPixelsPerHour: 40,
        geometry,
      }),
    ).toBe(-20)
    expect(
      focalPreservingRawOffset({
        rawOffset: 2500,
        focalY: 250,
        oldPixelsPerHour: 60,
        newPixelsPerHour: 120,
        geometry,
      }),
    ).toBe(2410)
  })

  it("preserves the focal clock hour whenever the solution is unclamped", () => {
    const oldScales = [40, 60, 90, 120]
    const newScales = [40, 55, 80, 120]
    const focals = [0, 120, 300, 499]

    for (const oldScale of oldScales) {
      for (const newScale of newScales) {
        for (const focalY of focals) {
          const rawOffset = 12 * oldScale - focalY
          const geometry = {
            contentHeight: fullDayContentHeight(newScale),
            viewportHeight: 500,
            topInset: 20,
            bottomInset: 30,
          }
          const nextOffset = focalPreservingRawOffset({
            rawOffset,
            focalY,
            oldPixelsPerHour: oldScale,
            newPixelsPerHour: newScale,
            geometry,
          })
          expect(clockHourAtFocalPoint(rawOffset, focalY, oldScale)).toBe(12)
          expect(clockHourAtFocalPoint(nextOffset, focalY, newScale)).toBe(12)
          const bounds = rawOffsetBounds(geometry)
          expect(nextOffset).toBeGreaterThanOrEqual(bounds.min)
          expect(nextOffset).toBeLessThanOrEqual(bounds.max)
        }
      }
    }
  })

  it("tracks a moving focal point while preserving the captured clock hour", () => {
    const nextOffset = focalPreservingRawOffset({
      rawOffset: 480,
      focalY: 240,
      nextFocalY: 300,
      oldPixelsPerHour: 60,
      newPixelsPerHour: 90,
      geometry: {
        contentHeight: fullDayContentHeight(90),
        viewportHeight: 500,
        topInset: 20,
        bottomInset: 80,
      },
    })

    expect(clockHourAtFocalPoint(480, 240, 60)).toBe(12)
    expect(clockHourAtFocalPoint(nextOffset, 300, 90)).toBe(12)
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

// The renderer calls this math from `useAnimatedStyle` and gesture callbacks, so
// every helper must be workletized — a missing directive is a UI-thread crash
// that no mocked Jest render and no type can reach. Babel stamps `__workletHash`
// on the transformed function, which is the only off-device evidence there is.
describe("UI-thread (worklet) contract", () => {
  const JS_THREAD_ONLY = new Set(["nowIndicatorPosition"])

  const exportedFunctions: [string, unknown][] = Object.entries(
    timeGrid as Record<string, unknown>,
  ).filter(([, value]) => typeof value === "function")

  function workletHash(value: unknown) {
    return (value as { __workletHash?: number }).__workletHash
  }

  it("covers every function export", () => {
    expect(exportedFunctions.length).toBeGreaterThan(0)
  })

  it.each(exportedFunctions.filter(([name]) => !JS_THREAD_ONLY.has(name)))(
    "workletizes %s",
    (_name, fn) => {
      expect(typeof workletHash(fn)).toBe("number")
    },
  )

  it.each(exportedFunctions.filter(([name]) => JS_THREAD_ONLY.has(name)))(
    "keeps %s off the UI thread",
    (_name, fn) => {
      expect(workletHash(fn)).toBeUndefined()
    },
  )
})
