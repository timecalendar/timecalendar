// Pure time-grid math — salvaged and OWNED regardless of the renderer (ADR 019;
// D4). The Flutter-parity grid constants + the minute→pixel / event-height /
// hour-label / now-indicator math the agenda follow-up, home today-grid, and
// later owned renderer slices consume. Pure: no React or renderer imports.

// UI-thread contract: every function export here is a worklet, so the owned
// renderer's `useAnimatedStyle`/gesture callbacks can call it directly. The one
// exception is `nowIndicatorPosition` (Intl, through minuteOfDayInZone), which
// the "UI-thread (worklet) contract" suite pins as JS-thread-only. Adding a
// helper without the directive fails that suite, not the simulator.

import { minuteOfDayInZone } from "./day-key"

// Flutter-parity grid constants (read from the Flutter calendar module), as
// named exports — not magic numbers.
/** Grid window start, minutes from midnight (7:00). */
export const GRID_START_MINUTE = 7 * 60
/** Grid window end, minutes from midnight (21:00). */
export const GRID_END_MINUTE = 21 * 60
/** Explicit bounds for the owned renderer's complete wall-clock day. */
export const FULL_DAY_START_MINUTE = 0
export const FULL_DAY_END_MINUTE = 24 * 60
/** Default vertical scale. */
export const DEFAULT_PIXELS_PER_HOUR = 60
/** Initial inclusive zoom bounds and accessible command increment. */
export const MIN_PIXELS_PER_HOUR = 40
export const MAX_PIXELS_PER_HOUR = 120
export const ZOOM_PIXELS_PER_HOUR_STEP = 10
/**
 * Where a freshly opened timeline puts the current minute, as a fraction of the
 * usable timed viewport measured from its top — high enough to keep the
 * preceding hours in view, low enough to show the rest of the day.
 */
export const NOW_VIEWPORT_FRACTION = 0.3
/** Width of the hours (time labels) column. */
export const HOURS_COLUMN_WIDTH = 50
/** Below this tile width, the renderer hides the tile text. */
export const MIN_TILE_WIDTH = 20

interface GridOptions {
  pixelsPerHour?: number
  startMinute?: number
}

/** Pixel offset of a minute-from-midnight, relative to the grid start. */
export function minuteToPixel(
  minute: number,
  {
    pixelsPerHour = DEFAULT_PIXELS_PER_HOUR,
    startMinute = GRID_START_MINUTE,
  }: GridOptions = {},
): number {
  "worklet"
  return ((minute - startMinute) / 60) * pixelsPerHour
}

/** Pixel height of an event from its duration in minutes. */
export function eventHeight(
  durationMinutes: number,
  pixelsPerHour: number = DEFAULT_PIXELS_PER_HOUR,
): number {
  "worklet"
  return (durationMinutes / 60) * pixelsPerHour
}

/**
 * The hour-boundary labels for a `[startMinute, endMinute]` window, inclusive on
 * both ends. For 7:00–21:00 this is [7, 8, …, 21] (hours since midnight).
 */
export function hourLabels(
  startMinute: number = GRID_START_MINUTE,
  endMinute: number = GRID_END_MINUTE,
): number[] {
  "worklet"
  const startHour = Math.floor(startMinute / 60)
  const endHour = Math.ceil(endMinute / 60)
  const labels: number[] = []
  for (let hour = startHour; hour <= endHour; hour++) {
    labels.push(hour)
  }
  return labels
}

/** Major hour boundaries, including the closing 24:00 geometry boundary. */
export function fullDayMajorMinutes(): number[] {
  "worklet"
  return Array.from({ length: 25 }, (_, hour) => hour * 60)
}

/** Minor half-hour boundaries within the complete day. */
export function fullDayMinorMinutes(): number[] {
  "worklet"
  return Array.from({ length: 24 }, (_, hour) => hour * 60 + 30)
}

export function gridContentHeight(
  startMinute: number,
  endMinute: number,
  pixelsPerHour: number = DEFAULT_PIXELS_PER_HOUR,
): number {
  "worklet"
  return minuteToPixel(endMinute, { pixelsPerHour, startMinute })
}

