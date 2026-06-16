import { useCallback, useState } from "react"

import { useCalendarSyncControllerSyncCalendars } from "@/api/generated/calendars/calendars"
// The durable token store, by its full @/ path (a cross-feature data→data read
// of the user_calendars identity store — the calendar feature is the legitimate
// consumer of the held subscription tokens). Not a relative import (the ../ ban).
import { findAll as findAllUserCalendars } from "@/features/calendar-sources/data/user-calendars"
import { recordError } from "@/firebase"

import { replaceAll } from "./repository"
import { fromCalendarEventDto } from "./types"

// The sync orchestrator (design D4 / D6) — the ONLY generated-hook import site in
// the calendar feature (B-1, the data/-only-seam rule). It wraps the committed
// `useCalendarSyncControllerSyncCalendars` mutation over the single customFetch
// mutator and owns its OWN { sync, isSyncing, isError, reset } state across the
// full read-tokens → fetch → map → replaceAll chain (mirroring useAddCalendar).
//
// Flow (Flutter parity): read durable user_calendars tokens → if empty, no-op (no
// request) → BATCH POST /calendars/sync { tokens } once → flatten
// calendars.flatMap(c => c.events.map(e => fromCalendarEventDto(e, c.calendar.id)))
// → replaceAll (the transactional drop+replace). The drop+replace runs ONLY after
// a successful fetch, so a failed fetch leaves the last-good rows intact
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
      const events = result.flatMap((calendar) =>
        calendar.events.map((event) =>
          fromCalendarEventDto(event, calendar.calendar.id),
        ),
      )

      // The local replace is a separate failure domain (D6): a throw here is a
      // crash-worthy local-persistence failure, recorded through @/firebase —
      // unlike a fetch rejection, which is recoverable and only flips isError.
      try {
        await replaceAll(events)
      } catch (error) {
        recordError(
          error instanceof Error ? error : new Error(String(error)),
          "calendar/sync",
        )
        setIsError(true)
        return
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
