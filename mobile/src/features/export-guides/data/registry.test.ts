import * as storage from "@/storage"

import { parseExportGuideCatalogue } from "./parser"
import {
  exportGuideCacheKey,
  type ExportGuideCacheRecord,
  isStrongEtag,
  readExportGuideCacheRecord,
  writeExportGuideCacheRecord,
} from "./registry"

const active = { kind: "active" } as const
const exact = { kind: "exact", catalogueVersion: "v1" } as const

const validatedCatalogue = (locale: "fr" | "en" = "en", version = "v1") => {
  const parsed = parseExportGuideCatalogue(
    {
      schemaVersion: 1,
      catalogueVersion: version,
      locale,
      providers: [
        {
          slug: "generic",
          label: "Other",
          kind: "pages",
          selectable: true,
          compatibility: { minClientSchema: 1, maxClientSchema: 1 },
          pages: [{ title: "Title", description: "Description" }],
        },
      ],
    },
    { requestedLocale: locale, selector: { kind: "active" } },
  )
  if (!parsed.ok) throw new Error(parsed.failure)
  return parsed.catalogue
}

const validatedCatalogueWithRejections = () => {
  const parsed = parseExportGuideCatalogue(
    {
      schemaVersion: 1,
      catalogueVersion: "v1",
      locale: "en",
      providers: [
        {
          slug: "future-provider",
          kind: "video",
        },
        ...validatedCatalogue().providers,
      ],
    },
    { requestedLocale: "en", selector: active },
  )
  if (!parsed.ok) throw new Error(parsed.failure)
  return parsed.catalogue
}

const record = (
  overrides: Partial<ExportGuideCacheRecord> = {},
): ExportGuideCacheRecord => ({
  version: 1,
  requestedLocale: "en",
  clientSchema: 1,
  selector: active,
  resolvedCatalogueVersion: "v1",
  responseLanguage: "en",
  etag: '"etag"',
  validatedAt: 1000,
  catalogue: validatedCatalogue(),
  ...overrides,
})

beforeEach(() => storage.remove(storage.STORAGE_KEYS.exportGuideLkgRegistry))

describe("export-guide LKG registry", () => {
  it.each([
    ['"strong"', true],
    ['W/"weak"', false],
    ["unquoted", false],
    ['""', false],
    ['"back\\slash"', false],
  ])("classifies strong ETag %p", (value, expected) => {
    expect(isStrongEtag(value)).toBe(expected)
  })

  it("round-trips active/exact and locale records without collision", () => {
    const records = [
      record(),
      record({ selector: exact }),
      record({
        requestedLocale: "fr",
        responseLanguage: "fr",
        catalogue: validatedCatalogue("fr"),
      }),
    ]
    records.forEach(writeExportGuideCacheRecord)
    expect(readExportGuideCacheRecord("en", active)?.selector).toEqual(active)
    expect(readExportGuideCacheRecord("en", exact)?.selector).toEqual(exact)
    expect(readExportGuideCacheRecord("fr", active)?.catalogue.locale).toBe(
      "fr",
    )
    expect(
      Object.keys(
        JSON.parse(
          storage.getString(storage.STORAGE_KEYS.exportGuideLkgRegistry) ??
            "{}",
        ).records,
      ),
    ).toHaveLength(3)
  })

  it("round-trips the validated provider rejection index", () => {
    writeExportGuideCacheRecord(
      record({ catalogue: validatedCatalogueWithRejections() }),
    )

    expect(
      readExportGuideCacheRecord("en", active)?.catalogue.rejectedProviders,
    ).toEqual({ "future-provider": "unknown_kind" })
  })

  it.each([
    ["non-object", []],
    ["invalid slug", { "Invalid Slug": "invalid" }],
    ["invalid reason", { future: "missing" }],
    ["accepted-provider collision", { generic: "invalid" }],
    [
      "more entries than the provider bound",
      Object.fromEntries(
        Array.from({ length: 50 }, (_, index) => [
          `future-${index}`,
          "invalid",
        ]),
      ),
    ],
  ])("rejects a %s rejection index", (_name, rejectedProviders) => {
    const key = exportGuideCacheKey("en", active)
    const cachedRecord = record()
    storage.setString(
      storage.STORAGE_KEYS.exportGuideLkgRegistry,
      JSON.stringify({
        version: 1,
        records: {
          [key]: {
            ...cachedRecord,
            catalogue: { ...cachedRecord.catalogue, rejectedProviders },
          },
        },
      }),
    )

    expect(readExportGuideCacheRecord("en", active)).toBeUndefined()
  })

  it.each([
    ["wrong record version", { version: 2 }],
    ["wrong locale", { requestedLocale: "fr" }],
    ["wrong schema", { clientSchema: 2 }],
    ["wrong response language", { responseLanguage: "fr" }],
    ["weak ETag", { etag: 'W/"weak"' }],
    ["fractional timestamp", { validatedAt: 1.5 }],
    ["negative timestamp", { validatedAt: -1 }],
    ["wrong resolved version", { resolvedCatalogueVersion: "v2" }],
    ["foreign selector", { selector: exact }],
    ["invalid catalogue", { catalogue: { schemaVersion: 2 } }],
  ])("total-decodes %s as absent", (_name, mutation) => {
    const key = exportGuideCacheKey("en", active)
    storage.setString(
      storage.STORAGE_KEYS.exportGuideLkgRegistry,
      JSON.stringify({
        version: 1,
        records: { [key]: { ...record(), ...mutation } },
      }),
    )
    expect(readExportGuideCacheRecord("en", active)).toBeUndefined()
  })

  it("prunes corrupt sibling records on the next safe single write", () => {
    const goodKey = exportGuideCacheKey("en", active)
    storage.setString(
      storage.STORAGE_KEYS.exportGuideLkgRegistry,
      JSON.stringify({
        version: 1,
        records: {
          corrupt: { private: "discard" },
          [goodKey]: record(),
        },
      }),
    )
    writeExportGuideCacheRecord(record({ etag: '"new"' }))
    const persisted = JSON.parse(
      storage.getString(storage.STORAGE_KEYS.exportGuideLkgRegistry) ?? "{}",
    )
    expect(persisted.records).toEqual({
      [goodKey]: expect.objectContaining({ etag: '"new"' }),
    })
  })
})