/** A persisted or gesture-produced scale always resolves into the T06 domain. */
export function resolvePixelsPerHour(value: unknown): number {
  "worklet"
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_PIXELS_PER_HOUR
  }
  return Math.min(Math.max(value, MIN_PIXELS_PER_HOUR), MAX_PIXELS_PER_HOUR)
}

export function isValidPixelsPerHour(value: unknown): value is number {
  "worklet"
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_PIXELS_PER_HOUR &&
    value <= MAX_PIXELS_PER_HOUR
  )
}

/** Complete 00:00–24:00 content height at a validated zoom scale. */
export function fullDayContentHeight(pixelsPerHour: unknown): number {
  "worklet"
  return 24 * resolvePixelsPerHour(pixelsPerHour)
}

export interface NativeVerticalGeometry {
  contentHeight: number
  viewportHeight: number
  topInset: number
  bottomInset: number
}

export interface RawOffsetBounds {
  min: number
  max: number
}

function finiteNonNegative(value: number): number {
  "worklet"
  return Number.isFinite(value) ? Math.max(value, 0) : 0
}

/** Native ScrollView raw content-offset range with automatic insets included. */
export function rawOffsetBounds({
  contentHeight,
  viewportHeight,
  topInset,
  bottomInset,
}: NativeVerticalGeometry): RawOffsetBounds {
  "worklet"
  const safeContentHeight = finiteNonNegative(contentHeight)
  const safeViewportHeight = finiteNonNegative(viewportHeight)
  const safeTopInset = finiteNonNegative(topInset)
  const safeBottomInset = finiteNonNegative(bottomInset)
  const min = -safeTopInset
  return {
    min,
    max: Math.max(
      safeContentHeight - safeViewportHeight + safeBottomInset,
      min,
    ),
  }
}

export function clampRawOffset(
  rawOffset: number,
  geometry: NativeVerticalGeometry,
): number {
  "worklet"
  const { min, max } = rawOffsetBounds(geometry)
  const safeOffset = Number.isFinite(rawOffset) ? rawOffset : min
  return Math.min(Math.max(safeOffset, min), max)
}

/** Wall-clock hour coordinate currently beneath a viewport focal position. */
export function clockHourAtFocalPoint(
  rawOffset: number,
  focalY: number,
  pixelsPerHour: unknown,
): number {
  "worklet"
  const safeRawOffset = Number.isFinite(rawOffset) ? rawOffset : 0
  const safeFocalY = Number.isFinite(focalY) ? focalY : 0
  return (safeRawOffset + safeFocalY) / resolvePixelsPerHour(pixelsPerHour)
}

/** Solve and clamp the raw offset that keeps a clock hour under the focal point. */
export function focalPreservingRawOffset({
  rawOffset,
  focalY,
  nextFocalY = focalY,
  oldPixelsPerHour,
  newPixelsPerHour,
  geometry,
}: {
  rawOffset: number
  focalY: number
  nextFocalY?: number
  oldPixelsPerHour: unknown
  newPixelsPerHour: unknown
  geometry: NativeVerticalGeometry
}): number {
  "worklet"
  const safeFocalY = Number.isFinite(focalY) ? focalY : 0
  const safeNextFocalY = Number.isFinite(nextFocalY) ? nextFocalY : safeFocalY
  const clockHour = clockHourAtFocalPoint(
    rawOffset,
    safeFocalY,
    oldPixelsPerHour,
  )
  const nextScale = resolvePixelsPerHour(newPixelsPerHour)
  return clampRawOffset(clockHour * nextScale - safeNextFocalY, geometry)
}

