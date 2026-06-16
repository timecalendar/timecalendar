// The calendar feature's data sub-barrel: the salvaged pure primitives (the
// overlap engine + the time-grid math), the agenda day-grouping + locale-aware
// display formatter, the domain CalendarEvent, the dev/test-only fixture, the
// single events-source seam (useCalendarEvents), and the calendar-sync surface
// (the orchestrator + startup trigger).
export { type AgendaDay, groupEventsByDay } from "./agenda"
export {
  type EventDetails,
  type EventDetailsTag,
  getByUid,
  rowToEventDetails,
  type UseEventDetails,
  useEventDetails,
} from "./event-details"
export { type DateRange, useCalendarEvents } from "./events"
// Dev/test-only since the sync ship — no longer in the default useCalendarEvents
// merge; kept for the primitive/screen tests + optional __DEV__ seeding.
export { denseWeekFixture } from "./fixtures"
export {
  type AppLocale,
  formatDayHeaderParts,
  formatEventDateRange,
  formatFullDateTime,
  formatTimeRange,
} from "./format"
export { type Interval, layoutOverlaps, type Placed } from "./overlap-layout"
export { useStartupSync, type UseSyncCalendars, useSyncCalendars } from "./sync"
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
