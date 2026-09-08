import { getString, setString, STORAGE_KEYS } from "@/storage"

import {
  EXPORT_GUIDE_CLIENT_SCHEMA,
  EXPORT_GUIDE_MAX_AGE_MS,
  EXPORT_GUIDE_PROVIDER_SLUG,
} from "./constants"
import { deepFreeze } from "./immutable"
import { parseExportGuideCatalogue } from "./parser"
import type {
  ExportGuideCatalogue,
  ExportGuideLocale,
  ExportGuideProviderRejection,
  ExportGuideSelector,
} from "./types"

interface RegistryDocument {
  readonly version: 1
  readonly records: Readonly<Record<string, unknown>>
}

export interface ExportGuideCacheRecord {
  readonly version: 1
  readonly requestedLocale: ExportGuideLocale
  readonly clientSchema: 1
  readonly selector: ExportGuideSelector
  readonly resolvedCatalogueVersion: string
  readonly responseLanguage: ExportGuideLocale
  readonly etag: string
  readonly validatedAt: number
  readonly catalogue: ExportGuideCatalogue
}

export interface ExportGuideClock {
  wallNow(): number
  monotonicNow(): number
}

export const systemExportGuideClock: ExportGuideClock = {
  wallNow: () => Date.now(),
  monotonicNow: () => performance.now(),
}

type Observation = Readonly<{
  validatedAt: number
  baseAge: number
  observedMonotonic: number
}>

const observations = new Map<string, Observation>()

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const isLocale = (value: unknown): value is ExportGuideLocale =>
  value === "fr" || value === "en"

const isProviderRejection = (
  value: unknown,
): value is ExportGuideProviderRejection =>
  value === "unknown_kind" || value === "incompatible" || value === "invalid"

const decodeRejectedProviders = (
  value: unknown,
  catalogue: ExportGuideCatalogue,
):
  | Readonly<Partial<Record<string, ExportGuideProviderRejection>>>
  | undefined => {
  if (!isObject(value)) return undefined
  const entries = Object.entries(value)
  if (catalogue.providers.length + entries.length > 50) return undefined

  const acceptedSlugs = new Set(catalogue.providers.map(({ slug }) => slug))
  const rejectedProviders: Partial<
    Record<string, ExportGuideProviderRejection>
  > = {}
  for (const [slug, rejection] of entries) {
    if (
      !EXPORT_GUIDE_PROVIDER_SLUG.test(slug) ||
      acceptedSlugs.has(slug) ||
      !isProviderRejection(rejection)
    ) {
      return undefined
    }
    rejectedProviders[slug] = rejection
  }
  return rejectedProviders
}

export const isStrongEtag = (value: unknown): value is string =>
  typeof value === "string" && /^"[\x21\x23-\x5b\x5d-\x7e]+"$/.test(value)

const isSelector = (value: unknown): value is ExportGuideSelector => {
  if (!isObject(value)) return false
  if (value.kind === "active") return true
  return (
    value.kind === "exact" &&
    typeof value.catalogueVersion === "string" &&
    value.catalogueVersion.length >= 1 &&
    value.catalogueVersion.length <= 128 &&
    /^[\x20-\x7e]+$/.test(value.catalogueVersion)
  )
}

export const exportGuideCacheKey = (
  locale: ExportGuideLocale,
  selector: ExportGuideSelector,
): string =>
  `${EXPORT_GUIDE_CLIENT_SCHEMA}:${locale}:${
    selector.kind === "active"
      ? "active"
      : `exact:${encodeURIComponent(selector.catalogueVersion)}`
  }`

const readDocument = (): RegistryDocument => {
  const raw = getString(STORAGE_KEYS.exportGuideLkgRegistry)
  if (raw === undefined) return { version: 1, records: {} }
  try {
    const value: unknown = JSON.parse(raw)
    if (!isObject(value) || value.version !== 1 || !isObject(value.records)) {
      return { version: 1, records: {} }
    }
    return { version: 1, records: value.records }
  } catch {
    return { version: 1, records: {} }
  }
}

