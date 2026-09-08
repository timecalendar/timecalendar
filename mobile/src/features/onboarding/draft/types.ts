import type {
  ExportGuideCatalogue,
  ExportGuideLoadFailure,
  ExportGuideLocale,
  ExportGuidePinnedSnapshot,
  ExportGuideProvider,
  ExportGuideSelector,
} from "@/features/export-guides/data"
import type { SchoolListItem } from "@/features/school-selection/data"

export type ImportInstitution =
  | { readonly kind: "listed"; readonly school: SchoolListItem }
  | { readonly kind: "unlisted"; readonly schoolName: string }

export interface CalendarImportDraft {
  readonly institution: ImportInstitution
  readonly calendarName: string
}

interface JourneyIdentity {
  readonly draft: CalendarImportDraft
  readonly draftRevision: number
}

export type ImportJourneyState =
  | Readonly<{ phase: "empty"; draftRevision: number }>
  | (JourneyIdentity & Readonly<{ phase: "draft" }>)
  | (JourneyIdentity &
      Readonly<{
        phase: "resolving"
        locale: ExportGuideLocale
        selector: ExportGuideSelector
        attempt: number
      }>)
  | (JourneyIdentity &
      Readonly<{
        phase: "selecting-provider"
        locale: ExportGuideLocale
        catalogue: ExportGuideCatalogue
        providers: readonly ExportGuideProvider[]
      }>)
  | (JourneyIdentity &
      Readonly<{
        phase: "blocked"
        locale: ExportGuideLocale
        selector: ExportGuideSelector
        failure: ExportGuideLoadFailure
        attempt: number
      }>)
  | (JourneyIdentity &
      Readonly<{
        phase: "guide"
        snapshot: ExportGuidePinnedSnapshot
        visitedThrough: number
        selectionCatalogue?: ExportGuideCatalogue
        selectionProviders?: readonly ExportGuideProvider[]
      }>)
  | (JourneyIdentity &
      Readonly<{
        phase: "completed"
        snapshot: ExportGuidePinnedSnapshot
        visitedThrough: number
        manualHandoff: "none" | "qr" | "ical"
        selectionCatalogue?: ExportGuideCatalogue
        selectionProviders?: readonly ExportGuideProvider[]
        developmentSeeded?: true
      }>)

export const initialImportJourneyState = (): ImportJourneyState => ({
  phase: "empty",
  draftRevision: 0,
})

export const NAME_MAX_LENGTH = 100

export function normalizeImportName(raw: string): string {
  return raw.trim()
}

export function isImportNameWithinLimit(raw: string): boolean {
  return normalizeImportName(raw).length <= NAME_MAX_LENGTH
}

export type SafeIntranetDecision =
  | Readonly<{ kind: "safe"; url: string }>
  | Readonly<{ kind: "missing" }>
  | Readonly<{ kind: "unsafe" }>

export function decideIntranetUrl(
  raw: string | null | undefined,
): SafeIntranetDecision {
  const candidate = raw?.trim() ?? ""
  if (candidate === "") return { kind: "missing" }
  try {
    const { protocol } = new URL(candidate)
    if (protocol !== "http:" && protocol !== "https:") {
      return { kind: "unsafe" }
    }
  } catch {
    return { kind: "unsafe" }
  }
  return { kind: "safe", url: candidate }
}

export function safeIntranetUrl(raw: string | null | undefined): string | null {
  const decision = decideIntranetUrl(raw)
  return decision.kind === "safe" ? decision.url : null
}
