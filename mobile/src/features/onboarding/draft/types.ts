import type { SchoolListItem } from "@/features/school-selection/data"

// The import journey's draft shape and its pure normalizers (TIM-391 / design
// D1, D2, D5, D6). Pure module: no React, no storage, no generated types — the
// institution carries the DOMAIN SchoolListItem projection, never a generated
// SchoolForList, so ui/ can read the draft without crossing the data/-only
// generated-import boundary (B-1).

export type ImportInstitution =
  | { kind: "listed"; school: SchoolListItem }
  | { kind: "unlisted"; schoolName: string }

export interface CalendarImportDraft {
  institution: ImportInstitution
  calendarName: string
}

// The server caps CreateCalendarDto.name at 100 (@MaxLength(100), measured in JS
// string units). Matching it here means the client and the server agree on the
// boundary instead of the student discovering it as a 400.
export const NAME_MAX_LENGTH = 100

// Trim only: accents, non-Latin scripts and emoji are accepted verbatim. Applied
// before validation AND before storage, so the draft never holds padding and the
// length the screen measures is the length the server measures.
export function normalizeImportName(raw: string): string {
  return raw.trim()
}

export function isImportNameWithinLimit(raw: string): boolean {
  return normalizeImportName(raw).length <= NAME_MAX_LENGTH
}

// The one gate on opening an institution's site (design D6). Only http:/https:
// may be handed to the browser — a `javascript:`/`file:`/`intent:` value from the
// schools API must render NO link rather than be opened. Total: anything absent,
// blank or unparseable yields null.
export function safeIntranetUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const candidate = raw.trim()
  if (candidate === "") return null
  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    // A bare hostname ("univ-eiffel.fr") has no scheme to trust — no link.
    return null
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
  return candidate
}
