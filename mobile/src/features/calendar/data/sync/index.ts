// The calendar-sync data sub-module barrel (ADR 021). No cycle (B-2): this
// sub-module imports the sibling sublayer files by their @/features/calendar/data
// alias path (the ../ ban) — the specific files (types/events), never this barrel
// nor the feature barrel.
export { useSyncedEvents } from "./hooks"
export { findInRange, replaceAll } from "./repository"
export { useStartupSync } from "./startup"
export { type UseSyncCalendars, useSyncCalendars } from "./sync"
export {
  calendarEventToRow,
  fromCalendarEventDto,
  rowToCalendarEvent,
} from "./types"
