import { useCallback, useState } from "react"

import { calendarControllerFindCalendarByToken } from "@/api/generated/calendars/calendars"
// The sibling create seam, by its full @/ path (not "../create" — the parent-
// relative ban; not the data/ sub-barrel — that would close a barrel cycle since
// data/index re-exports this very sub-module).
import { useCreateCalendar } from "@/features/calendar-sources/data/create"

import { upsert } from "./repository"
import { fromCalendarForPublic } from "./types"

// The SHARED persist seam (design D6) — the ONE persistence code path both the QR
// scan and the iCal-URL screens use to durably store an added calendar. The flow
// is token → resolve → upsert:
//   POST /calendars { url }                 → { token }  (the create seam)
//   GET  /calendars/by-token/{token}        → CalendarForPublic  (resolve metadata)
//   fromCalendarForPublic(dto)              → domain UserCalendar
//   upsert(calendar)                        → durable user_calendars row (by id)
//
// It lives in data/ and keeps the generated-hook + generated-resolve calls inside
// data/ (B-1, the data/-only-seam rule). The full chain (create → resolve →
// upsert) is one operation, so the hook owns its OWN pending/error state rather
// than surfacing only the POST mutation's — `isPending` stays true across the
// resolve + upsert, and `isError` reflects a failure at ANY step (writes CAN
// fail, unlike the infallible ephemeral holder this replaces). The promise still
// rejects so the screen records via @/firebase + surfaces an accessible failure.

export interface UseAddCalendar {
  addCalendarFromUrl: (url: string) => Promise<void>
  isPending: boolean
  isError: boolean
  reset: () => void
}

export function useAddCalendar(): UseAddCalendar {
  const { createCalendar, reset: resetCreate } = useCreateCalendar()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)

  const addCalendarFromUrl = useCallback(
    async (url: string): Promise<void> => {
      setIsPending(true)
      setIsError(false)
      try {
        const { token } = await createCalendar(url)
        const dto = await calendarControllerFindCalendarByToken(token)
        await upsert(fromCalendarForPublic(dto))
      } catch (error) {
        setIsError(true)
        throw error
      } finally {
        setIsPending(false)
      }
    },
    [createCalendar],
  )

  const reset = useCallback((): void => {
    resetCreate()
    setIsError(false)
    setIsPending(false)
  }, [resetCreate])

  return { addCalendarFromUrl, isPending, isError, reset }
}
