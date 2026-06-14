// The persisted school selection (design D4) — stored through @/storage,
// mirroring src/features/settings/prefs. Only the selection IDENTITY is
// persisted: the selected schoolId and the selected group value(s). The full
// DTOs live in the query cache (and the persister restores them), so duplicating
// them here would be redundant state that can desync (R-2).
//
// A read is TOTAL: an unset or corrupt stored value reads as "no selection"
// rather than throwing — the parsers below own that. Onboarding-complete is
// DERIVED from whether a selection exists; no separate completion flag (D4).

// The selected school id (a string) and the selected group value(s). The group
// selection is the chosen group `value`(s) — SchoolGroupItem is a tree and a
// selection is a leaf/path; the store persists the value(s), not the DTO.
export interface SchoolSelection {
  schoolId: string
  groupValues: string[]
}

// Flat namespaced storage keys (the i18n flat-key convention applied to storage
// for greppability — the string in code is the string in the store).
export const SELECTION_KEYS = {
  schoolId: "schoolSelection.schoolId",
  groupValues: "schoolSelection.groupValues",
} as const

// Total parser for the persisted schoolId: a non-empty string is the selection,
// anything else (unset / empty) → undefined ("no school").
export function parseSchoolId(raw: string | undefined): string | undefined {
  return raw !== undefined && raw.length > 0 ? raw : undefined
}

// Total parser for the persisted group values: a JSON-encoded array of strings.
// An unset, non-JSON, or non-string-array value → [] (no group). The store owns
// the JSON encode/parse + validation — the one place it lives (D4).
export function parseGroupValues(raw: string | undefined): string[] {
  if (raw === undefined) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
      return parsed
    }
    return []
  } catch {
    return []
  }
}

export function encodeGroupValues(values: string[]): string {
  return JSON.stringify(values)
}
