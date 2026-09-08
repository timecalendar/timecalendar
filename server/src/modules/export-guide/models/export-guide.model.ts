export const EXPORT_GUIDE_SCHEMA_VERSION = 1 as const
export const EXPORT_GUIDE_PROVIDER_KIND = "pages" as const
export const EXPORT_GUIDE_LOCALES = ["fr", "en"] as const
export const EXPORT_GUIDE_MAX_BODY_BYTES = 512 * 1024
export const EXPORT_GUIDE_PROVIDER_SLUG_PATTERN_SOURCE =
  "^[a-z0-9][a-z0-9-]{0,63}$"
export const EXPORT_GUIDE_PROVIDER_SLUG_PATTERN = new RegExp(
  EXPORT_GUIDE_PROVIDER_SLUG_PATTERN_SOURCE,
)
export const INITIAL_EXPORT_GUIDE_PROVIDER_SLUGS = [
  "ade",
  "hplanning",
  "celcat",
  "generic",
] as const
export const EXPORT_GUIDE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const
export const EXPORT_GUIDE_IMAGE_MAX_BYTES = {
  thumbnail: 256 * 1024,
  page: 1024 * 1024,
} as const
export const EXPORT_GUIDE_IMAGE_MAX_DIMENSION = 4096
export const EXPORT_GUIDE_IMAGE_MAX_PIXELS = 8 * 1024 * 1024

export type ExportGuideLocale = (typeof EXPORT_GUIDE_LOCALES)[number]
export type ExportGuideMimeType = (typeof EXPORT_GUIDE_MIME_TYPES)[number]
export type ExportGuideImageRole = "thumbnail" | "page"

export type ExportGuideImageV1 = Readonly<{
  url: string
  mimeType: ExportGuideMimeType
  byteSize: number
  width: number
  height: number
  altText: string
  caption?: string
}>

export type ExportGuidePageV1 = Readonly<{
  title: string
  description: string
  image?: ExportGuideImageV1
}>

export type ExportGuideCompatibilityV1 = Readonly<{
  minClientSchema: number
  maxClientSchema: number
}>

export type ExportGuideProviderV1 = Readonly<{
  slug: string
  label: string
  kind: typeof EXPORT_GUIDE_PROVIDER_KIND
  selectable: boolean
  compatibility: ExportGuideCompatibilityV1
  thumbnail?: ExportGuideImageV1
  pages: readonly ExportGuidePageV1[]
}>

export type ExportGuideCatalogueV1 = Readonly<{
  schemaVersion: typeof EXPORT_GUIDE_SCHEMA_VERSION
  catalogueVersion: string
  locale: ExportGuideLocale
  providers: readonly ExportGuideProviderV1[]
}>

export type ExportGuideBundle = Readonly<{
  catalogueVersion: string
  catalogues: Readonly<Record<ExportGuideLocale, ExportGuideCatalogueV1>>
  publishedAt: Date
}>

export type ExportGuideSnapshot = Readonly<{
  activeVersion?: string
  active?: ExportGuideBundle
  retained: ReadonlyMap<string, ExportGuideBundle>
}>
