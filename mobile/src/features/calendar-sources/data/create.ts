import { useCallback } from "react"

import { useCalendarSyncControllerCreateCalendar } from "@/api/generated/calendars/calendars"

// The create-calendar seam (ship 4 / design D2) — the ONLY place in
// calendar-sources that imports the generated Orval hooks (B-1, the data/-only-
// seam rule; mirrors school-selection/data/queries.ts). It wraps the generated
// `useCalendarSyncControllerCreateCalendar` mutation over the single customFetch
// mutator, builds the CreateCalendarDto here (so the screen never touches a
// generated type — B-1), posts { url, customData: null } to POST /calendars, and
// resolves CreateCalendarRepDto.token. schoolId/schoolName/name are omitted (the
// DTO requires only customData; enrichment is deferred to the durable state —
// design Non-Goals). This is a write mutation, NOT added to the offline-persist
// shouldDehydrateQuery set (ADR 013 — only schools/groups reads persist).

export interface CreateCalendarResult {
  token: string
}

export interface UseCreateCalendar {
  createCalendar: (url: string) => Promise<CreateCalendarResult>
  isPending: boolean
  isError: boolean
  reset: () => void
}

export function useCreateCalendar(): UseCreateCalendar {
  const mutation = useCalendarSyncControllerCreateCalendar()

  const createCalendar = useCallback(
    async (url: string): Promise<CreateCalendarResult> => {
      const { token } = await mutation.mutateAsync({
        data: { url: url.trim(), customData: null },
      })
      return { token }
    },
    [mutation],
  )

  return {
    createCalendar,
    isPending: mutation.isPending,
    isError: mutation.isError,
    reset: mutation.reset,
  }
}
