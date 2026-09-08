import {
  EXPORT_GUIDE_ASSET_ORIGINS,
  EXPORT_GUIDE_CLIENT_SCHEMA,
  EXPORT_GUIDE_IMAGE_MAX_BYTES,
  EXPORT_GUIDE_IMAGE_MAX_DIMENSION,
  EXPORT_GUIDE_IMAGE_MAX_PIXELS,
  EXPORT_GUIDE_MAX_BODY_BYTES,
  EXPORT_GUIDE_MIME_TYPES,
  EXPORT_GUIDE_PROVIDER_SLUG,
} from "./constants"
import { deepFreeze } from "./immutable"
import type {
  ExportGuideCatalogue,
  ExportGuideImage,
  ExportGuideLocale,
  ExportGuideMimeType,
  ExportGuidePage,
  ExportGuideParseFailure,
  ExportGuideParseResult,
  ExportGuideProvider,
  ExportGuideProviderRejection,
  ExportGuideSelector,
} from "./types"

type UnknownRecord = Record<string, unknown>
type ImageRole = keyof typeof EXPORT_GUIDE_IMAGE_MAX_BYTES

class ParseError extends Error {
  constructor(readonly failure: ExportGuideParseFailure) {
    super(failure)
  }
}

const fail = (failure: ExportGuideParseFailure): never => {
  throw new ParseError(failure)
}

const asObject = (value: unknown): UnknownRecord => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail("invalid_envelope")
  }
  return value as UnknownRecord
}

const asTrimmedString = (value: unknown, min: number, max: number): string => {
  if (
    typeof value !== "string" ||
    value.length < min ||
    value.length > max ||
    value.trim() !== value
  ) {
    return fail("invalid_envelope")
  }
  return value
}

const asInteger = (value: unknown, min: number, max: number): number => {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < min ||
    (value as number) > max
  ) {
    return fail("invalid_envelope")
  }
  return value as number
}

const utf8ByteLength = (value: string): number => {
  let bytes = 0
  for (const character of value) {
    const codePoint = character.codePointAt(0)!
    if (codePoint <= 0x7f) bytes += 1
    else if (codePoint <= 0x7ff) bytes += 2
    else if (codePoint <= 0xffff) bytes += 3
    else bytes += 4
  }
  return bytes
}

const parseImage = (value: unknown, role: ImageRole): ExportGuideImage => {
  const raw = asObject(value)
  const urlText = asTrimmedString(raw.url, 1, 2048)
  let url: URL
  try {
    url = new URL(urlText)
  } catch {
    return fail("invalid_envelope")
  }
  if (
    url.protocol !== "https:" ||
    !EXPORT_GUIDE_ASSET_ORIGINS.includes(
      url.origin as (typeof EXPORT_GUIDE_ASSET_ORIGINS)[number],
    ) ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== "" ||
    url.port !== "" ||
    /^https:\/\/[^/]+:\d+(?:\/|$)/.test(urlText)
  ) {
    return fail("invalid_envelope")
  }

  if (!EXPORT_GUIDE_MIME_TYPES.includes(raw.mimeType as ExportGuideMimeType)) {
    return fail("invalid_envelope")
  }
  const width = asInteger(raw.width, 1, EXPORT_GUIDE_IMAGE_MAX_DIMENSION)
  const height = asInteger(raw.height, 1, EXPORT_GUIDE_IMAGE_MAX_DIMENSION)
  if (width * height > EXPORT_GUIDE_IMAGE_MAX_PIXELS) {
    return fail("invalid_envelope")
  }
  const caption =
    raw.caption === undefined ? undefined : asTrimmedString(raw.caption, 1, 500)
  return {
    url: urlText,
    mimeType: raw.mimeType as ExportGuideMimeType,
    byteSize: asInteger(raw.byteSize, 1, EXPORT_GUIDE_IMAGE_MAX_BYTES[role]),
    width,
    height,
    altText: asTrimmedString(raw.altText, 1, 500),
    ...(caption === undefined ? {} : { caption }),
  }
}

const parsePage = (value: unknown): ExportGuidePage => {
  const raw = asObject(value)
  return {
    title: asTrimmedString(raw.title, 1, 120),
    description: asTrimmedString(raw.description, 1, 2000),
    ...(raw.image === undefined
      ? {}
      : { image: parseImage(raw.image, "page") }),
  }
}

type ProviderResult =
  | Readonly<{ ok: true; provider: ExportGuideProvider }>
  | Readonly<{
      ok: false
      slug?: string
      rejection: ExportGuideProviderRejection
    }>

