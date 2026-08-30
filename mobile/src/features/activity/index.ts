// Feature barrel — the public surface of the Activity cluster (TIM-396: the
// device-local half only). No `ui/` this ticket: the screen and the Settings
// unread entry land with Ticket 5, the refresh coordinator with Ticket 4.
//
// No import cycle: the data/ sub-barrel imports its seams directly, never this
// barrel (the no-self-barrel-cycle rule, B-2).
export {
  type ActivityLog,
  type ActivityLogDto,
  type ActivityLogInsert,
  type ActivityPageWrite,
  type ActivityState,
  canonicalIso,
  clearOlderPageCursor,
  DEFAULT_ACTIVITY_STATE,
  dtoToActivityRow,
  listActivityLogs,
  markActivityRead,
  markActivityReadFromCache,
  readActivityState,
  rowToActivityLog,
  storeNewestPage,
  storeOlderPage,
} from "./data"
