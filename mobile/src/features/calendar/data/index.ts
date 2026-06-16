// The calendar feature's data sub-barrel: the salvaged pure primitives (the
// overlap engine + the time-grid math), the domain CalendarEvent, the committed
// fixture, and the single events-source seam (useCalendarEvents).
export { type DateRange, useCalendarEvents } from "./events"
export { denseWeekFixture } from "./fixtures"
export { type Interval, layoutOverlaps, type Placed } from "./overlap-layout"
export {
  DEFAULT_PIXELS_PER_HOUR,
  eventHeight,
  GRID_END_MINUTE,
  GRID_START_MINUTE,
  hourLabels,
  HOURS_COLUMN_WIDTH,
  MIN_TILE_WIDTH,
  minuteToPixel,
  type NowIndicator,
  nowIndicatorPosition,
} from "./time-grid"
export { type CalendarEvent } from "./types"
