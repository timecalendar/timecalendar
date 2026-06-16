// Pure time-grid math — salvaged and OWNED regardless of the renderer (ADR 019;
// D4). The Flutter-parity grid constants + the minute→pixel / event-height /
// hour-label / now-indicator math the agenda follow-up, the home today-grid, and
// the fallback renderer consume. Pure: no React, no calendar-kit.

// Flutter-parity grid constants (read from the Flutter calendar module), as
// named exports — not magic numbers.
/** Grid window start, minutes from midnight (7:00). */
export const GRID_START_MINUTE = 7 * 60
/** Grid window end, minutes from midnight (21:00). */
export const GRID_END_MINUTE = 21 * 60
/** Default vertical scale. */
export const DEFAULT_PIXELS_PER_HOUR = 60
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
  return ((minute - startMinute) / 60) * pixelsPerHour
}

/** Pixel height of an event from its duration in minutes. */
export function eventHeight(
  durationMinutes: number,
  pixelsPerHour: number = DEFAULT_PIXELS_PER_HOUR,
): number {
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
  const startHour = Math.floor(startMinute / 60)
  const endHour = Math.ceil(endMinute / 60)
  const labels: number[] = []
  for (let hour = startHour; hour <= endHour; hour++) {
    labels.push(hour)
  }
  return labels
}

export interface NowIndicator {
  /** Whether `now` falls within the grid window. */
  visible: boolean
  /** Pixel offset from the grid start (only meaningful when visible). */
  pixel: number
  /** Fractional position over the window (0 = start, 1 = end). */
  fraction: number
}

/** The now-indicator's position for a given clock time within the grid window. */
export function nowIndicatorPosition(
  now: Date,
  {
    pixelsPerHour = DEFAULT_PIXELS_PER_HOUR,
    startMinute = GRID_START_MINUTE,
    endMinute = GRID_END_MINUTE,
  }: GridOptions & { endMinute?: number } = {},
): NowIndicator {
  const minute = now.getHours() * 60 + now.getMinutes()
  const visible = minute >= startMinute && minute <= endMinute
  return {
    visible,
    pixel: minuteToPixel(minute, { pixelsPerHour, startMinute }),
    fraction: (minute - startMinute) / (endMinute - startMinute),
  }
}
