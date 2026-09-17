import {
  normalizeTimedViewportGeometry,
  replaceCalendarViewportGeometry,
  type TimedViewportGeometry,
} from "./owned-calendar-resize"

const presentation = {
  dateIdentity: "2026-09-17",
  mode: "week" as const,
  rendererGeneration: 7,
  pixelsPerHour: 90,
  rawOffset: 12 * 90 - 240,
}

const geometry = (
  width: number,
  height: number,
  topInset = 0,
  bottomInset = 0,
): TimedViewportGeometry => ({ width, height, topInset, bottomInset })

describe("owned Calendar resize model", () => {
  it("normalizes finite complete measurements and returns the same snapshot for equality", () => {
    expect(
      normalizeTimedViewportGeometry(
        geometry(Number.NaN, -1, Infinity, Number.NaN),
      ),
    ).toEqual(geometry(0, 0))

    const first = replaceCalendarViewportGeometry(
      null,
      geometry(390, 480, 20, 40),
      presentation,
    )
    expect(
      replaceCalendarViewportGeometry(first, geometry(390, 480, 20, 40), {
        ...presentation,
        rawOffset: 999,
      }),
    ).toBe(first)
  })

  it.each([
    ["width-only compact", geometry(320, 480, 20, 40)],
    ["width-only medium", geometry(700, 480, 20, 40)],
    ["width-only expanded", geometry(1100, 480, 20, 40)],
    ["height-only", geometry(390, 720, 20, 40)],
    ["combined", geometry(1024, 620, 0, 80)],
  ])("preserves the clock anchor for %s replacement", (_name, next) => {
    const first = replaceCalendarViewportGeometry(
      null,
      geometry(390, 480, 20, 40),
      presentation,
    )
    const replaced = replaceCalendarViewportGeometry(first, next, {
      ...presentation,
      rawOffset: first.rawOffset,
    })

    expect(replaced.geometryRevision).toBe(2)
    expect(replaced.dateIdentity).toBe(first.dateIdentity)
    expect(replaced.mode).toBe(first.mode)
    expect(replaced.rendererGeneration).toBe(first.rendererGeneration)
    expect(replaced.pixelsPerHour).toBe(first.pixelsPerHour)
    expect(replaced.clockAnchor).toBeCloseTo(first.clockAnchor)
  })

  it("recovers non-finite presentation input and clamps both day boundaries", () => {
    const top = replaceCalendarViewportGeometry(null, geometry(320, 900), {
      ...presentation,
      pixelsPerHour: Number.NaN,
      rawOffset: Number.NaN,
    })
    expect(top.pixelsPerHour).toBe(60)
    expect(top.rawOffset).toBe(0)
    expect(top.clockAnchor).toBe(7.5)

    const bottom = replaceCalendarViewportGeometry(
      top,
      geometry(320, 300, 10, 50),
      { ...presentation, pixelsPerHour: 120, rawOffset: 10_000 },
    )
    expect(bottom.rawOffset).toBe(2630)
    expect(bottom.geometry.bottomInset).toBe(50)
  })

  it("keeps the closing boundary reachable when height and bottom inset change", () => {
    const initial = replaceCalendarViewportGeometry(
      null,
      geometry(768, 700, 24, 80),
      { ...presentation, rawOffset: 1_540 },
    )
    const resized = replaceCalendarViewportGeometry(
      initial,
      geometry(768, 420, 24, 120),
      { ...presentation, rawOffset: initial.rawOffset },
    )
    expect(resized.rawOffset).toBeLessThanOrEqual(2_160 - 420 + 120)
    expect(resized.rawOffset).toBeGreaterThanOrEqual(-24)
  })
})
