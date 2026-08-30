import { calendarLogV1ControllerSearchCalendarLogs } from "@/api/generated/calendar-logs/calendar-logs"
import type {
  CalendarLogSearchV1Response,
  SearchCalendarLogsV1Dto,
} from "@/api/generated/timeCalendar.schemas"
import { findAll } from "@/features/calendar-sources/data"

// The Activity request layer: what the device holds, whether a request may be
// issued at all, and the one call that reaches the network. The coordinator owns
// policy (freshness, single-flight, recovery); this file owns the wire.
//
// It is the ONLY module in the app that imports the generated calendar-log
// client — a boundary the seam-ban in eslint.config.js enforces rather than
// documents (B-1 is sublayer-scoped and would permit any feature's data/).

/**
 * The page size, sent EXPLICITLY on every request rather than left to the
 * server's DTO default.
 *
 * TIM-394 measured the epic's capacity budget against a 50-log page (p99 ≈ 981 KB
 * before transport compression) and TIM-401 gates the release against that same
 * figure, so this number does not move in this ticket. Keeping it a named client
 * constant — instead of relying on the server default — makes the client's
 * payload size visible in its own source and in a network capture, and gives
 * TIM-401 exactly one line to change if the capacity gate says to.
 */
export const ACTIVITY_PAGE_LIMIT = 50

/**
 * The contract's token range: `@ArrayMaxSize(100)` on the server DTO, and one
 * token minimum by D6 below. Both ends are the same guard.
 */
const MIN_ACTIVITY_TOKENS = 1
const MAX_ACTIVITY_TOKENS = 100

/** What the device currently holds, read once per request attempt. */
export interface HeldCalendars {
  /** Unique calendar tokens — the request's `tokens`. */
  tokens: string[]
  /** Every held calendar id — the page write's ownership-prune input. */
  heldCalendarIds: string[]
}

/**
 * Read the device's calendars through the calendar-sources **data sub-barrel**
 * (D9) — the sibling feature's public seam, never a calendar-feature internal.
 * This is the module's only cross-feature read and it points outward, which is
 * what keeps the Activity dependency graph acyclic.
 *
 * HIDDEN CALENDARS COUNT AS HELD. `visible` is deliberately not a filter:
 * hiding is a display preference, but the ownership prune is about what the
 * device owns. Dropping a hidden calendar's id from `heldCalendarIds` would make
 * the prune delete that calendar's entire Activity history the first time the
 * student hid it.
 *
 * `findAll` has no loaded/unloaded distinction — only the `useUserCalendarsLoaded`
 * hook carries one, and a non-component coordinator cannot call a hook. So an
 * empty result here is indistinguishable from a read that raced the sources
 * table, which is exactly why an empty result can only ever mean *skip* (D6) and
 * never *prune* (D7).
 */
export async function readHeldCalendars(): Promise<HeldCalendars> {
  const calendars = await findAll()
  return {
    // Deduplicated client-side so the precondition below counts the same things
    // the server's `@ArrayMaxSize(100)` counts.
    tokens: [...new Set(calendars.map((calendar) => calendar.token))],
    heldCalendarIds: calendars.map((calendar) => calendar.id),
  }
}

/** Why no request may be issued for the current token set. */
export type TokenPreconditionFailure = "no-calendars" | "too-many-calendars"

export type TokenPrecondition =
  | { ok: true }
  | { ok: false; outcome: TokenPreconditionFailure }

/**
 * D6 — **no Activity request is issued with a token count outside 1…100**, on
 * either path. One precondition, both ends of the contract's stated range, and
 * both irreversible failures below.
 *
 * The server short-circuits an empty token array BEFORE it distinguishes a first
 * page from a following page (`calendar-log.service.ts:58-60`, `emptyPage`), and
 * `tokens` carries no `@ArrayNotEmpty()` — so `tokens: []` is a deliberate `200`
 * and nothing in the contract or the generated client stops the client sending
 * one. Each path then corrupts state in a way no later refresh repairs:
 *
 *  - NEWEST PAGE — the badge wipe. `emptyPage` returns `unreadCount: 0` without
 *    ever reaching `countUnread`. A passive refresh sends `unreadSince`, so D4's
 *    request-branching rule reads that as *I asked for it, therefore accept it*,
 *    stores `0`, and clears the badge on a device that has unread activity. D4
 *    alone does not catch this — it licenses it.
 *  - OLDER PAGE — permanent chain death. The response is a `200` with
 *    `nextCursor: null`, so `writePageIn` (mode `"older"`, `keepPosition` always
 *    false) writes `olderPageComplete: true`. Nothing ever clears it: a
 *    newest-page write deliberately keeps a completed chain complete, and the
 *    only writer of `false` is `clearOlderPageCursor()`, which fires only on a
 *    400 (D3) — and a zero-token page is a 200. The student can never load older
 *    history again, on any later launch, short of clearing the database.
 *
 * Above 100 unique tokens the server answers 400 unconditionally, so issuing is
 * a guaranteed failure a trigger loop would repeat — the same guard, not a
 * second one.
 *
 * A failed precondition moves NO state, and in particular does not move
 * `lastSuccessfulRefreshAt`, so the skip is not cached: the next trigger retries
 * as soon as tokens exist rather than being suppressed for five minutes.
 */
export function checkTokenPrecondition(tokens: string[]): TokenPrecondition {
  if (tokens.length < MIN_ACTIVITY_TOKENS) {
    return { ok: false, outcome: "no-calendars" }
  }
  if (tokens.length > MAX_ACTIVITY_TOKENS) {
    return { ok: false, outcome: "too-many-calendars" }
  }
  return { ok: true }
}

// A `200` body is typed by the generator but arrives from the network, so the
// declared type is a claim, not a guarantee. Everything below is read out of
// that body and written into SQLite, so it is validated before the write rather
// than trusted: `asOf` is the trusted clock for the one-year prune, and
// `unreadCount` lands in an integer column.
function isValidResponse(body: unknown): body is CalendarLogSearchV1Response {
  if (typeof body !== "object" || body === null) return false
  const candidate = body as Record<string, unknown>

  if (typeof candidate.asOf !== "string") return false
  if (Number.isNaN(new Date(candidate.asOf).getTime())) return false

  if (!Array.isArray(candidate.items)) return false
  const itemsAreObjects = candidate.items.every(
    (item) => typeof item === "object" && item !== null,
  )
  if (!itemsAreObjects) return false

  if (
    candidate.nextCursor !== null &&
    typeof candidate.nextCursor !== "string"
  ) {
    return false
  }

  return (
    candidate.unreadCount === undefined ||
    typeof candidate.unreadCount === "number"
  )
}

/**
 * Issue one page request and return the VALIDATED body, or `null` when the
 * response is malformed (the caller classifies that as a `malformed` fault — it
 * is never a success and never reaches a write).
 *
 * Calls the plain generated function, not the generated hook: the callers are
 * calendar sync, the push handler and the app-lifecycle listener, which are
 * plain modules where a hook is uncallable. The generated function already
 * routes through `customFetch`, so this keeps the single-mutator rule intact
 * with no query layer in between (D8).
 *
 * Transport failures are NOT caught here — an `ApiError` or a network throw
 * propagates to the coordinator, which owns classification and, on the older
 * path, cursor recovery.
 */
export async function fetchActivityPage(
  request: SearchCalendarLogsV1Dto,
): Promise<CalendarLogSearchV1Response | null> {
  const body = await calendarLogV1ControllerSearchCalendarLogs(request)
  return isValidResponse(body) ? body : null
}
