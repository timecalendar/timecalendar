import { Injectable } from "@nestjs/common"
import {
  EXPORT_GUIDE_LOCALES,
  EXPORT_GUIDE_MAX_BODY_BYTES,
  EXPORT_GUIDE_MIME_TYPES,
  EXPORT_GUIDE_IMAGE_MAX_BYTES,
  EXPORT_GUIDE_IMAGE_MAX_DIMENSION,
  EXPORT_GUIDE_IMAGE_MAX_PIXELS,
  EXPORT_GUIDE_PROVIDER_KIND,
  EXPORT_GUIDE_PROVIDER_SLUG_PATTERN,
  EXPORT_GUIDE_SCHEMA_VERSION,
  INITIAL_EXPORT_GUIDE_PROVIDER_SLUGS,
  ExportGuideCatalogueV1,
  ExportGuideImageRole,
  ExportGuideImageV1,
  ExportGuideLocale,
  ExportGuidePageV1,
  ExportGuideProviderV1,
} from "modules/export-guide/models/export-guide.model"
import { ExportGuideValidationError } from "modules/export-guide/validation/export-guide-validation.error"

const ASCII = /^[\x20-\x7e]+$/

const fail = (code: string): never => {
  throw new ExportGuideValidationError(code)
}

const object = (value: unknown, code: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return fail(code)
  return value as Record<string, unknown>
}

const trimmed = (value: unknown, min: number, max: number, code: string) => {
  if (
    typeof value !== "string" ||
    value.length < min ||
    value.length > max ||
    value.trim() !== value
  )
    return fail(code)
  return value
}

const integer = (value: unknown, min: number, max: number, code: string) => {
  if (
    !Number.isInteger(value) ||
    (value as number) < min ||
    (value as number) > max
  )
    return fail(code)
  return value as number
}

const optionalImage = (
  value: unknown,
  role: ExportGuideImageRole,
): ExportGuideImageV1 | undefined => {
  if (value === undefined) return undefined
  const raw = object(value, "image_object")
  const url = trimmed(raw.url, 1, 2048, "image_url")
  if (!EXPORT_GUIDE_MIME_TYPES.includes(raw.mimeType as never))
    fail("image_mime")
  const byteSize = integer(
    raw.byteSize,
    1,
    EXPORT_GUIDE_IMAGE_MAX_BYTES[role],
    "image_bytes",
  )
  const width = integer(
    raw.width,
    1,
    EXPORT_GUIDE_IMAGE_MAX_DIMENSION,
    "image_width",
  )
  const height = integer(
    raw.height,
    1,
    EXPORT_GUIDE_IMAGE_MAX_DIMENSION,
    "image_height",
  )
  if (width * height > EXPORT_GUIDE_IMAGE_MAX_PIXELS) fail("image_pixels")
  const altText = trimmed(raw.altText, 1, 500, "image_alt")
  const caption =
    raw.caption === undefined
      ? undefined
      : trimmed(raw.caption, 1, 500, "image_caption")
  return {
    url,
    mimeType: raw.mimeType as ExportGuideImageV1["mimeType"],
    byteSize,
    width,
    height,
    altText,
    ...(caption === undefined ? {} : { caption }),
  }
}

const page = (value: unknown): ExportGuidePageV1 => {
  const raw = object(value, "page_object")
  const image = optionalImage(raw.image, "page")
  return {
    title: trimmed(raw.title, 1, 120, "page_title"),
    description: trimmed(raw.description, 1, 2000, "page_description"),
    ...(image === undefined ? {} : { image }),
  }
}

const provider = (value: unknown): ExportGuideProviderV1 => {
  const raw = object(value, "provider_object")
  const slug = trimmed(raw.slug, 1, 64, "provider_slug")
  if (!EXPORT_GUIDE_PROVIDER_SLUG_PATTERN.test(slug)) fail("provider_slug")
  if (raw.kind !== EXPORT_GUIDE_PROVIDER_KIND) fail("provider_kind")
  if (typeof raw.selectable !== "boolean") fail("provider_selectable")
  const selectable = raw.selectable as boolean
  const compatibility = object(raw.compatibility, "compatibility_object")
  const minClientSchema = integer(
    compatibility.minClientSchema,
    1,
    Number.MAX_SAFE_INTEGER,
    "compatibility_min",
  )
  const maxClientSchema = integer(
    compatibility.maxClientSchema,
    1,
    Number.MAX_SAFE_INTEGER,
    "compatibility_max",
  )
  if (minClientSchema > maxClientSchema) fail("compatibility_order")
  if (
    !Array.isArray(raw.pages) ||
    raw.pages.length < 1 ||
    raw.pages.length > 20
  )
    fail("provider_pages")
  const pages = raw.pages as unknown[]
  const thumbnail = optionalImage(raw.thumbnail, "thumbnail")
  return {
    slug,
    label: trimmed(raw.label, 1, 80, "provider_label"),
    kind: EXPORT_GUIDE_PROVIDER_KIND,
    selectable,
    compatibility: { minClientSchema, maxClientSchema },
    ...(thumbnail === undefined ? {} : { thumbnail }),
    pages: pages.map(page),
  }
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }
  return value
}

