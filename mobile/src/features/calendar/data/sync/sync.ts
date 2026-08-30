import { useCallback, useState } from "react"

import { useCalendarSyncControllerSyncCalendars } from "@/api/generated/calendars/calendars"
// The Activity refresh seam, through the FEATURE barrel (ADR 049 / D2) — that is
// what `@/features/activity` re-exports it for. The deep calendar-sources import
// just below is not a competing convention: it is deep only because that
// feature's barrel does not re-export `findAll`.
import { refreshNewestPage } from "@/features/activity"
// The durable token store, by its full @/ path (a cross-feature data→data read
// of the user_calendars identity store — the calendar feature is the legitimate
// consumer of the held subscription tokens). Not a relative import (the ../ ban).
import {
  findAll as findAllUserCalendars,
  updateName as updateUserCalendarName,
} from "@/features/calendar-sources/data/user-calendars"
import { recordUnknownError } from "@/firebase"

import { replaceAll } from "./repository"
import { dtoToRow } from "./types"

// The sync orchestrator (design D4 / D6) — the ONLY generated-hook import site in
// the calendar feature (B-1, the data/-only-seam rule). It wraps the committed
// `useCalendarSyncControllerSyncCalendars` mutation over the single customFetch
// mutator and owns its OWN { sync, isSyncing, isError, reset } state across the
// full read-tokens → fetch → map → replaceAll chain (mirroring useAddCalendar).
//
// Flow (Flutter parity): read durable user_calendars tokens → if empty, no-op (no
// request) → BATCH POST /calendars/sync { tokens } once → flatten the DTOs to
// VERBATIM rows: calendars.flatMap(c => c.events.map(e => dtoToRow(e, c.calendar.id)))
// → replaceAll (the transactional drop+replace, taking rows). Writing rows (not
// domain events) keeps the live path byte-identical in fidelity to the Phase-09
// importer's direct-row write — no data loss (ADR 021 / D1). The drop+replace runs
// ONLY after a successful fetch, so a failed fetch leaves the last-good rows intact
// (offline-safe by construction).
//
// Observability split (ADR 021 / D6): a FETCH rejection is a recoverable transient
// condition (the last-good rows still render, the user can retry) → isError ONLY,
// NOT recordError (mirroring the school-selection read path). A replaceAll
// TRANSACTION throw is a crash-worthy LOCAL SQLite write failure → recordError +
// isError. The orchestrator distinguishes the two by where the chain throws.

export interface UseSyncCalendars {
  sync: () => Promise<void>
  isSyncing: boolean
  isError: boolean
  reset: () => void
}

export function useSyncCalendars(): UseSyncCalendars {
  const mutation = useCalendarSyncControllerSyncCalendars()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isError, setIsError] = useState(false)

  const sync = useCallback(async (): Promise<void> => {
    setIsSyncing(true)
    setIsError(false)
    try {
      const calendars = await findAllUserCalendars()
      const tokens = calendars.map((calendar) => calendar.token)
      if (tokens.length === 0) {
        // Flutter parity: no held calendars → no sync request.
        return
      }

      const result = await mutation.mutateAsync({ data: { tokens } })

      // Mapping + the local replace share a failure domain (D6): a throw here is
      // a crash-worthy LOCAL failure (a malformed DTO the verbatim mapper can't
      // shape, or a SQLite write failure), recorded through @/firebase — unlike a
      // fetch rejection, which is recoverable and only flips isError. dtoToRow
      // runs inside this branch (not before it) so a mapping throw is recorded,
      // not silently mis-bucketed as a transient fetch failure.
      try {
        const rows = result.flatMap((calendar) =>
          calendar.events.map((event) => dtoToRow(event, calendar.calendar.id)),
        )
        await replaceAll(rows)
      } catch (error) {
        recordUnknownError(error, "calendar/sync")
        setIsError(true)
        return
      }

      // Activity (TIM-399 / ADR 049 D3): the events are committed, so the
      // calendar-log history behind them is stale — refresh it, forced.
      //
      // Placed HERE, not elsewhere, and all three properties are load-bearing:
      //  - AFTER the event write, BEFORE name convergence. The spec's trigger is
      //    "after event storage succeeds"; name convergence is a deliberately
      //    separate failure domain below, and hanging Activity behind it would
      //    suppress the refresh whenever a name write throws.
      //  - UNAWAITED. `sync()` holds `isSyncing` for its whole body, so awaiting
      //    would keep the calendar's spinner open on an unrelated request.
      //  - NO `try`/`catch` and NO `.catch()`. `refreshNewestPage` never rejects
      //    (TIM-397 D11), so there is nothing to swallow and a catch would be
      //    dead code implying otherwise. This is the mechanism behind "a
      //    calendar-sync success is never turned into a failure by an Activity
      //    failure": a `{ status: "failed" }` outcome is not a sync failure, and
      //    the caller neither reads it nor can propagate a rejection there is
      //    none of — so it structurally cannot reach `setIsError`.
      //
      // Unreachable on the two non-success paths above, which is the whole
      // point: the zero-token branch returns before this line, and a `replaceAll`
      // throw returns from its own catch.
      void refreshNewestPage({ force: true })

      // Name convergence (TIM-392) — a SEPARATE failure domain, deliberately not
      // folded into the replace above: the events are the payload the user came
      // for and must stay committed even if this metadata write fails, and a
      // failure here must not be mis-bucketed under "calendar/sync".
      //
      // The write is the NARROW updateName, never an upsert and never through
      // fromCalendarForPublic — that mapper hard-codes `visible: true` (a
      // client-only field absent from the DTO), so a full-row write would
      // silently unhide every calendar the student hid, on every sync, i.e. at
      // every app start. Only names that actually differ from the snapshot read
      // at the top of sync() are written, so a steady-state sync writes nothing.
      try {
        const localNames = new Map(
          calendars.map((calendar) => [calendar.id, calendar.name]),
        )
        for (const { calendar } of result) {
          if (localNames.get(calendar.id) !== calendar.name) {
            await updateUserCalendarName(calendar.id, calendar.name)
          }
        }
      } catch (error) {
        // The replaced events stay committed and the last-good local names
        // stand; the next successful sync retries the convergence.
        recordUnknownError(error, "calendar/sync-names")
        setIsError(true)
      }
    } catch {
      // A read-tokens or fetch failure: recoverable, NOT recorded.
      setIsError(true)
    } finally {
      setIsSyncing(false)
    }
  }, [mutation])

  const reset = useCallback((): void => {
    mutation.reset()
    setIsError(false)
    setIsSyncing(false)
  }, [mutation])

  return { sync, isSyncing, isError, reset }
}