const parseProvider = (value: unknown): ProviderResult => {
  let raw: UnknownRecord
  try {
    raw = asObject(value)
  } catch {
    return { ok: false, rejection: "invalid" }
  }

  const slug =
    typeof raw.slug === "string" && EXPORT_GUIDE_PROVIDER_SLUG.test(raw.slug)
      ? raw.slug
      : undefined
  if (raw.kind !== "pages") {
    return {
      ok: false,
      ...(slug === undefined ? {} : { slug }),
      rejection: "unknown_kind",
    }
  }

  try {
    const compatibility = asObject(raw.compatibility)
    const minClientSchema = asInteger(
      compatibility.minClientSchema,
      1,
      Number.MAX_SAFE_INTEGER,
    )
    const maxClientSchema = asInteger(
      compatibility.maxClientSchema,
      1,
      Number.MAX_SAFE_INTEGER,
    )
    if (minClientSchema > maxClientSchema) fail("invalid_envelope")
    if (
      minClientSchema > EXPORT_GUIDE_CLIENT_SCHEMA ||
      maxClientSchema < EXPORT_GUIDE_CLIENT_SCHEMA
    ) {
      return {
        ok: false,
        ...(slug === undefined ? {} : { slug }),
        rejection: "incompatible",
      }
    }
    if (
      slug === undefined ||
      typeof raw.selectable !== "boolean" ||
      !Array.isArray(raw.pages) ||
      raw.pages.length < 1 ||
      raw.pages.length > 20
    ) {
      return {
        ok: false,
        ...(slug === undefined ? {} : { slug }),
        rejection: "invalid",
      }
    }
    const thumbnail =
      raw.thumbnail === undefined
        ? undefined
        : parseImage(raw.thumbnail, "thumbnail")
    return {
      ok: true,
      provider: {
        slug,
        label: asTrimmedString(raw.label, 1, 80),
        kind: "pages",
        selectable: raw.selectable,
        compatibility: { minClientSchema, maxClientSchema },
        ...(thumbnail === undefined ? {} : { thumbnail }),
        pages: raw.pages.map(parsePage),
      },
    }
  } catch {
    return {
      ok: false,
      ...(slug === undefined ? {} : { slug }),
      rejection: "invalid",
    }
  }
}

export interface ParseExportGuideOptions {
  readonly requestedLocale: ExportGuideLocale
  readonly selector: ExportGuideSelector
  readonly encodedBodyBytes?: number
}

export function parseExportGuideCatalogue(
  value: unknown,
  options: ParseExportGuideOptions,
): ExportGuideParseResult {
  try {
    if (
      options.encodedBodyBytes !== undefined &&
      (!Number.isSafeInteger(options.encodedBodyBytes) ||
        options.encodedBodyBytes < 0 ||
        options.encodedBodyBytes > EXPORT_GUIDE_MAX_BODY_BYTES)
    ) {
      return { ok: false, failure: "oversized" }
    }
    let serialized: string
    try {
      serialized = JSON.stringify(value)
    } catch {
      return { ok: false, failure: "invalid_envelope" }
    }
    if (utf8ByteLength(serialized ?? "") > EXPORT_GUIDE_MAX_BODY_BYTES) {
      return { ok: false, failure: "oversized" }
    }

    const raw = asObject(value)
    if (raw.schemaVersion !== EXPORT_GUIDE_CLIENT_SCHEMA) {
      return { ok: false, failure: "unsupported_schema" }
    }
    if (raw.locale !== options.requestedLocale) {
      return { ok: false, failure: "locale_mismatch" }
    }
    const catalogueVersion = asTrimmedString(raw.catalogueVersion, 1, 128)
    if (!/^[\x20-\x7e]+$/.test(catalogueVersion)) {
      return { ok: false, failure: "invalid_envelope" }
    }
    if (
      options.selector.kind === "exact" &&
      catalogueVersion !== options.selector.catalogueVersion
    ) {
      return { ok: false, failure: "version_mismatch" }
    }
    if (
      !Array.isArray(raw.providers) ||
      raw.providers.length < 1 ||
      raw.providers.length > 50
    ) {
      return { ok: false, failure: "invalid_envelope" }
    }

    const providers: ExportGuideProvider[] = []
    const rejectedProviders: Partial<
      Record<string, ExportGuideProviderRejection>
    > = {}
    const validSlugs = new Set<string>()
    for (const candidate of raw.providers) {
      const result = parseProvider(candidate)
      if (result.ok) {
        const provider = result.provider
        if (validSlugs.has(provider.slug)) {
          return {
            ok: false,
            failure:
              provider.slug === "generic"
                ? "invalid_generic"
                : "invalid_envelope",
          }
        }
        validSlugs.add(provider.slug)
        providers.push(provider)
      } else if (result.slug !== undefined) {
        if (validSlugs.has(result.slug)) {
          return {
            ok: false,
            failure:
              result.slug === "generic"
                ? "invalid_generic"
                : "invalid_envelope",
          }
        }
        validSlugs.add(result.slug)
        rejectedProviders[result.slug] = result.rejection
      }
    }

    const generic = providers.find(({ slug }) => slug === "generic")
    if (generic === undefined || !generic.selectable) {
      return { ok: false, failure: "invalid_generic" }
    }

    return {
      ok: true,
      catalogue: deepFreeze({
        schemaVersion: EXPORT_GUIDE_CLIENT_SCHEMA,
        catalogueVersion,
        locale: raw.locale,
        providers,
        rejectedProviders,
      } as ExportGuideCatalogue),
    }
  } catch (error) {
    return {
      ok: false,
      failure: error instanceof ParseError ? error.failure : "invalid_envelope",
    }
  }
}
