import {
  activityLogs,
  activityState,
  db,
  desc,
  eq,
  isoToDate,
  lt,
  notInArray,
} from "@/db"
import { recordUnknownError } from "@/firebase"

import { canonicalIso, rowToActivityLog } from "./mappers"
import {
  type ActivityLog,
  type ActivityPageWrite,
  type ActivityState,
  type ActivityStateRow,
  DEFAULT_ACTIVITY_STATE,
} from "./types"

// The Activity cache over the @/db seam — a module of functions, no class (R-2,
// mirroring the other feature repositories). Imports {db}, the tables and the
// operators from @/db only; never drizzle-orm directly (lint-enforced).
//
// Two properties separate this from every other server-backed table in the app,
// and both are recorded in the Activity ADR:
//
//  1. It is MERGED BY LOG ID, never drop+replaced. `calendar_events` replaces
//     because a sync response is the complete current timetable. A calendar-log
//     page is the opposite — one bounded window over a year of cursor-paginated
//     history — so replacing on a newest-page refresh would delete every older
//     page the student had already backfilled, shrink the offline timeline to one
//     page, and turn a passive background refresh into visible data loss.
//  2. Its read watermark is SERVER time. See `markActivityRead`.
//
// Every write is ONE SYNCHRONOUS db.transaction with `.run()` executors (the seam
// atomicity contract — the expo driver never awaits, so an async callback would
// let BEGIN/COMMIT bracket only the first statement). The functions still return
// Promise<void> to their callers, wrapping the synchronous transaction, the same
// shape calendar sync's `replaceAll` uses.

// The activity_state singleton key. A repository convention, not a CHECK
// constraint: the repository is the only writer, every write is an upsert on this
// constant, and a constraint on a table that ships to field devices is harder to
// change later than a constant.
const ACTIVITY_STATE_ID = 1

const YEAR_IN_MONTHS = 12

// The transaction handle the seam hands the callback. Derived from `db` so it
// tracks the driver rather than being hand-declared.
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const DEFAULT_STATE_ROW: ActivityStateRow = {
  id: ACTIVITY_STATE_ID,
  lastReadAt: null,
  unreadCount: DEFAULT_ACTIVITY_STATE.unreadCount,
  lastSuccessfulRefreshAt: null,
  olderPageCursor: null,
  olderPageComplete: DEFAULT_ACTIVITY_STATE.olderPageComplete,
}

function rowToState(row: ActivityStateRow): ActivityState {
  return {
    lastReadAt: row.lastReadAt === null ? null : isoToDate(row.lastReadAt),
    unreadCount: row.unreadCount,
    lastSuccessfulRefreshAt:
      row.lastSuccessfulRefreshAt === null
        ? null
        : isoToDate(row.lastSuccessfulRefreshAt),
    olderPageCursor: row.olderPageCursor,
    olderPageComplete: row.olderPageComplete,
  }
}

// The SYNCHRONOUS state read. drizzle-orm/expo-sqlite is a 'sync' session, so
// `.all()` returns rows without a promise — the only way to read inside a
// synchronous transaction callback. A missing row reads as the defaults.
function readStateRowIn(tx: Transaction): ActivityStateRow {
  const rows = tx
    .select()
    .from(activityState)
    .where(eq(activityState.id, ACTIVITY_STATE_ID))
    .all()
  return rows[0] ?? DEFAULT_STATE_ROW
}

// Read-modify-write of the WHOLE row, so `values` and `set` carry identical
// content: a partial upsert would insert defaults for the untouched columns when
// no row exists yet, quietly clobbering state on the very first write.
function writeStateIn(tx: Transaction, patch: Partial<ActivityStateRow>): void {
  const next: ActivityStateRow = {
    ...readStateRowIn(tx),
    ...patch,
    id: ACTIVITY_STATE_ID,
  }
  tx.insert(activityState)
    .values(next)
    .onConflictDoUpdate({ target: activityState.id, set: next })
    .run()
}

// The newest server timestamp cached on the device. `ORDER BY created_at DESC
// LIMIT 1` rides the created_at index the migration adds.
function newestCachedCreatedAtIn(tx: Transaction): string | null {
  const rows = tx
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(1)
    .all()
  return rows[0]?.createdAt ?? null
}

