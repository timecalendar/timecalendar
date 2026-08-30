// Feature barrel — the public surface of the Activity cluster. TIM-396 landed the
// device-local half; TIM-397 adds the refresh coordinator, so `refreshNewestPage`,
// `loadOlderPage` and `pruneToHeldCalendars` are now part of it.
//
// This barrel is what the OUT-OF-FEATURE triggers consume (B-3: routes and shared
// code reach a feature through its barrel, never through `@/db` or the generated
// client). Ticket 6 wired calendar sync, push, app open and foreground to
// `refreshNewestPage`, and calendar removal to `pruneToHeldCalendars` — the
// latter through `useActivityOwnershipPrune`, which lives here and observes
// calendar-sources rather than being called from it (ADR 049 / D7).
//
// No import cycle: the data/ sub-barrel imports its seams directly, never this
// barrel (the no-self-barrel-cycle rule, B-2).
export {
  ACTIVITY_PAGE_LIMIT,
  type ActivityFailureReason,
  type ActivityLog,
  type ActivityLogDto,
  type ActivityLogInsert,
  type ActivityOlderPageOutcome,
  type ActivityPageWrite,
  type ActivityRefreshOutcome,
  type ActivityState,
  canonicalIso,
  clearOlderPageCursor,
  DEFAULT_ACTIVITY_STATE,
  dtoToActivityRow,
  formatUnreadBadge,
  listActivityLogs,
  loadOlderPage,
  markActivityRead,
  markActivityReadFromCache,
  pruneToHeldCalendars,
  readActivityState,
  refreshNewestPage,
  rowToActivityLog,
  storeNewestPage,
  storeOlderPage,
  useActivityForegroundRefresh,
  useActivityLogs,
  useActivityOwnershipPrune,
  type UseActivityScreenRefresh,
  useActivityScreenRefresh,
  useActivityState,
} from "./data"
