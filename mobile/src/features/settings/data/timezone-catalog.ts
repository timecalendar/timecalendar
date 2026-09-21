import { getTimezoneOffset } from "date-fns-tz"

import { GENERATED_TIMEZONE_CATALOG } from "./timezone-catalog.generated"

export type TimezoneCatalogLocale = "en" | "fr"

export interface TimezoneCatalogRecord {
  readonly id: string
  readonly alternativeName?: string
  readonly countryCode?: string
  readonly countryName?: string
  readonly mainCities: readonly string[]
  readonly labels: Readonly<
    Record<
      TimezoneCatalogLocale,
      Readonly<{ exemplarCity?: string; territory?: string }>
    >
  >
}

const catalog = GENERATED_TIMEZONE_CATALOG as readonly TimezoneCatalogRecord[]
const recordsById = new Map(catalog.map((record) => [record.id, record]))
const runtimeSupport = new Map<string, boolean>()

export const TIMEZONE_CATALOG: readonly TimezoneCatalogRecord[] = catalog

export function getTimezoneRecord(
  identifier: string,
): TimezoneCatalogRecord | undefined {
  return recordsById.get(identifier)
}

export function hasTimezoneRecord(identifier: string): boolean {
  return recordsById.has(identifier)
}

function readableIdentifier(identifier: string): string {
  return identifier.split("/").at(-1)!.replaceAll("_", " ")
}

export function getTimezoneCityLabel(
  record: TimezoneCatalogRecord,
  locale: TimezoneCatalogLocale,
): string {
  return (
    record.labels[locale].exemplarCity ??
    record.mainCities[0] ??
    readableIdentifier(record.id)
  )
}

export function getTimezoneTerritoryLabel(
  record: TimezoneCatalogRecord,
  locale: TimezoneCatalogLocale,
): string | undefined {
  return record.labels[locale].territory ?? record.countryName
}

export function isTimezoneRuntimeSupported(identifier: string): boolean {
  const cached = runtimeSupport.get(identifier)
  if (cached !== undefined) return cached
  let supported = false
  try {
    new Intl.DateTimeFormat("en", { timeZone: identifier }).format(0)
    supported = true
  } catch {
    supported = false
  }
  runtimeSupport.set(identifier, supported)
  return supported
}

export function clearTimezoneRuntimeSupportCache(): void {
  runtimeSupport.clear()
}

export function formatTimezoneOffset(
  identifier: string,
  instant: Date,
): string | undefined {
  if (!isTimezoneRuntimeSupported(identifier)) return undefined
  const offsetMinutes = getTimezoneOffset(identifier, instant) / 60_000
  const sign = offsetMinutes < 0 ? "−" : "+"
  const absolute = Math.abs(offsetMinutes)
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`
}

export function normalizeTimezoneSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

interface IndexedRecord {
  readonly record: TimezoneCatalogRecord
  readonly fields: readonly string[]
  readonly haystack: string
}

const searchIndex: readonly IndexedRecord[] = catalog.map((record) => {
  const fields = [
    record.id,
    ...record.id.split("/"),
    record.alternativeName,
    ...record.mainCities,
    record.countryName,
    record.labels.en.exemplarCity,
    record.labels.fr.exemplarCity,
    record.labels.en.territory,
    record.labels.fr.territory,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeTimezoneSearch)
  return { record, fields, haystack: fields.join(" ") }
})

function localeSortKey(
  record: TimezoneCatalogRecord,
  locale: TimezoneCatalogLocale,
): string {
  return normalizeTimezoneSearch(
    `${getTimezoneTerritoryLabel(record, locale) ?? ""} ${getTimezoneCityLabel(record, locale)} ${record.id}`,
  )
}

export function searchTimezones(
  query: string,
  locale: TimezoneCatalogLocale,
  pinnedIdentifier?: string,
): readonly TimezoneCatalogRecord[] {
  const normalizedQuery = normalizeTimezoneSearch(query)
  const queryTokens = normalizedQuery.split(" ").filter(Boolean)
  const sorted = searchIndex
    .filter(({ haystack }) =>
      queryTokens.every((token) => haystack.includes(token)),
    )
    .slice()
    .sort((a, b) => {
      if (normalizedQuery) {
        const score = (entry: IndexedRecord) =>
          normalizeTimezoneSearch(entry.record.id) === normalizedQuery
            ? 0
            : entry.fields.includes(normalizedQuery)
              ? 1
              : entry.fields.some((field) => field.startsWith(normalizedQuery))
                ? 2
                : 3
        const difference = score(a) - score(b)
        if (difference !== 0) return difference
      }
      return (
        localeSortKey(a.record, locale).localeCompare(
          localeSortKey(b.record, locale),
        ) || a.record.id.localeCompare(b.record.id)
      )
    })
  if (!normalizedQuery && pinnedIdentifier) {
    const pinnedIndex = sorted.findIndex(
      ({ record }) => record.id === pinnedIdentifier,
    )
    if (pinnedIndex > 0) sorted.unshift(...sorted.splice(pinnedIndex, 1))
  }
  return sorted.map(({ record }) => record)
}