// One year before the latest server time the device can TRUST:
//
//   latestKnownAsOf = max(write.asOf, MAX(activity_logs.created_at))
//
// Every cached `created_at` and every `asOf` is server-issued, so their max is a
// sound lower bound on server "now" and is monotone — it only moves forward. An
// older-page write carries the snapshot-bound `asOf` of its chain, which is at
// most the newest one, so taking the max prunes at the same boundary instead of
// under-pruning. THE DEVICE CLOCK IS NEVER CONSULTED: a phone whose clock is set
// forward must not be able to delete a year of history.
//
// Comparison is lexicographic on canonical UTC ISO-8601 text, which the mappers
// guarantee. Returns `null` when no trusted timestamp exists at all, in which
// case the caller skips the prune rather than deleting against a garbage cutoff.
function ageCutoffIn(tx: Transaction, asOf: string): string | null {
  // Canonicalize BOTH candidates. The write mapper guarantees canonical text for
  // every row it produces, but the cached value is read back from the table and
  // the page-write input is a raw insert shape — a single unorderable timestamp
  // must degrade to "no trusted time", never throw and take the whole page write
  // (rows included) down with it.
  const candidates = [asOf, newestCachedCreatedAtIn(tx)]
    .map((value) => (value === null ? null : canonicalIso(value)))
    .filter((value): value is string => value !== null)
  if (candidates.length === 0) return null

  const latestKnown = candidates.reduce((a, b) => (a > b ? a : b))
  const cutoff = isoToDate(latestKnown)
  cutoff.setUTCMonth(cutoff.getUTCMonth() - YEAR_IN_MONTHS)
  return cutoff.toISOString()
}

// The shared page-write transaction body, in the fixed order the design freezes:
// upsert → prune by age → prune by ownership → advance state. State is written
// LAST and INSIDE the same transaction, so a throw anywhere in the earlier steps
// leaves both the rows and the cursor exactly as they were. That is the concrete
// meaning of "advance the cursor only after the page is stored successfully" —
// not a second statement after an awaited write, but a later statement in the
// same atomic unit.
function writePageIn(
  tx: Transaction,
  write: ActivityPageWrite,
  mode: "newest" | "older",
): void {
  // 1. Upsert by log id, row by row. A page is capped at 100 rows by the server
  // contract, so the statement count is bounded and small; the explicit per-row
  // form avoids a hand-written `excluded.` SQL fragment in a feature repository.
  // (Calendar sync's chunked bulk insert exists because it writes ~600 rows at
  // once — that pressure does not exist here.) Upsert identity is also what makes
  // a repeated newest page, an overlapping older page and a restarted pagination
  // chain idempotent rather than duplicating.
  for (const row of write.rows) {
    tx.insert(activityLogs)
      .values(row)
      .onConflictDoUpdate({ target: activityLogs.id, set: row })
      .run()
  }

  // 2. Prune by age — one year before the latest TRUSTED server snapshot.
  const cutoff = ageCutoffIn(tx, write.asOf)
  if (cutoff !== null) {
    tx.delete(activityLogs).where(lt(activityLogs.createdAt, cutoff)).run()
  }

  // 3. Prune by ownership — rows for calendars the device no longer holds. An
  // empty held-id list genuinely means no Activity row is owned, and `NOT IN ()`
  // is not valid SQL, so that case clears the table outright.
  if (write.heldCalendarIds.length === 0) {
    tx.delete(activityLogs).run()
  } else {
    tx.delete(activityLogs)
      .where(notInArray(activityLogs.calendarId, write.heldCalendarIds))
      .run()
  }

  // 4. Advance state.
  const current = readStateRowIn(tx)
  // A newest-page refresh PRESERVES an existing backfill position: a partial
  // backfill must not restart from page two, and the newest page's cursor points
  // at a window the student already has. A completed chain likewise stays
  // complete. Only a cache with no backfill position yet adopts the cursor —
  // that is the "first successful page" rule. An older-page write always
  // overwrites, because its cursor IS the chain's new position.
  const keepPosition =
    mode === "newest" &&
    (current.olderPageCursor !== null || current.olderPageComplete)

  writeStateIn(tx, {
    olderPageCursor: keepPosition ? current.olderPageCursor : write.nextCursor,
    olderPageComplete: keepPosition
      ? current.olderPageComplete
      : write.nextCursor === null,
    // The server's unread count is stored WITHOUT touching the watermark:
    // advancing it on a passive refresh would mark unseen changes as read.
    unreadCount: write.unreadCount ?? current.unreadCount,
    lastSuccessfulRefreshAt:
      write.lastSuccessfulRefreshAt?.toISOString() ??
      current.lastSuccessfulRefreshAt,
  })
}

