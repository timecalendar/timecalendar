import { ApiError } from "@/api/mutator"
import { recordUnknownError } from "@/firebase"

import { dtoToActivityRow } from "./mappers"
import {
  clearOlderPageCursor,
  readActivityState,
  storeNewestPage,
  storeOlderPage,
} from "./repository"
import {
  ACTIVITY_PAGE_LIMIT,
  checkTokenPrecondition,
  fetchActivityPage,
  readHeldCalendars,
} from "./request"
import type {
  ActivityFailureReason,
  ActivityLogDto,
  ActivityLogInsert,
  ActivityOlderPageOutcome,
  ActivityRefreshOutcome,
} from "./types"

// THE single Activity fetch and pagination seam. Every trigger — calendar sync,
// a push notification, opening the screen, foregrounding the app — comes through
// here, so four triggers can never become four requests. That duplication is the
// capacity risk that got this feature switched off in the first place, arriving
// by a different route.
//
// Policy lives here; the wire lives in request.ts; SQLite is the authoritative
// source of rendered history and unread metadata, so every successful page goes
// through the repository (TIM-396) and the query result is never a cache.

/**
 * The passive-refresh freshness window (architecture decision 7). Compared
 * against the PERSISTED `lastSuccessfulRefreshAt`, so the window survives
 * process death — an in-memory timestamp would reset on every cold launch and
 * make "refresh if the last success is older than five minutes" fire on every
 * single app start.
 */
const FRESHNESS_WINDOW_MS = 5 * 60 * 1000

// Static Crashlytics contexts. No payload ever accompanies them: no token,
// cursor value, calendar name, calendar id, log id, request body, or event
// content may reach a crash report (see `record`).
const REFRESH_CONTEXT = "activity/refresh"
const OLDER_PAGE_CONTEXT = "activity/older-page"

/**
 * One in-flight slot: concurrent triggers join the request already running
 * instead of issuing a second one.
 *
 * THE CHECK AND THE ASSIGNMENT MUST STAY ADJACENT, and this arrow must stay
 * SYNCHRONOUS. JavaScript is single-threaded, so no second trigger can interleave
 * between them; that adjacency is the whole of the single-flight guarantee.
 * Inserting an `await` before the assignment silently reintroduces duplicate
 * requests and still passes tsc, ESLint and every other test in this repo — the
 * concurrency tests in coordinator.test.ts are the only thing that catches it.
 *
 * One helper rather than a hand-rolled slot per operation, so that hazard lives
 * in exactly one place. Same shape as the `singleFlight` closure in
 * `features/environment/data/orchestrator.ts`.
 */
function createSlot<T>(): (operation: () => Promise<T>) => Promise<T> {
  let active: Promise<T> | null = null
  return (operation) => {
    if (active) return active
    active = operation().finally(() => {
      active = null
    })
    return active
  }
}

// The two in-flight slots — module-level, NOT TanStack Query (D8). Two
// INDEPENDENT slots is the point: older-page loading can neither block nor be
// blocked by a forced newest-page refresh (architecture decision 7).
const newestPageSlot = createSlot<ActivityRefreshOutcome>()
const olderPageSlot = createSlot<ActivityOlderPageOutcome>()

/**
 * Tags a repository throw at the throw site.
 *
 * A storage fault and a network fault both surface as a plain `Error`, so the
 * catch site cannot tell them apart by inspection — it has to be told. Without
 * this, a failing SQLite transaction would be reported as a network failure.
 */
class StorageFault extends Error {
  constructor(readonly reason: unknown) {
    super("activity storage failed")
    this.name = "StorageFault"
  }
}

async function storage<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw new StorageFault(error)
  }
}

/**
 * Record a fault, once, with a static context and NO payload.
 *
 * `network` and `server` are expected conditions on a phone — a captive portal,
 * a tunnel, a 503 during a deploy — and routing them to Crashlytics would bury
 * real faults under noise. `malformed` and `storage` are not expected and are
 * recorded. A newest-page 400 is recorded by its caller for the same reason: it
 * means the contract was violated, not that the network is bad.
 */
function record(reason: ActivityFailureReason, context: string): void {
  if (reason === "network" || reason === "server") return
  recordUnknownError(new Error(`activity ${reason} failure`), context)
}

