import { useParsedStoredString } from "@/storage"

import {
  parseGroupValues,
  parseSchoolId,
  type SchoolSelection,
  SELECTION_KEYS,
} from "./types"

// Reactive selection read over the seam's reactive parsed read (so consumers
// re-render when the selection changes), mirroring settings useThemePreference.
// Each read validates the raw string into the typed shape; writes stay on the
// imperative store (one write path — see store.ts). The two reads combine then
// branch on "no school" (schoolId undefined ⇒ no selection).
export function useSelectedSchool(): SchoolSelection | undefined {
  const schoolId = useParsedStoredString(SELECTION_KEYS.schoolId, parseSchoolId)
  const groupValues = useParsedStoredString(
    SELECTION_KEYS.groupValues,
    parseGroupValues,
  )
  if (schoolId === undefined) return undefined
  return { schoolId, groupValues }
}
