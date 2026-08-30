import type { CalendarImportFields } from "@/features/calendar-sources/data"

import { useImportDraft } from "./context"
import { type CalendarImportDraft, normalizeImportName } from "./types"

// The ONE derivation from the journey's draft to the calendar-create payload
// (TIM-391 / design D3). Pure and exhaustive over the three draft states, so the
// "exactly one institution field" contract is provable without React:
//
//   listed   → { name, schoolId }    — no schoolName KEY at all
//   unlisted → { name, schoolName }  — no schoolId KEY at all
//   null     → { name: "", schoolName: "" }
//
// Key ABSENCE, not `undefined`, is what matters: the server DTO validates
// `schoolId` with @ValidateIf(o => o.schoolName === undefined) and `schoolName`
// with the mirror condition, so sending both keys fails validation even when one
// is undefined-ish. The spread-conditional below is the mechanism.
//
// The null row is the direct-route contract, not an error: a QR/URL route opened
// by a dev link, an external link, a test or restored navigation has no draft and
// must still create. `schoolName: ""` with no `schoolId` satisfies the server's
// @ValidateIf pair, which is why this needs no server change.
//
// `CalendarImportFields` is imported from the cross-feature `data/` SUB-barrel —
// the same edge settings/data/summary.ts already uses. That sub-barrel does not
// re-export ui/, so this closes no cycle. Importing the top-level
// `@/features/calendar-sources` barrel here WOULD (it re-exports ui/, whose
// screens read this module).
export function toCreateFields(
  draft: CalendarImportDraft | null,
): CalendarImportFields {
  if (draft === null) return { name: "", schoolName: "" }

  const name = normalizeImportName(draft.calendarName)
  return draft.institution.kind === "listed"
    ? { name, schoolId: draft.institution.school.id }
    : { name, schoolName: normalizeImportName(draft.institution.schoolName) }
}

export function useImportCreateFields(): CalendarImportFields {
  return toCreateFields(useImportDraft().draft)
}