/** A fraction down the viewport area not occupied by automatic native insets. */
export function usableViewportY(
  viewportHeight: number,
  topInset: number,
  bottomInset: number,
  fraction: number,
): number {
  "worklet"
  const safeViewportHeight = finiteNonNegative(viewportHeight)
  const safeTopInset = Math.min(finiteNonNegative(topInset), safeViewportHeight)
  const safeBottomInset = Math.min(
    finiteNonNegative(bottomInset),
    safeViewportHeight - safeTopInset,
  )
  const safeFraction = Number.isFinite(fraction)
    ? Math.min(Math.max(fraction, 0), 1)
    : 0
  return (
    safeTopInset +
    (safeViewportHeight - safeTopInset - safeBottomInset) * safeFraction
  )
}

/** Center of the viewport area not occupied by automatic native insets. */
export function usableViewportCenterY(
  viewportHeight: number,
  topInset: number,
  bottomInset: number,
): number {
  "worklet"
  return usableViewportY(viewportHeight, topInset, bottomInset, 0.5)
}

/** The usable-viewport half of {@link NativeVerticalGeometry}. */
export type TimedViewportBounds = Omit<NativeVerticalGeometry, "contentHeight">

/**
 * The raw content offset that places a display-zone minute-of-day at
 * `viewportFraction` of the usable timed viewport, clamped to the complete
 * 00:00–24:00 day at `pixelsPerHour`. Intl-free: the caller resolves the minute
 * in the display zone, so this stays callable from the UI thread.
 */
export function nowAnchoredRawOffset({
  minuteOfDay,
  pixelsPerHour,
  geometry,
  viewportFraction = NOW_VIEWPORT_FRACTION,
}: {
  minuteOfDay: number
  pixelsPerHour: unknown
  geometry: TimedViewportBounds
  viewportFraction?: number
}): number {
  "worklet"
  const scale = resolvePixelsPerHour(pixelsPerHour)
  const minute = Number.isFinite(minuteOfDay)
    ? Math.min(
        Math.max(minuteOfDay, FULL_DAY_START_MINUTE),
        FULL_DAY_END_MINUTE,
      )
    : FULL_DAY_START_MINUTE
  const anchorY = usableViewportY(
    geometry.viewportHeight,
    geometry.topInset,
    geometry.bottomInset,
    viewportFraction,
  )
  return clampRawOffset(
    minuteToPixel(minute, {
      pixelsPerHour: scale,
      startMinute: FULL_DAY_START_MINUTE,
    }) - anchorY,
    { ...geometry, contentHeight: fullDayContentHeight(scale) },
  )
}

export function stepPixelsPerHour(
  pixelsPerHour: unknown,
  direction: -1 | 1,
): number {
  "worklet"
  return resolvePixelsPerHour(
    resolvePixelsPerHour(pixelsPerHour) + direction * ZOOM_PIXELS_PER_HOUR_STEP,
  )
}

export function maxVerticalOffset(
  contentHeight: number,
  viewportHeight: number,
): number {
  "worklet"
  return Math.max(contentHeight - viewportHeight, 0)
}

export function clampVerticalOffset(
  offset: number,
  contentHeight: number,
  viewportHeight: number,
): number {
  "worklet"
  return Math.min(
    Math.max(offset, 0),
    maxVerticalOffset(contentHeight, viewportHeight),
  )
}

export interface NowIndicator {
  /** Whether `now` falls within the grid window. */
  visible: boolean
  /** Pixel offset from the grid start (only meaningful when visible). */
  pixel: number
  /** Fractional position over the window (0 = start, 1 = end). */
  fraction: number
}

/**
 * The now-indicator's position within the grid window, on the DISPLAY zone's
 * wall clock — so the red line agrees with the zone-projected event tiles.
 */
export function nowIndicatorPosition(
  now: Date,
  zone: string,
  {
    pixelsPerHour = DEFAULT_PIXELS_PER_HOUR,
    startMinute = GRID_START_MINUTE,
    endMinute = GRID_END_MINUTE,
  }: GridOptions & { endMinute?: number } = {},
): NowIndicator {
  const minute = minuteOfDayInZone(now, zone)
  const visible = minute >= startMinute && minute <= endMinute
  return {
    visible,
    pixel: minuteToPixel(minute, { pixelsPerHour, startMinute }),
    fraction: (minute - startMinute) / (endMinute - startMinute),
  }
}
