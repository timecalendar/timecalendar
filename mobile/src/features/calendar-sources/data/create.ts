import { useCallback } from "react"

import { useCalendarSyncControllerCreateCalendar } from "@/api/generated/calendars/calendars"

// The create-calendar seam (ship 4 / design D2) — the ONLY place in
// calendar-sources that imports the generated Orval hooks (B-1, the data/-only-
// seam rule; mirrors school-selection/data/queries.ts). It wraps the generated
// `useCalendarSyncControllerCreateCalendar` mutation over the single customFetch
// mutator, builds the CreateCalendarDto here (so the screen never touches a
// generated type — B-1), posts to POST /calendars, and resolves
// CreateCalendarRepDto.token. This is a write mutation, NOT added to the
// offline-persist shouldDehydrateQuery set (ADR 013 — only schools/groups reads
// persist).
//
// The institution and programme fields arrive EXPLICITLY from the caller
// (TIM-391 / design D3). The seam does not read the import draft: keeping it a
// parameter leaves data/ pure and provable without a React provider, and makes
// the no-draft direct route a value rather than a branch on context.

// Exactly one of schoolId / schoolName, plus the normalized programme name.
// Declared here (not in onboarding) so the seam owns its own input type and the
// cross-feature edge points onboarding → calendar-sources/data, never the
// reverse through ui/.
export interface CalendarImportFields {
  name: string
  schoolId?: string
  schoolName?: string
}

export interface CreateCalendarResult {
  token: string
}

export interface UseCreateCalendar {
  createCalendar: (
    url: string,
    fields: CalendarImportFields,
  ) => Promise<CreateCalendarResult>
  isPending: boolean
  isError: boolean
  reset: () => void
}

export function useCreateCalendar(): UseCreateCalendar {
  const mutation = useCalendarSyncControllerCreateCalendar()

  const createCalendar = useCallback(
    async (
      url: string,
      fields: CalendarImportFields,
    ): Promise<CreateCalendarResult> => {
      const { token } = await mutation.mutateAsync({
        data: {
          url: url.trim(),
          name: fields.name,
          customData: null,
          // The server validates each with @ValidateIf(other === undefined), so
          // the unused key must not carry a value. The spread-conditional keeps
          // it out of this object; `JSON.stringify` would also drop a
          // present-and-undefined key, so the two forms serialize identically —
          // the spread is the self-documenting one, not the load-bearing one.
          ...(fields.schoolId !== undefined
            ? { schoolId: fields.schoolId }
            : {}),
          ...(fields.schoolName !== undefined
            ? { schoolName: fields.schoolName }
            : {}),
        },
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