function classify(error: unknown): ActivityFailureReason {
  if (error instanceof StorageFault) return "storage"
  if (error instanceof ApiError) return "server"
  return "network"
}

function fail(
  reason: ActivityFailureReason,
  context: string,
): { status: "failed"; reason: ActivityFailureReason } {
  record(reason, context)
  return { status: "failed", reason }
}

// A page's rows, with undecodable ones dropped rather than fatal — the same
// posture the repository read takes. `dtoToActivityRow` returns null for a row
// whose timestamps cannot be canonicalized, which must never reach the table.
function toRows(items: ActivityLogDto[]): ActivityLogInsert[] {
  return items
    .map(dtoToActivityRow)
    .filter((row): row is ActivityLogInsert => row !== null)
}

/**
 * Refresh the newest page.
 *
 * ORDER IS THE CORRECTNESS ARGUMENT (D8), so it is spelled out rather than left
 * to the reader:
 *
 *  (a) When NOT forced, the freshness check runs BEFORE the in-flight slot is
 *      consulted. A passive trigger satisfied by freshness must not publish a
 *      resolved promise into the slot, because a later forced trigger would join
 *      it and mistake it for a completed request.
 *  (b) Then, and only then, join an in-flight request.
 *  (c) Otherwise assign the slot in the statement IMMEDIATELY following the
 *      check.
 *
 * A joined caller gets the same outcome as the caller that issued the request,
 * including its failure classification. Forced-ness is not re-evaluated on join:
 * the request already in flight is the request everyone gets, which is exactly
 * what architecture decision 7 asks for.
 *
 * Never rejects (D11).
 */
export async function refreshNewestPage({
  force = false,
}: { force?: boolean } = {}): Promise<ActivityRefreshOutcome> {
  // (a) Freshness, outside the slot. The read is persisted state, so it can
  // throw; a throw here is a storage fault, not a reason to reject.
  if (!force) {
    try {
      const state = await readActivityState()
      const lastSuccess = state.lastSuccessfulRefreshAt
      if (
        lastSuccess !== null &&
        Date.now() - lastSuccess.getTime() < FRESHNESS_WINDOW_MS
      ) {
        return { status: "fresh" }
      }
    } catch {
      return fail("storage", REFRESH_CONTEXT)
    }
  }

  // (b) + (c) — join the request in flight, or issue one. The adjacency that
  // makes this safe lives in `createSlot`.
  return newestPageSlot(runNewestPage)
}

async function runNewestPage(): Promise<ActivityRefreshOutcome> {
  try {
    const state = await storage(readActivityState)
    const held = await storage(readHeldCalendars)

    const precondition = checkTokenPrecondition(held.tokens)
    if (!precondition.ok) return { status: precondition.outcome }

    // D4/D5: the watermark is a SERVER-issued `asOf`, sent back as `unreadSince`
    // so `countUnread` compares it against the same clock it stores.
    const unreadSince = state.lastReadAt?.toISOString()

    const response = await fetchActivityPage({
      limit: ACTIVITY_PAGE_LIMIT,
      tokens: held.tokens,
      ...(unreadSince === undefined ? {} : { unreadSince }),
    })
    if (response === null) return fail("malformed", REFRESH_CONTEXT)

    await storage(() =>
      storeNewestPage({
        rows: toRows(response.items),
        asOf: response.asOf,
        heldCalendarIds: held.heldCalendarIds,
        nextCursor: response.nextCursor,
        // D4: branch on the REQUEST, never on `response.unreadCount !==
        // undefined`. A zero-token first page carries `unreadCount: 0` whether
        // or not `unreadSince` was sent, so field presence is not proof the
        // client asked for it — and an absent count must mean "leave the stored
        // one alone", never "zero", or every older page would clear the badge.
        ...(unreadSince === undefined
          ? {}
          : { unreadCount: response.unreadCount }),
        // The ONLY place the freshness timestamp is written. It lives inside the
        // successful page-write transaction, so a failure structurally cannot
        // move it — which is what lets a later passive trigger retry.
        lastSuccessfulRefreshAt: new Date(),
      }),
    )

    return { status: "updated" }
  } catch (error) {
    // A 400 on THIS path is not cursor recovery — the newest-page request
    // carries no cursor. It means the contract was violated (a token count above
    // 100, a malformed `unreadSince`), so unlike an ordinary server fault it IS
    // recorded as unexpected. It still changes no stored state.
    if (error instanceof ApiError && error.status === 400) {
      recordUnknownError(new Error("activity newest-page 400"), REFRESH_CONTEXT)
      return { status: "failed", reason: "server" }
    }
    return fail(classify(error), REFRESH_CONTEXT)
  }
}

