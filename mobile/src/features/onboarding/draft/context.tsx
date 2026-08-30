import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import type { SchoolListItem } from "@/features/school-selection/data"

import { type CalendarImportDraft, normalizeImportName } from "./types"

// The ephemeral import draft (TIM-391 / ADR 045, design D1) — ONE in-memory
// draft for the institution → programme → Connect → import journey, held in
// React state behind a context mounted once on the onboarding Stack layout.
//
// Deliberately NOT MMKV and NOT SQLite. A durable "selected school" is the exact
// failure the tech spec's risk table calls out: a URL import weeks later would be
// attributed to a school the student is no longer importing from. Mounting the
// provider on the Stack layout buys the required lifetime structurally — the
// provider unmounts when the Stack is dismissed, so "leaving the journey clears
// it" and "an app restart clears it" are properties of where it lives, not code
// anyone has to remember to write.

export interface ImportDraftValue {
  draft: CalendarImportDraft | null
  setListedInstitution: (school: SchoolListItem) => void
  setUnlistedInstitution: (schoolName: string) => void
  setCalendarName: (name: string) => void
  clearDraft: () => void
}

const noop = () => undefined

// The out-of-provider value. `useImportDraft()` is TOTAL by design (design D1
// consequence): the QR and iCal-URL routes are legal direct entry points (dev
// links, external links, restored navigation), and "no draft" is their contract,
// not an error. Throwing on a missing provider would turn a supported route into
// a crash.
const NO_DRAFT: ImportDraftValue = {
  draft: null,
  setListedInstitution: noop,
  setUnlistedInstitution: noop,
  setCalendarName: noop,
  clearDraft: noop,
}

const ImportDraftContext = createContext<ImportDraftValue>(NO_DRAFT)

export function ImportDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CalendarImportDraft | null>(null)

  const setListedInstitution = useCallback((school: SchoolListItem) => {
    // Picking an institution restarts the journey's naming: keeping a programme
    // name typed for a different school would silently mislabel the import.
    setDraft({ institution: { kind: "listed", school }, calendarName: "" })
  }, [])

  const setUnlistedInstitution = useCallback((schoolName: string) => {
    setDraft({
      institution: {
        kind: "unlisted",
        schoolName: normalizeImportName(schoolName),
      },
      calendarName: "",
    })
  }, [])

  // Total on a missing institution: the programme step is only reachable through
  // one of the two institution steps, so an absent draft here means the route was
  // opened directly — there is nothing to name, and inventing an institution
  // would be worse than storing nothing.
  const setCalendarName = useCallback((name: string) => {
    setDraft((current) =>
      current === null
        ? current
        : { ...current, calendarName: normalizeImportName(name) },
    )
  }, [])

  const clearDraft = useCallback(() => setDraft(null), [])

  const value = useMemo(
    () => ({
      draft,
      setListedInstitution,
      setUnlistedInstitution,
      setCalendarName,
      clearDraft,
    }),
    [
      draft,
      setListedInstitution,
      setUnlistedInstitution,
      setCalendarName,
      clearDraft,
    ],
  )

  return (
    <ImportDraftContext.Provider value={value}>
      {children}
    </ImportDraftContext.Provider>
  )
}

export function useImportDraft(): ImportDraftValue {
  return useContext(ImportDraftContext)
}
