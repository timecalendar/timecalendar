export type ExportGuideLocale = "fr" | "en"

export type ExportGuideSelector =
  | Readonly<{ kind: "active" }>
  | Readonly<{ kind: "exact"; catalogueVersion: string }>

export type ExportGuideMimeType = "image/png" | "image/jpeg" | "image/webp"

export interface ExportGuideImage {
  readonly url: string
  readonly mimeType: ExportGuideMimeType
  readonly byteSize: number
  readonly width: number
  readonly height: number
  readonly altText: string
  readonly caption?: string
}

export interface ExportGuidePage {
  readonly title: string
  readonly description: string
  readonly image?: ExportGuideImage
}

export interface ExportGuideProvider {
  readonly slug: string
  readonly label: string
  readonly kind: "pages"
  readonly selectable: boolean
  readonly compatibility: Readonly<{
    minClientSchema: number
    maxClientSchema: number
  }>
  readonly thumbnail?: ExportGuideImage
  readonly pages: readonly ExportGuidePage[]
}

export type ExportGuideProviderRejection =
  | "unknown_kind"
  | "incompatible"
  | "invalid"

export interface ExportGuideCatalogue {
  readonly schemaVersion: 1
  readonly catalogueVersion: string
  readonly locale: ExportGuideLocale
  readonly providers: readonly ExportGuideProvider[]
  readonly rejectedProviders: Readonly<
    Partial<Record<string, ExportGuideProviderRejection>>
  >
}

export type ExportGuideParseFailure =
  | "oversized"
  | "unsupported_schema"
  | "locale_mismatch"
  | "version_mismatch"
  | "invalid_envelope"
  | "invalid_generic"

export type ExportGuideParseResult =
  | Readonly<{ ok: true; catalogue: ExportGuideCatalogue }>
  | Readonly<{ ok: false; failure: ExportGuideParseFailure }>

export type ExportGuideResolutionReason =
  | "exact"
  | "generic"
  | "missing"
  | ExportGuideProviderRejection

export interface ExportGuidePinnedSnapshot {
  readonly locale: ExportGuideLocale
  readonly catalogueVersion: string
  readonly providerSlug: string
  readonly providerLabel: string
  readonly pages: readonly ExportGuidePage[]
  readonly reason: ExportGuideResolutionReason
}

export interface ExportGuideResolution {
  readonly provider: ExportGuideProvider
  readonly snapshot: ExportGuidePinnedSnapshot
  readonly reason: ExportGuideResolutionReason
}

export type ExportGuideLoadFailure =
  | "network"
  | "timeout"
  | "caller_cancelled"
  | "http"
  | "empty"
  | "malformed"
  | "oversized"
  | "unsupported_schema"
  | "invalid_generic"
  | "invalid_envelope"
  | "language_mismatch"
  | "etag_mismatch"
  | "version_mismatch"
  | "storage"

export type ExportGuideLoadOutcome =
  | Readonly<{
      source: "network" | "not_modified"
      catalogue: ExportGuideCatalogue
    }>
  | Readonly<{
      source: "lkg"
      catalogue: ExportGuideCatalogue
      failure: ExportGuideLoadFailure
    }>
  | Readonly<{ source: "none"; failure: ExportGuideLoadFailure }>
