import { useStoredString } from "@/storage"

import {
  parseGroupValues,
  parseSchoolId,
  type SchoolSelection,
  SELECTION_KEYS,
} from "./types"

// Reactive selection read over the seam's useStoredString (so consumers re-render
// when the selection changes), mirroring settings useThemePreference. Reads
// through the reactive seam read + validates the raw strings into the typed shape;
// writes stay on the imperative store (one write path — see store.ts).
export function useSelectedSchool(): SchoolSelection | undefined {
  const schoolId = parseSchoolId(useStoredString(SELECTION_KEYS.schoolId))
  const groupValues = parseGroupValues(
    useStoredString(SELECTION_KEYS.groupValues),
  )
  if (schoolId === undefined) return undefined
  return { schoolId, groupValues }
}