export async function readActivityState(): Promise<ActivityState> {
  const rows = await db
    .select()
    .from(activityState)
    .where(eq(activityState.id, ACTIVITY_STATE_ID))
  const row = rows[0]
  return row ? rowToState(row) : DEFAULT_ACTIVITY_STATE
}

/**
 * The cached history, newest first. `created_at` then `id` — the second key
 * breaks ties deterministically when two logs share a server timestamp, so the
 * list does not reshuffle between reads.
 *
 * An undecodable row is SKIPPED, never fatal. The skip is recorded ONCE per read
 * through the unexpected-local-data path with a static context and a COUNT only:
 * no log id, calendar id, calendar name, event title, location, or any part of
 * the change payload may reach Crashlytics.
 */
export async function listActivityLogs(): Promise<ActivityLog[]> {
  const rows = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt), desc(activityLogs.id))

  const logs = rows.map(rowToActivityLog)
  const decoded = logs.filter((log): log is ActivityLog => log !== null)

  const skipped = logs.length - decoded.length
  if (skipped > 0) {
    recordUnknownError(
      new Error(`skipped ${skipped} undecodable activity row(s)`),
      "activity/decode",
    )
  }

  return decoded
}

/** Store a newest-page response. Preserves an existing backfill position. */
export async function storeNewestPage(write: ActivityPageWrite): Promise<void> {
  db.transaction((tx) => writePageIn(tx, write, "newest"))
}

/** Store an older-page response. Always advances the backfill position. */
export async function storeOlderPage(write: ActivityPageWrite): Promise<void> {
  db.transaction((tx) => writePageIn(tx, write, "older"))
}

/**
 * The server rejected the stored cursor. Reset the chain so pagination restarts
 * from the newest page — and DELETE NO ROWS: the cached history stays readable
 * offline, and the upsert identity makes the repeated pages harmless.
 */
export async function clearOlderPageCursor(): Promise<void> {
  db.transaction((tx) => {
    writeStateIn(tx, { olderPageCursor: null, olderPageComplete: false })
  })
}

/**
 * The student is looking at the snapshot `asOf`: the watermark becomes that
 * SERVER-ISSUED time and the unread count clears.
 *
 * The watermark is never a device-clock value. A phone whose clock is set
 * forward would sit ahead of every server row, so nothing would ever be unread
 * again; set backward, already-read history would re-count as unread on every
 * refresh. Both failures are silent and permanent, which is why an unparseable
 * `asOf` leaves the watermark alone rather than falling back to local time.
 */
export async function markActivityRead(asOf: string): Promise<void> {
  const watermark = canonicalIso(asOf)
  db.transaction((tx) => {
    writeStateIn(tx, {
      unreadCount: 0,
      ...(watermark === null ? {} : { lastReadAt: watermark }),
    })
  })
}

/**
 * The screen opened offline, so there is no fresh `asOf`. The watermark advances
 * only to the newest SERVER timestamp the device can prove it has seen, and only
 * when that is later than the stored one. The count clears regardless. A later
 * successful response can still count rows created after that point — the
 * correct, conservative outcome.
 */
export async function markActivityReadFromCache(): Promise<void> {
  db.transaction((tx) => {
    const current = readStateRowIn(tx)
    const newest = newestCachedCreatedAtIn(tx)
    const advances =
      newest !== null &&
      (current.lastReadAt === null || newest > current.lastReadAt)

    writeStateIn(tx, {
      unreadCount: 0,
      ...(advances ? { lastReadAt: newest } : {}),
    })
  })
}
