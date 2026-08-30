import { useCallback, useState } from "react"

import { useCalendarV1ControllerRenameCalendar } from "@/api/generated/calendars/calendars"
import { recordUnknownError } from "@/firebase"

import { updateName } from "./repository"

// The rename seam (TIM-392) — the ONLY import site of the generated
// `useCalendarV1ControllerRenameCalendar` mutation (B-1, the data/-only-seam
// rule), shaped like useAddCalendar: the hook owns its OWN pending/error state
// across the whole request → local-write chain rather than surfacing only the
// mutation's, because the chain is one user-visible operation.
//
// Flow: PATCH /v1/calendars/{token} { name: trimmed } → CalendarForPublic →
// updateName(id, response.name).
//
// Persisting the RESPONSE's name, not the string the user typed, is the point
// (design D2): the server owns normalization, so echoing its answer makes the
// renaming device converge through the same rule every other device reaches at
// its next sync. Writing the typed value would leave this one installation
// holding a variant nobody else agrees with, and only where normalization bites.
//
// Observability split, mirroring the sync orchestrator: a REQUEST rejection is
// recoverable (offline, a server error, an unknown token — the dialog stays open
// and offers Retry, and nothing local changed) → isError only, NOT recordError.
// A rejected local `updateName` AFTER a successful response is a crash-worthy
// local SQLite write failure → recordUnknownError + isError. The promise rejects
// either way so the dialog can hold its failure state.

export interface UseRenameCalendar {
  rename: (input: { id: string; token: string; name: string }) => Promise<void>
  isPending: boolean
  isError: boolean
  reset: () => void
}

export function useRenameCalendar(): UseRenameCalendar {
  const mutation = useCalendarV1ControllerRenameCalendar()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const rename = useCallback(
    async ({
      id,
      token,
      name,
    }: {
      id: string
      token: string
      name: string
    }): Promise<void> => {
      setIsPending(true)
      setIsError(false)
      try {
        // The rejecting `.catch` (rather than an outer try) keeps the two failure
        // domains apart without hoisting a declaration whose type would drag the
        // generated DTO out of types.ts.
        const calendar = await mutation
          .mutateAsync({ token, data: { name: name.trim() } })
          .catch((error: unknown) => {
            // Recoverable: nothing was written locally, the last-good name stands.
            setIsError(true)
            throw error
          })

        try {
          await updateName(id, calendar.name)
        } catch (error) {
          recordUnknownError(error, "user-calendars/rename")
          setIsError(true)
          throw error
        }
      } finally {
        setIsPending(false)
      }
    },
    [mutation],
  )

  const reset = useCallback((): void => {
    mutation.reset()
    setIsError(false)
    setIsPending(false)
  }, [mutation])

  return { rename, isPending, isError, reset }
}
