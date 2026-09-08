import { isDevVariant } from "@/config/variant"
import type {
  ExportGuideCatalogue,
  ExportGuideLoadFailure,
  ExportGuideLocale,
  ExportGuidePinnedSnapshot,
  ExportGuideProvider,
  ExportGuideSelector,
} from "@/features/export-guides/data"
import type { SchoolListItem } from "@/features/school-selection/data"

import {
  type CalendarImportDraft,
  type ImportJourneyState,
  initialImportJourneyState,
  normalizeImportName,
} from "./types"

export type ImportJourneyAction =
  | Readonly<{ type: "set-listed"; school: SchoolListItem }>
  | Readonly<{ type: "set-unlisted"; schoolName: string }>
  | Readonly<{ type: "set-calendar-name"; name: string }>
  | Readonly<{ type: "complete-connect" }>
  | Readonly<{
      type: "start-resolution"
      locale: ExportGuideLocale
      selector: ExportGuideSelector
      attempt: number
    }>
  | Readonly<{
      type: "show-provider-selection"
      locale: ExportGuideLocale
      catalogue: ExportGuideCatalogue
      providers: readonly ExportGuideProvider[]
      draftRevision: number
    }>
  | Readonly<{
      type: "block"
      locale: ExportGuideLocale
      selector: ExportGuideSelector
      failure: ExportGuideLoadFailure
      attempt: number
      draftRevision: number
    }>
  | Readonly<{
      type: "start-guide"
      snapshot: ExportGuidePinnedSnapshot
      draftRevision: number
    }>
  | Readonly<{ type: "visit-page"; pageIndex: number }>
  | Readonly<{ type: "complete-guide"; pageIndex: number }>
  | Readonly<{ type: "set-manual-handoff"; target: "qr" | "ical" }>
  | Readonly<{ type: "invalidate-guide" }>
  | Readonly<{
      type: "seed-development-completion"
      draft: CalendarImportDraft
      snapshot: ExportGuidePinnedSnapshot
    }>
  | Readonly<{ type: "clear" }>

export function importJourneyReducer(
  state: ImportJourneyState,
  action: ImportJourneyAction,
): ImportJourneyState {
  switch (action.type) {
    case "set-listed":
      return {
        phase: "draft",
        draftRevision: state.draftRevision + 1,
        gateProgress: action.school.exportGuide.requireProgramme
          ? "institution"
          : "programme",
        draft: {
          institution: { kind: "listed", school: action.school },
          calendarName: "",
        },
      }
    case "set-unlisted":
      return {
        phase: "draft",
        draftRevision: state.draftRevision + 1,
        gateProgress: "institution",
        draft: {
          institution: {
            kind: "unlisted",
            schoolName: normalizeImportName(action.schoolName),
          },
          calendarName: "",
        },
      }
    case "set-calendar-name":
      if (state.phase === "empty") return state
      return {
        phase: "draft",
        draftRevision: state.draftRevision + 1,
        gateProgress: "programme",
        draft: {
          ...state.draft,
          calendarName: normalizeImportName(action.name),
        },
      }
    case "complete-connect":
      if (state.phase === "empty") return state
      return { ...state, gateProgress: "connect" }
    case "start-resolution":
      if (state.phase === "empty") return state
      return {
        phase: "resolving",
        draft: state.draft,
        draftRevision: state.draftRevision,
        gateProgress: state.gateProgress,
        locale: action.locale,
        selector: action.selector,
        attempt: action.attempt,
      }
    case "show-provider-selection":
      if (
        state.phase === "empty" ||
        state.draftRevision !== action.draftRevision
      )
        return state
      return {
        phase: "selecting-provider",
        draft: state.draft,
        draftRevision: state.draftRevision,
        gateProgress: state.gateProgress,
        locale: action.locale,
        catalogue: action.catalogue,
        providers: action.providers,
      }
    case "block":
      if (
        state.phase === "empty" ||
        state.draftRevision !== action.draftRevision
      )
        return state
      return {
        phase: "blocked",
        draft: state.draft,
        draftRevision: state.draftRevision,
        gateProgress: state.gateProgress,
        locale: action.locale,
        selector: action.selector,
        failure: action.failure,
        attempt: action.attempt,
      }
    case "start-guide":
      if (
        state.phase === "empty" ||
        state.draftRevision !== action.draftRevision ||
        action.snapshot.pages.length === 0
      )
        return state
      return {
        phase: "guide",
        draft: state.draft,
        draftRevision: state.draftRevision,
        gateProgress: state.gateProgress,
        snapshot: action.snapshot,
        visitedThrough: 0,
        ...(state.phase === "selecting-provider"
          ? {
              selectionCatalogue: state.catalogue,
              selectionProviders: state.providers,
            }
          : (state.phase === "guide" || state.phase === "completed") &&
              state.selectionCatalogue !== undefined &&
              state.selectionProviders !== undefined
            ? {
                selectionCatalogue: state.selectionCatalogue,
                selectionProviders: state.selectionProviders,
              }
            : {}),
      }
    case "visit-page":
      if (
        state.phase !== "guide" ||
        action.pageIndex !== state.visitedThrough + 1 ||
        action.pageIndex >= state.snapshot.pages.length
      )
        return state
      return { ...state, visitedThrough: action.pageIndex }
    case "complete-guide":
      if (
        state.phase !== "guide" ||
        action.pageIndex !== state.visitedThrough ||
        action.pageIndex !== state.snapshot.pages.length - 1
      )
        return state
      return { ...state, phase: "completed", manualHandoff: "none" }
    case "set-manual-handoff":
      return state.phase === "completed"
        ? { ...state, manualHandoff: action.target }
        : state
    case "invalidate-guide":
      if (state.phase === "empty" || state.phase === "draft") return state
      return {
        phase: "draft",
        draft: state.draft,
        draftRevision: state.draftRevision + 1,
        gateProgress: state.gateProgress,
      }
    case "seed-development-completion":
      if (!isDevVariant() || action.snapshot.pages.length === 0) return state
      return {
        phase: "completed",
        draft: action.draft,
        draftRevision: state.draftRevision + 1,
        gateProgress: "connect",
        snapshot: action.snapshot,
        visitedThrough: action.snapshot.pages.length - 1,
        manualHandoff: "none",
        developmentSeeded: true,
      }
    case "clear":
      return initialImportJourneyState()
  }
}
