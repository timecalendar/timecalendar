import { useCallback, useEffect, useRef, useState } from "react"

import { calendarControllerFindCalendarByToken } from "@/api/generated/calendars/calendars"
import type { CalendarForPublic } from "@/api/generated/timeCalendar.schemas"
// The sibling create seam, by its full @/ path (not "../create" — the parent-
// relative ban; not the data/ sub-barrel — that would close a barrel cycle since
// data/index re-exports this very sub-module).
import {
  type CalendarImportFields,
  useCreateCalendar,
} from "@/features/calendar-sources/data/create"

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
  addCalendarFromUrl: (
    url: string,
    fields: CalendarImportFields,
  ) => Promise<void>
  isPending: boolean
  isError: boolean
  reset: () => void
}

export function useAddCalendar(): UseAddCalendar {
  const { createCalendar, reset: resetCreate } = useCreateCalendar()
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const mountedRef = useRef(true)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const checkpointRef = useRef<{
    key: string
    url: string
    fields: CalendarImportFields
    token?: string
    dto?: CalendarForPublic
    completed: boolean
  } | null>(null)

  useEffect(
    () => () => {
      mountedRef.current = false
    },
    [],
  )

  const addCalendarFromUrl = useCallback(
    (url: string, fields: CalendarImportFields): Promise<void> => {
      // Exclude a second invocation synchronously, before React can publish a
      // pending render. Retry observes the same promise and cannot overtake it.
      if (inFlightRef.current !== null) return inFlightRef.current

      const normalizedUrl = url.trim()
      const fieldSnapshot = { ...fields }
      const key = JSON.stringify([
        normalizedUrl,
        fieldSnapshot.name,
        fieldSnapshot.schoolId ?? null,
        fieldSnapshot.schoolName ?? null,
      ])
      if (checkpointRef.current?.key !== key) {
        checkpointRef.current = {
          key,
          url: normalizedUrl,
          fields: fieldSnapshot,
          completed: false,
        }
      }
      const checkpoint = checkpointRef.current
      if (checkpoint.completed) return Promise.resolve()

      if (mountedRef.current) {
        setIsPending(true)
        setIsError(false)
      }

      const operation = Promise.resolve().then(async () => {
        try {
          if (checkpoint.token === undefined) {
            const created = await createCalendar(
              checkpoint.url,
              checkpoint.fields,
            )
            checkpoint.token = created.token
          }
          if (checkpoint.dto === undefined) {
            checkpoint.dto = await calendarControllerFindCalendarByToken(
              checkpoint.token,
            )
          }
          await upsert(fromCalendarForPublic(checkpoint.dto))
          checkpoint.completed = true
        } catch (error) {
          if (mountedRef.current) setIsError(true)
          throw error
        } finally {
          inFlightRef.current = null
          if (mountedRef.current) setIsPending(false)
        }
      })
      inFlightRef.current = operation
      return operation
    },
    [createCalendar],
  )

  const reset = useCallback((): void => {
    checkpointRef.current = null
    resetCreate()
    if (mountedRef.current) {
      setIsError(false)
      setIsPending(false)
    }
  }, [resetCreate])

  return { addCalendarFromUrl, isPending, isError, reset }
}
