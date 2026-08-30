import { useCallback, useEffect, useRef, useState } from "react"
import { AppState, type AppStateStatus } from "react-native"

import {
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"
import { recordUnknownError } from "@/firebase"

import { refreshNewestPage } from "./coordinator"
import { pruneToHeldCalendars } from "./repository"
import type { ActivityRefreshOutcome } from "./types"

// The three triggers the Activity feature owns itself: returning to the app,
// opening the screen, and losing a calendar. The other three rows of the trigger
// table (calendar sync, push, cold launch) are edges OTHER features add — they
// call `refreshNewestPage` through the feature barrel, so no other feature needs
// anything from this file.
//
// This file adds no policy. The five-minute window, the single-flight slot, the
// token precondition and the failure classification all live in coordinator.ts
// (TIM-397); everything here decides only WHICH event calls it and whether that
// call is forced. That split is why "overlapping triggers produce exactly one
// request" is provable: every trigger goes through the one seam.
//
// It lives in data/, not a new runtime/ sublayer, for the same reason
// `useStartupSync` lives in `calendar/data/sync/startup.ts`: B-1 is
// sublayer-scoped and keys off `layer: "!(data)"`, so a runtime/ sublayer would
// be banned from @/db and would need eslint surgery to buy nothing.

/** Crashlytics context for the one consumed operation that can reject. */
const PRUNE_CONTEXT = "activity/prune"

/**
 * Refresh Activity when the app comes back to the foreground (trigger table:
 * "App moves to foreground → refresh when last success is older than five
 * minutes", failure not user-visible).
 *
 * The refresh is PASSIVE — no `force` — so the coordinator answers `fresh`
 * inside the window without issuing a request. Failure is silent by design:
 * there is no screen guaranteed to be mounted at a foreground boundary.
 *
 * Only a `background → active` transition counts, tracked with the same
 * `backgroundedRef` idiom as `src/updates/ota-update-runtime.tsx`. iOS raises
 * `inactive → active` for a notification-shade pull, a control-centre swipe and
 * an incoming call; none of those is a return to the app, and spending a request
 * on each is exactly the capacity posture this epic exists to avoid. A cold
 * launch has no preceding `"background"` either, which is correct — cold launch
 * is the startup sync's post-sync refresh, not a foreground transition.
 */
export function useActivityForegroundRefresh(): void {
  const backgroundedRef = useRef(false)

  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus): void {
      if (nextState === "background") {
        backgroundedRef.current = true
        return
      }
      if (nextState !== "active") {
        return
      }

      const crossedForegroundBoundary = backgroundedRef.current
      backgroundedRef.current = false
      if (!crossedForegroundBoundary) {
        return
      }

      void refreshNewestPage()
    }

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    )
    return () => subscription.remove()
  }, [])
}

/** What the Activity screen (Ticket 5) drives its refresh affordance from. */
export interface UseActivityScreenRefresh {
  /**
   * The last resolved outcome, or `null` until the first refresh settles. The
   * coordinator's outcome VERBATIM — a `failed` outcome is exposed, never
   * thrown, so the screen can show the failure while keeping cached content
   * visible underneath. Nothing here deletes a row.
   */
  outcome: ActivityRefreshOutcome | null
  isRefreshing: boolean
  /** Pull-to-refresh: always forced (trigger table row 1). */
  refresh: () => void
}

/**
 * The screen-open and pull-to-refresh triggers.
 *
 * Two trigger-table rows in one hook, deliberately: Ticket 6 owns WHEN a refresh
 * is asked for, Ticket 5 owns what the student sees, so Ticket 5 can wire a
 * `RefreshControl` to `refresh` without re-deciding policy.
 *
 *  - Mount fires a PASSIVE refresh once — the five-minute screen-open rule.
 *  - `refresh()` fires a FORCED one.
 *
 * `loadOlderPage` is deliberately not wrapped: backfill is screen-driven
 * pagination, which is Ticket 5's.
 */