const decodeRecord = (
  key: string,
  value: unknown,
): ExportGuideCacheRecord | undefined => {
  if (!isObject(value)) return undefined
  if (
    value.version !== 1 ||
    !isLocale(value.requestedLocale) ||
    value.clientSchema !== EXPORT_GUIDE_CLIENT_SCHEMA ||
    !isSelector(value.selector) ||
    exportGuideCacheKey(value.requestedLocale, value.selector) !== key ||
    !isLocale(value.responseLanguage) ||
    value.responseLanguage !== value.requestedLocale ||
    !isStrongEtag(value.etag) ||
    !Number.isSafeInteger(value.validatedAt) ||
    (value.validatedAt as number) < 0 ||
    typeof value.resolvedCatalogueVersion !== "string"
  ) {
    return undefined
  }
  const parsed = parseExportGuideCatalogue(value.catalogue, {
    requestedLocale: value.requestedLocale,
    selector: value.selector,
  })
  if (
    !parsed.ok ||
    parsed.catalogue.catalogueVersion !== value.resolvedCatalogueVersion ||
    (value.selector.kind === "exact" &&
      value.resolvedCatalogueVersion !== value.selector.catalogueVersion)
  ) {
    return undefined
  }
  const rawCatalogue = value.catalogue
  const rejectedProviders = decodeRejectedProviders(
    isObject(rawCatalogue) ? rawCatalogue.rejectedProviders : undefined,
    parsed.catalogue,
  )
  if (rejectedProviders === undefined) return undefined

  const catalogue = deepFreeze({
    ...parsed.catalogue,
    rejectedProviders,
  } as ExportGuideCatalogue)
  return {
    version: 1,
    requestedLocale: value.requestedLocale,
    clientSchema: EXPORT_GUIDE_CLIENT_SCHEMA,
    selector: value.selector,
    resolvedCatalogueVersion: value.resolvedCatalogueVersion,
    responseLanguage: value.responseLanguage,
    etag: value.etag,
    validatedAt: value.validatedAt as number,
    catalogue,
  }
}

export function readExportGuideCacheRecord(
  locale: ExportGuideLocale,
  selector: ExportGuideSelector,
): ExportGuideCacheRecord | undefined {
  const key = exportGuideCacheKey(locale, selector)
  return decodeRecord(key, readDocument().records[key])
}

export function writeExportGuideCacheRecord(
  record: ExportGuideCacheRecord,
): void {
  const current = readDocument()
  const records: Record<string, ExportGuideCacheRecord> = {}
  for (const [key, value] of Object.entries(current.records)) {
    const decoded = decodeRecord(key, value)
    if (decoded !== undefined) records[key] = decoded
  }
  const key = exportGuideCacheKey(record.requestedLocale, record.selector)
  records[key] = record
  setString(
    STORAGE_KEYS.exportGuideLkgRegistry,
    JSON.stringify({ version: 1, records }),
  )
}

export function observeExportGuideCacheRecord(
  record: ExportGuideCacheRecord,
  clock: ExportGuideClock,
): void {
  observations.set(
    exportGuideCacheKey(record.requestedLocale, record.selector),
    {
      validatedAt: record.validatedAt,
      baseAge: 0,
      observedMonotonic: clock.monotonicNow(),
    },
  )
}

export function exportGuideCacheAge(
  record: ExportGuideCacheRecord,
  clock: ExportGuideClock,
): number | undefined {
  const key = exportGuideCacheKey(record.requestedLocale, record.selector)
  let observation = observations.get(key)
  if (
    observation === undefined ||
    observation.validatedAt !== record.validatedAt
  ) {
    const baseAge = clock.wallNow() - record.validatedAt
    if (baseAge < 0) return undefined
    observation = {
      validatedAt: record.validatedAt,
      baseAge,
      observedMonotonic: clock.monotonicNow(),
    }
    observations.set(key, observation)
  }
  const elapsed = clock.monotonicNow() - observation.observedMonotonic
  if (elapsed < 0) return undefined
  return observation.baseAge + elapsed
}

export function isFreshExportGuideCacheRecord(
  record: ExportGuideCacheRecord,
  clock: ExportGuideClock,
): boolean {
  const age = exportGuideCacheAge(record, clock)
  return age !== undefined && age <= EXPORT_GUIDE_MAX_AGE_MS
}

export function resetExportGuideCacheObservationsForTests(): void {
  observations.clear()
}
