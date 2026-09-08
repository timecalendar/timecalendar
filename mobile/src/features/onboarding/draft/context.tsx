import { createContext, type ReactNode, useContext, useReducer } from "react"

import { isDevVariant } from "@/config/variant"
import type { ExportGuidePinnedSnapshot } from "@/features/export-guides/data"
import type { SchoolListItem } from "@/features/school-selection/data"

import { type ImportJourneyAction, importJourneyReducer } from "./reducer"
import {
  type CalendarImportDraft,
  type ImportJourneyState,
  initialImportJourneyState,
} from "./types"

export interface ImportDraftValue {
  readonly state: ImportJourneyState
  readonly draft: CalendarImportDraft | null
  readonly dispatch: (action: ImportJourneyAction) => void
  readonly setListedInstitution: (school: SchoolListItem) => void
  readonly setUnlistedInstitution: (schoolName: string) => void
  readonly setCalendarName: (name: string) => void
  readonly clearDraft: () => void
  readonly seedDevelopmentCompletion: (
    draft: CalendarImportDraft,
    snapshot: ExportGuidePinnedSnapshot,
  ) => boolean
}

const noop = () => undefined
const NO_DRAFT: ImportDraftValue = {
  state: initialImportJourneyState(),
  draft: null,
  dispatch: noop,
  setListedInstitution: noop,
  setUnlistedInstitution: noop,
  setCalendarName: noop,
  clearDraft: noop,
  seedDevelopmentCompletion: () => false,
}

const ImportDraftContext = createContext<ImportDraftValue>(NO_DRAFT)

export function ImportDraftProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    importJourneyReducer,
    undefined,
    initialImportJourneyState,
  )
  const setListedInstitution = (school: SchoolListItem) =>
    dispatch({ type: "set-listed", school })
  const setUnlistedInstitution = (schoolName: string) =>
    dispatch({ type: "set-unlisted", schoolName })
  const setCalendarName = (name: string) =>
    dispatch({ type: "set-calendar-name", name })
  const clearDraft = () => dispatch({ type: "clear" })
  const seedDevelopmentCompletion = (
    draft: CalendarImportDraft,
    snapshot: ExportGuidePinnedSnapshot,
  ) => {
    if (!isDevVariant() || snapshot.pages.length === 0) return false
    dispatch({ type: "seed-development-completion", draft, snapshot })
    return true
  }
  const value = {
    state,
    draft: state.phase === "empty" ? null : state.draft,
    dispatch,
    setListedInstitution,
    setUnlistedInstitution,
    setCalendarName,
    clearDraft,
    seedDevelopmentCompletion,
  }
  return (
    <ImportDraftContext.Provider value={value}>
      {children}
    </ImportDraftContext.Provider>
  )
}

export function useImportDraft(): ImportDraftValue {
  return useContext(ImportDraftContext)
}
