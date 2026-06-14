import { getString, remove, setString } from "@/storage"

import {
  encodeGroupValues,
  parseGroupValues,
  parseSchoolId,
  type SchoolSelection,
  SELECTION_KEYS,
} from "./types"

// Imperative get/set for the school selection over the @/storage seam, mirroring
// settings/prefs/store.ts: pure, total reads. The reactive read lives in hooks.ts.

// The current selection, or undefined if no school is selected. Total: an
// unset/corrupt store reads as "no selection".
export function getSelection(): SchoolSelection | undefined {
  const schoolId = parseSchoolId(getString(SELECTION_KEYS.schoolId))
  if (schoolId === undefined) return undefined
  return {
    schoolId,
    groupValues: parseGroupValues(getString(SELECTION_KEYS.groupValues)),
  }
}

// Select a school. Resets the group selection (a new school's groups differ).
export function selectSchool(schoolId: string): void {
  setString(SELECTION_KEYS.schoolId, schoolId)
  remove(SELECTION_KEYS.groupValues)
}

// Select the group value(s) within the already-selected school.
export function selectGroup(values: string[]): void {
  setString(SELECTION_KEYS.groupValues, encodeGroupValues(values))
}

export function clearSelection(): void {
  remove(SELECTION_KEYS.schoolId)
  remove(SELECTION_KEYS.groupValues)
}

// Onboarding-complete is DERIVED from the selection's existence — no separate
// flag (D4). "Complete" = a school is selected. (Group requirement is a per-
// school concern owned by the future calendar/home gate — D3 deferral; for the
// read path, a selected school is the signal.)
export function hasSelection(): boolean {
  return getSelection() !== undefined
}

export function isOnboardingComplete(): boolean {
  return hasSelection()
}
