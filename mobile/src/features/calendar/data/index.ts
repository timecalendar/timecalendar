// The calendar feature's data sub-barrel: the salvaged pure primitives (the
// overlap engine + the time-grid math), the agenda day-grouping + locale-aware
// display formatter, the domain CalendarEvent, the single events-source seam
// (useCalendarEvents), and the calendar-sync surface (the orchestrator + startup
// trigger).
export { type AgendaDay, groupEventsByDay } from "./agenda"
export { useCalendarClock } from "./clock"
export {
  addDaysInZone,
  atHourInZone,
  dayKey,
  dayKeyToDate,
  minuteOfDayInZone,
  startOfDayInZone,
  utcDayKey,
} from "./day-key"
export { eventSurfaceColor } from "./event-color"
export {
  CALENDAR_EVENT_REJECTION_REASONS,
  type CalendarEventDecodeResult,
  type CalendarEventRejectionCounts,
  type CalendarEventRejectionReason,
  decodePersonalEventRows,
  decodeSyncedEventRows,
} from "./event-decoder"
export {
  type EventDetails,
  type EventDetailsTag,
  personalRowToEventDetails,
  rowToEventDetails,
  type UseEventDetails,
  useEventDetails,
} from "./event-details"
export {
  type CalendarEventsSnapshot,
  type DateRange,
  useCalendarEvents,
  useCalendarEventsSnapshot,
} from "./events"
export {
  type AppLocale,
  formatClockTime,
  formatDayHeaderParts,
  formatDayMonth,
  formatEventDateRange,
  formatFullDateTime,
  formatFullDay,
  formatHourStartLabel,
  formatMonthYear,
  formatShortDateTime,
  formatTime,
  formatTimeRange,
  resolveLocale,
} from "./format"
export { type Interval, layoutOverlaps, type Placed } from "./overlap-layout"
export {
  type CalendarPageDirection,
  type CalendarRangePageV1,
  type CalendarThreePageRangeV1,
  planCalendarThreePageRange,
} from "./range-plan"
export { eventRoute } from "./routes"
export {
  useStartupSync,
  type UseSyncCalendars,
  useSyncCalendars,
  useSyncedEventRowsInRange,
  useSyncedEvents,
} from "./sync"
export {
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
  HOURS_COLUMN_WIDTH,
  isValidPixelsPerHour,
  MAX_PIXELS_PER_HOUR,
  maxVerticalOffset,
  MIN_PIXELS_PER_HOUR,
  MIN_TILE_WIDTH,
  minuteToPixel,
  type NativeVerticalGeometry,
  NOW_VIEWPORT_FRACTION,
  nowAnchoredRawOffset,
  type NowIndicator,
  nowIndicatorPosition,
  type RawOffsetBounds,
  rawOffsetBounds,
  resolvePixelsPerHour,
  stepPixelsPerHour,
  type TimedViewportBounds,
  usableViewportCenterY,
  usableViewportY,
  ZOOM_PIXELS_PER_HOUR_STEP,
} from "./time-grid"
export {
  classifyTimedEventSupport,
  type TimedEventSupport,
} from "./timed-support"
export {
  buildCalendarTimelinePresentation,
  type CalendarTimelineColumnV1,
  type CalendarTimelinePageV1,
  type CalendarTimelinePresentationV1,
  type TimedTileV1,
  type TimelineChecklistProgressV1,
  timelinePresentationUids,
} from "./timeline-presentation"
export {
  type CalendarTimelinePresentationInput,
  useCalendarTimelinePresentation,
} from "./timeline-presentation-hook"
export {
  CALENDAR_EVENT_FALLBACK_COLOR,
  type CalendarEvent,
  type CalendarEventIdentityV1,
  type CalendarEventSource,
  type DateOnlyCalendarEventV1,
  type TimedCalendarEventV1,
} from "./types"
export {
  type FirstWeekday,
  shiftWeekInZone,
  startOfWeekInZone,
  type WeekColumn,
  weekColumns,
  type WeekDirection,
} from "./week"
export {
  type CalendarTimelineMode,
  type CalendarTransitionRequest,
  type CalendarTransitionSource,
  type CalendarTransitionState,
  cancelCalendarTransition,
  createCalendarTransitionState,
  normalizeTimelineAnchor,
  replaceCalendarTransition,
  requestCalendarTransition,
  settleCalendarTransition,
  shiftTimelineAnchor,
  timelineColumns,
} from "./week-transition"
