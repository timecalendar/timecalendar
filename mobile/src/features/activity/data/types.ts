import type { CalendarChangeGet } from "@/api/generated/timeCalendar.schemas"
import type { activityLogs, activityState } from "@/db"

// The Activity domain types and the shapes the repository writes (TIM-396).
// This is the ONLY place a generated DTO type touches the Activity data layer,
// and it lives in data/ (B-1, the data/-only-seam rule).

export type ActivityLogRow = typeof activityLogs.$inferSelect
export type ActivityLogInsert = typeof activityLogs.$inferInsert
export type ActivityStateRow = typeof activityState.$inferSelect

// The v1 calendar-log DTO, FROZEN BY THE SPECIFICATION (Activity revival,
// architecture decision 2) rather than imported from the generated client. That
// is deliberate: this ticket ships in parallel with the server work (Ticket 2),
// so the cache must not wait on the generated v1 operation. Ticket 4 owns the
// request and maps its response onto this shape.
//
// `CalendarChangeGet` already exists in the generated schemas from the legacy
// operation, so the decoded payload shape is real today.
export interface ActivityLogDto {
  id: string
  calendarId: string
  calendarName: string
  calendarChange: CalendarChangeGet
  createdAt: string
  updatedAt: string
}

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
