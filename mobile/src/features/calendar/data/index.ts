// The calendar feature's data sub-barrel: the salvaged pure primitives (the
// overlap engine + the time-grid math), the agenda day-grouping + locale-aware
// display formatter, the domain CalendarEvent, the single events-source seam
// (useCalendarEvents), and the calendar-sync surface (the orchestrator + startup
// trigger).
export { type AgendaDay, groupEventsByDay } from "./agenda"
export { localDayKey } from "./day-key"
export {
  type EventDetails,
  type EventDetailsTag,
  personalRowToEventDetails,
  rowToEventDetails,
  type UseEventDetails,
  useEventDetails,
} from "./event-details"
export { type DateRange, useCalendarEvents } from "./events"
export {
  type AppLocale,
  formatDayHeaderParts,
  formatEventDateRange,
  formatFullDateTime,
  formatFullDay,
  formatTimeRange,
  resolveLocale,
} from "./format"
export { type Interval, layoutOverlaps, type Placed } from "./overlap-layout"
export { eventRoute } from "./routes"
export {
  useStartupSync,
  type UseSyncCalendars,
  useSyncCalendars,
  useSyncedEvents,
} from "./sync"
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
