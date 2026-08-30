import type {
  CalendarChangeGet,
  CalendarLogV1,
} from "@/api/generated/timeCalendar.schemas"
import type { activityLogs, activityState } from "@/db"

// The Activity domain types and the shapes the repository writes (TIM-396).
// This is the ONLY place a generated DTO type touches the Activity data layer,
// and it lives in data/ (B-1, the data/-only-seam rule).

export type ActivityLogRow = typeof activityLogs.$inferSelect
export type ActivityLogInsert = typeof activityLogs.$inferInsert
export type ActivityStateRow = typeof activityState.$inferSelect

// The v1 calendar-log DTO. Aliased to the generated `CalendarLogV1` rather than
// restated, so a server-side contract change breaks `tsc` here instead of
// drifting silently into rows the defensive mapper quietly skips. The local name
// is kept because the Activity data layer speaks its own vocabulary; Ticket 4
// owns the request that produces one.
export type ActivityLogDto = CalendarLogV1

export interface ActivityLog {
  id: string
  calendarId: string
  calendarName: string
  change: CalendarChangeGet
  createdAt: Date
  updatedAt: Date
}

// Device-local read + pagination state. `lastReadAt` is SERVER time, always;
// `lastSuccessfulRefreshAt` is DEVICE time (it feeds Ticket 4's elapsed-time
// freshness policy). The two clocks are deliberately different — see the ADR.
export interface ActivityState {
  lastReadAt: Date | null
  unreadCount: number
  lastSuccessfulRefreshAt: Date | null
  olderPageCursor: string | null
  olderPageComplete: boolean
}

// A missing activity_state row reads as these defaults, so a fresh install, a
// reset device and a device whose row was somehow lost all behave identically.
// No migration-time seed exists to get wrong.
export const DEFAULT_ACTIVITY_STATE: ActivityState = {
  lastReadAt: null,
  unreadCount: 0,
  lastSuccessfulRefreshAt: null,
  olderPageCursor: null,
  olderPageComplete: false,
}

// One page write, all-or-nothing. Ticket 4 builds this from a response.
export interface ActivityPageWrite {
  /** The page's rows, already canonicalized by `dtoToActivityRow`. */
  rows: ActivityLogInsert[]
  /**
   * The response's SERVER-ISSUED snapshot time. It is the trusted clock for the
   * one-year prune — the device clock is never consulted.
   */
  asOf: string
  /**
   * The calendar ids the device currently holds. A PARAMETER, not a read of
   * `user_calendars` here: Ticket 4 owns that cross-feature read, which keeps
   * this repository dependency-free and the feature graph acyclic. An EMPTY list
   * means the device holds no calendars, so no Activity row is owned.
   */
  heldCalendarIds: string[]
  /** The response's cursor for the next older page; `null` ends the chain. */
  nextCursor: string | null
  /** The server's unread count, when the response carried one. */
  unreadCount?: number
  /** Device time of this successful refresh (Ticket 4's freshness policy). */
  lastSuccessfulRefreshAt?: Date
}

/**
 * WHAT failed, never WHO sees it (D10). Passive vs. visible is a property of the
 * TRIGGER, not of the error — the same network failure is silent after a
 * calendar sync and visible on pull-to-refresh — so the coordinator classifies
 * the fault and the call site decides visibility. Encoding visibility here would
 * force the data layer to know which screen is mounted, which is precisely the
 * dependency the seam exists to prevent.
 */
export type ActivityFailureReason =
  /** Any throw that is not an `ApiError`: the RN `fetch` TypeError, the
   * mutator's 15 s timeout abort, "Backend runtime is resetting". */
  | "network"
  /** An `ApiError` — the server answered, with a status we did not want. */
  | "server"
  /** A `200` whose body does not match the contract. Never a success. */
  | "malformed"
  /** The repository transaction threw. The write is all-or-nothing, so nothing
   * partial was stored. */
  | "storage"

/**
 * The result of a newest-page refresh. Every path resolves with one of these —
 * the operation NEVER rejects (D11), which is the mechanism behind "a calendar
 * sync success is never converted into a failure by an Activity refresh
 * failure": a caller cannot propagate a rejection it forgot to catch, because
 * there is none to propagate.
 */
export type ActivityRefreshOutcome =
  /** A page was fetched and stored; `lastSuccessfulRefreshAt` moved. */
  | { status: "updated" }
  /** Passive trigger inside the five-minute window — no request was issued. */
  | { status: "fresh" }
  /** D6: the device holds no calendars. No request, no state moved. */
  | { status: "no-calendars" }
  /** D6: above the contract's 100-token ceiling. No request, no state moved. */
  | { status: "too-many-calendars" }
  | { status: "failed"; reason: ActivityFailureReason }

/** The result of an older-page (backfill) load. Never rejects either (D11). */
export type ActivityOlderPageOutcome =
  /** An older page was fetched and stored; the backfill position advanced. */
  | { status: "loaded" }
  /** The chain is already fully backfilled — no request was issued. */
  | { status: "complete" }
  /** No backfill position is stored yet (no newest page has succeeded). */
  | { status: "unavailable" }
  /** D3: the server rejected the stored cursor (400). It was cleared, every
   * cached row kept, and the chain restarts from the newest page. */
  | { status: "cursor-reset" }
  | { status: "no-calendars" }
  | { status: "too-many-calendars" }
  | { status: "failed"; reason: ActivityFailureReason }