@Injectable()
export class ExportGuideCatalogueValidator {
  validate(value: unknown): ExportGuideCatalogueV1 {
    const raw = object(value, "catalogue_object")
    if (raw.schemaVersion !== EXPORT_GUIDE_SCHEMA_VERSION)
      fail("catalogue_schema")
    const catalogueVersion = trimmed(
      raw.catalogueVersion,
      1,
      128,
      "catalogue_version",
    )
    if (!ASCII.test(catalogueVersion)) fail("catalogue_version")
    if (!EXPORT_GUIDE_LOCALES.includes(raw.locale as never))
      fail("catalogue_locale")
    if (
      !Array.isArray(raw.providers) ||
      raw.providers.length < 1 ||
      raw.providers.length > 50
    )
      fail("catalogue_providers")
    const rawProviders = raw.providers as unknown[]
    const providers = rawProviders.map(provider)
    if (new Set(providers.map(({ slug }) => slug)).size !== providers.length)
      fail("provider_duplicate")
    const generic = providers.find(({ slug }) => slug === "generic")
    if (
      !generic ||
      !generic.selectable ||
      generic.compatibility.minClientSchema > EXPORT_GUIDE_SCHEMA_VERSION ||
      generic.compatibility.maxClientSchema < EXPORT_GUIDE_SCHEMA_VERSION
    )
      fail("generic_invalid")
    const normalized: ExportGuideCatalogueV1 = {
      schemaVersion: EXPORT_GUIDE_SCHEMA_VERSION,
      catalogueVersion,
      locale: raw.locale as ExportGuideLocale,
      providers,
    }
    if (
      Buffer.byteLength(JSON.stringify(normalized), "utf8") >
      EXPORT_GUIDE_MAX_BODY_BYTES
    )
      fail("catalogue_bytes")
    return deepFreeze(normalized) as ExportGuideCatalogueV1
  }

  validatePair(
    frValue: unknown,
    enValue: unknown,
    options: { initial?: boolean } = {},
  ): Readonly<Record<ExportGuideLocale, ExportGuideCatalogueV1>> {
    const fr = this.validate(frValue)
    const en = this.validate(enValue)
    if (fr.locale !== "fr" || en.locale !== "en") fail("locale_pair")
    if (fr.catalogueVersion !== en.catalogueVersion) fail("version_pair")
    if (fr.providers.length !== en.providers.length) fail("provider_parity")
    fr.providers.forEach((left, index) => {
      const right = en.providers[index]
      if (
        left.slug !== right.slug ||
        left.kind !== right.kind ||
        left.selectable !== right.selectable ||
        left.compatibility.minClientSchema !==
          right.compatibility.minClientSchema ||
        left.compatibility.maxClientSchema !==
          right.compatibility.maxClientSchema ||
        left.pages.length !== right.pages.length ||
        Boolean(left.thumbnail) !== Boolean(right.thumbnail) ||
        left.pages.some(
          (item, pageIndex) =>
            Boolean(item.image) !== Boolean(right.pages[pageIndex].image),
        )
      )
        fail("provider_parity")
    })
    if (options.initial) {
      const selectable = fr.providers
        .filter(({ selectable }) => selectable)
        .map(({ slug }) => slug)
      if (
        JSON.stringify(selectable) !==
        JSON.stringify(INITIAL_EXPORT_GUIDE_PROVIDER_SLUGS)
      )
        fail("initial_selectable_order")
    }
    return deepFreeze({ fr, en }) as Readonly<
      Record<ExportGuideLocale, ExportGuideCatalogueV1>
    >
  }
}