/**
 * Load one older page of history — the backfill, driven only by the screen.
 *
 * On its own in-flight slot, so it can neither block nor be blocked by a forced
 * newest-page refresh. Never rejects (D11).
 */
export async function loadOlderPage(): Promise<ActivityOlderPageOutcome> {
  return olderPageSlot(runOlderPage)
}

async function runOlderPage(): Promise<ActivityOlderPageOutcome> {
  try {
    const state = await storage(readActivityState)

    // A completed chain is checked first: when it is complete the cursor is null
    // too, and "complete" is the more specific answer.
    if (state.olderPageComplete) return { status: "complete" }
    if (state.olderPageCursor === null) return { status: "unavailable" }

    const held = await storage(readHeldCalendars)
    const precondition = checkTokenPrecondition(held.tokens)
    if (!precondition.ok) return { status: precondition.outcome }

    const response = await fetchActivityPage({
      limit: ACTIVITY_PAGE_LIMIT,
      tokens: held.tokens,
      cursor: state.olderPageCursor,
      // No `unreadSince`: the server returns no `unreadCount` for a cursored
      // request, and asking for one on a backfill is meaningless.
    })
    if (response === null) return fail("malformed", OLDER_PAGE_CONTEXT)

    await storage(() =>
      storeOlderPage({
        rows: toRows(response.items),
        asOf: response.asOf,
        heldCalendarIds: held.heldCalendarIds,
        // `nextCursor: null` is the FINAL-PAGE signal and is stored as such.
        // Suppressing it to avoid "losing" the chain would restart pagination
        // forever at the end of history — the exact bug D3 closes. Chain death
        // is detected from a 400 and from nothing else.
        nextCursor: response.nextCursor,
        // No `unreadCount`: this request sent no `unreadSince` (D4), so the
        // stored count must be left exactly as it is.
      }),
    )

    return { status: "loaded" }
  } catch (error) {
    // D3 — cursor recovery. A rejected cursor is exactly one thing: HTTP 400.
    // The server never validates a cursor's `asOf` against anything, and `asOf`
    // on a following page is the client's own cursor field echoed straight back,
    // so no comparison of response-vs-cursor can carry liveness. Never infer a
    // dead chain from `asOf`, from empty `items`, or from `nextCursor === null`.
    // The realistic production trigger is a cursor-version bump, which
    // invalidates every persisted cursor on every device at once.
    if (error instanceof ApiError && error.status === 400) {
      try {
        // Deletes NO rows: the cached history stays readable offline, and the
        // repository's upsert identity makes the repeated pages harmless.
        // No `storage()` tag here — the catch is adjacent, so there is no
        // distant catch site that would have to tell a storage throw from a
        // network one.
        await clearOlderPageCursor()
      } catch {
        return fail("storage", OLDER_PAGE_CONTEXT)
      }
      return { status: "cursor-reset" }
    }
    return fail(classify(error), OLDER_PAGE_CONTEXT)
  }
}

// NOTE (D11): nothing in this module calls `markActivityRead` or
// `markActivityReadFromCache`. The read watermark belongs to the read action,
// which is the Activity screen (Ticket 5). A background refresh that advanced it
// would mark unseen changes as read. The repository already enforces this at the
// storage layer; it is stated here so a later "just advance it while we're here"
// does not look reasonable.

// NOTE (D7): `pruneToHeldCalendars` is exported from this module's barrel but is
// deliberately NOT called from here. An empty held-list is authoritative only
// when a calendar-REMOVAL event supplied it; a speculative `findAll()` cannot
// tell an empty device from a read that raced the sources table, and pruning on
// the latter destroys the whole cache. Wiring removal to it is TIM-399.
//
// The two in-flight slots are module-level, so the tests get a clean pair by
// re-`require`ing this module after `jest.resetModules()` — the idiom
// restart.test.ts already uses. No test-only production export exists for it.