export function useActivityScreenRefresh(): UseActivityScreenRefresh {
  const [outcome, setOutcome] = useState<ActivityRefreshOutcome | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  // A refresh can settle after the student has navigated away; writing state
  // then is a React warning and a leak, so every write is gated on this.
  const mountedRef = useRef(true)
  const openedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const run = useCallback(async (force: boolean): Promise<void> => {
    setIsRefreshing(true)
    // Never rejects (TIM-397 D11), so there is no rejection to catch here and a
    // catch would be dead code implying otherwise.
    const next = await refreshNewestPage(force ? { force: true } : {})
    if (!mountedRef.current) {
      return
    }
    setOutcome(next)
    setIsRefreshing(false)
  }, [])

  // Once across re-renders, not once per effect run: the screen re-renders as
  // rows arrive, and a second passive refresh per render would be a request per
  // render the moment the window expires.
  //
  // `run` is a `useCallback` with no dependencies, so today the deps array alone
  // would do it and the ref below reads as belt-and-braces. It is deliberate,
  // and it is the same guard `useStartupSync` and `useNotificationTapRouting`
  // carry: it is what makes the hook safe when the effect IS re-invoked without
  // a remount — StrictMode in development and Fast Refresh — where the cost is a
  // duplicate request on every reload. That path is not reachable from the Jest
  // renderer, so the early return below is the one uncovered line in this file.
  useEffect(() => {
    if (openedRef.current) {
      return
    }
    openedRef.current = true
    void run(false)
  }, [run])

  const refresh = useCallback((): void => {
    void run(true)
  }, [run])

  return { outcome, isRefreshing, refresh }
}

/**
 * Delete the Activity history of a calendar the device no longer holds
 * ("Calendar is removed → delete its Activity rows from SQLite immediately").
 *
 * The edge points THIS way — Activity observes calendar-sources — and not the
 * obvious way, a `pruneToHeldCalendars` call inside
 * `calendar-sources/data`'s removal action. `activity/data/request.ts` imports
 * `@/features/calendar-sources/data`, so the reverse import would close a module
 * require cycle whose failure mode under Metro is a binding that is `undefined`
 * at module-init time — invisible to `tsc`, invisible to lint, dependent on
 * import order. `eslint.config.js`'s `calendar-sources-is-a-leaf` block is what
 * keeps that edge from being added later.
 *
 * THE FIRST-OBSERVATION GUARD IS THE SAFETY ARGUMENT, and it is what makes this
 * call legitimate where the speculative `findAll()` the coordinator refuses
 * (coordinator.ts, NOTE D7) is not. The forbidden read is one that cannot tell
 * an empty device from a read that raced the sources table — and acting on the
 * latter deletes the entire cache. Here an empty set is only ever acted on as
 * the SECOND term of an observed transition from a non-empty loaded set, which
 * is a removal event observed rather than assumed. Remove the first-observation
 * guard below and this becomes precisely that cache-destroying read.
 */
export function useActivityOwnershipPrune(): void {
  const calendars = useUserCalendars()
  const loaded = useUserCalendarsLoaded()
  const previouslyHeldRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    // An unsettled live query reports `[]`, which is indistinguishable from a
    // device holding nothing.
    if (!loaded) {
      return
    }

    // EVERY held row's id, never filtered on `visible`: hiding a calendar is a
    // display preference, and dropping a hidden id would delete that calendar's
    // whole Activity history the first time a student hid it.
    const heldIds = calendars.map((calendar) => calendar.id)
    const heldNow = new Set(heldIds)
    const previouslyHeld = previouslyHeldRef.current
    previouslyHeldRef.current = heldNow

    // The first loaded observation is a baseline, not a transition — whatever it
    // contains, including nothing.
    if (previouslyHeld === null) {
      return
    }

    const removed = [...previouslyHeld].some((id) => !heldNow.has(id))
    if (!removed) {
      return
    }

    // The one consumed operation that CAN reject. `pruneToHeldCalendars` is an
    // async function, so a transaction throw arrives as a rejection; the
    // `void …catch()` idiom (ota-update-runtime.tsx) keeps it inside the effect.
    // Static context, NO payload: no calendar id, name or token reaches a crash
    // report.
    void pruneToHeldCalendars(heldIds).catch((error: unknown) => {
      recordUnknownError(error, PRUNE_CONTEXT)
    })
  }, [calendars, loaded])
}
